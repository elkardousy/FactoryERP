# Project Architecture

**Project:** Factory ERP — Backend API
**Stack:** NestJS 11 · Prisma 6 · PostgreSQL · TypeScript (ES2023, `nodenext`)
**Baseline:** Sprint 8 Foundation Freeze — 2026-06-26

---

## 1. Overall Architecture

Factory ERP follows a **modular monolith** architecture. The application is a single deployable unit structured as a collection of feature modules that share infrastructure provided by the `core` layer. There is no microservices boundary at this stage.

The design goals in priority order are:

1. **Correctness** — every data mutation is validated, audited, and transactionally safe.
2. **Security** — authentication, authorization, and secrets management are first-class citizens.
3. **Maintainability** — explicit layering and use-case decomposition make every feature independently testable.
4. **Scalability** — the architecture can be extracted into microservices if the domain demands it.

---

## 2. Layered Architecture

Strict layer ordering is enforced across the entire codebase:

```
HTTP Request
     │
     ▼
┌─────────────────┐
│   Controllers   │  Validate input · call one use case · return result
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Use Cases     │  Own business logic for one feature flow
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Services     │  Reusable, cross-cutting capabilities
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Repositories   │  Database access · only layer that touches PrismaService
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PrismaService  │  Connection lifecycle · raw Prisma client
└─────────────────┘
```

**Rules enforced by convention:**

- Controllers call exactly one use case per handler. They never call services or repositories directly.
- Services are stateless and reusable. `PasswordService`, `TokenService`, `SessionService` are shared across multiple use cases.
- Repositories are the sole boundary between the application and the database. No service or use case may inject `PrismaService` directly.
- Use cases orchestrate the full flow for one operation (login, refresh, logout). They inject whatever services and repositories they need.

---

## 3. Module Boundaries

Each module is a self-contained NestJS module with explicit imports and exports.

```
AppModule
├── ConfigModule (global)
├── PrismaModule (global)
├── LoggerModule (global)
├── ThrottlerModule
└── AuthModule
    ├── exports: AuthService, JwtAuthGuard, JwtService, UsersRepository
    └── providers: (all internal — see Module Layout)
```

**Global modules** (`@Global()`) are registered once in `AppModule` and injected into any module without re-importing:

| Module | Provides |
|---|---|
| `PrismaModule` | `PrismaService`, `DatabaseHealthService` |
| `LoggerModule` | `LoggerService` (wraps `PinoLogger`) |
| `ConfigModule` | `ConfigService` |

**Feature modules** import only what they need. `AuthModule` does not re-import `PrismaModule` or `ConfigModule` because they are global.

---

## 4. Dependency Direction

Dependencies always flow inward (toward the domain). The dependency rule is:

```
core/  ←──── modules/auth/  ←──── (future modules)
```

- `core/` has no dependency on any feature module.
- `modules/auth/` depends on `core/` infrastructure but knows nothing about other feature modules.
- Future modules may depend on `AuthModule` exports (`JwtAuthGuard`, `AuthService`) but must not reach into its internals.

No circular imports exist. Enforced by NestJS module resolution and TypeScript `isolatedModules`.

---

## 5. Repository Pattern

Every repository:

- Extends `BaseRepository` (`src/core/database/repositories/base/base.repository.ts`).
- Receives `PrismaService` via constructor injection through `super(prisma)`.
- Exposes `protected readonly prisma` and the `protected get db()` alias.
- Uses `executeInTransaction<T>(callback)` for operations requiring atomicity.

```typescript
export abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaService) {}
  protected get db(): PrismaService { return this.prisma; }
  async executeInTransaction<T>(callback: (tx: PrismaService) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => callback(tx as PrismaService));
  }
}
```

**Active repositories at Foundation Freeze:**

| Repository | Table | Responsibilities |
|---|---|---|
| `UsersRepository` | `users` | findActive, findById, findByUsername, updateLastLogin, incrementFailedLogin |
| `UserSessionsRepository` | `user_sessions` | create, findById, findActiveByUserId, update, revokeById, revokeAllByUserId |
| `AuditRepository` | `audit_events` | create (append-only) |

**Special type considerations:** The `user_sessions` model has an `Unsupported("inet")` field (`ip_address`). The Prisma-generated type is not directly importable. Type alias `Prisma.user_sessionsGetPayload<object>` is used instead.

---

## 6. Authentication Architecture

Authentication is implemented in `src/modules/auth/` following the same layer pattern.

### Component Map

```
AuthController
    ├── LoginUseCase
    │     ├── AuthService.validateUser()
    │     ├── TokenService.generateTokenPair()
    │     ├── TokenService.hashRefreshToken()
    │     ├── SessionService.createSession()
    │     ├── TokenService.generateAccessToken()    ← re-sign with real sessionId
    │     └── AuditRepository.create()              ← best-effort
    ├── RefreshUseCase
    │     ├── SessionService.findSession()
    │     ├── SessionService.validateSession()
    │     ├── TokenService.compareRefreshToken()
    │     ├── UsersRepository.findActiveById()
    │     ├── TokenService.generateTokenPair()
    │     ├── TokenService.hashRefreshToken()
    │     ├── SessionService.refreshSession()
    │     └── AuditRepository.create()              ← best-effort
    └── LogoutUseCase
          ├── SessionService.revokeSession()
          └── AuditRepository.create()              ← best-effort
```

### Token Design

**Access token:** RS256 JWT signed by `@nestjs/jwt`. Payload `{ sub, username, roleId, sessionId }`. Expiry from `jwt.expiresIn` config (default `JWT_EXPIRES_IN` env var).

**Refresh token:** Composite string `"<sessionId>:<rawUUID>"`. The `sessionId` prefix allows server-side lookup without a full table scan. Only the raw UUID portion is stored as a bcrypt hash in `user_sessions.refresh_token_hash`. The composite format is what the client receives and returns.

**Rotation:** Every `POST /v1/auth/refresh` replaces `refresh_token_hash` with a new hash. A replayed stale refresh token is rejected because bcrypt comparison fails.

### Per-Request Validation

`JwtStrategy` extends `PassportStrategy(Strategy)`. On every authenticated request it:
1. Extracts the bearer token from `Authorization` header.
2. Verifies the JWT signature and expiry.
3. Calls `AuthService.findActiveById(payload.sub)` — a live DB query checking `is_active` and `status = ACTIVE`.
4. Checks `locked_at !== null` — a locked account is rejected even with a valid token.
5. Returns the full `JwtPayload` so `@CurrentUser()` resolves it downstream.

---

## 7. Configuration Architecture

All application configuration is accessed through NestJS `ConfigService`. Direct `process.env` access is only permitted inside config factory functions and `PrismaService` constructor.

**Config namespaces:**

| Namespace | Keys | Source |
|---|---|---|
| `app` | `name`, `env`, `port` | `app.config.ts` |
| `database` | `url` | `database.config.ts` |
| `jwt` | `secret`, `expiresIn`, `refreshExpiresIn` | `jwt.config.ts` |
| `logger` | `level` | `logger.config.ts` |

**Startup validation** is performed by Joi schema in `env.validation.ts`. The following environment variables are required at startup:

| Variable | Required | Default |
|---|---|---|
| `NODE_ENV` | Yes | — |
| `DATABASE_URL` | Yes | — |
| `JWT_SECRET` | Yes | — |
| `JWT_EXPIRES_IN` | Yes | — |
| `REFRESH_EXPIRES_IN` | Yes | — |
| `APP_NAME` | No | `Factory ERP` |
| `PORT` | No | `3000` |
| `LOG_LEVEL` | No | `info` |

If any required variable is missing, the application fails to start with a descriptive error before accepting any requests.

---

## 8. Logging Architecture

Logging is provided by `nestjs-pino` (a structured JSON logger backed by Pino).

**Architecture:**
- `LoggerModule` is `@Global()`, exported as `LoggerService`.
- `LoggerService` wraps `PinoLogger` and exposes `info()`, `warn()`, `error()`, `debug()`.
- HTTP request/response logging is automatic via `pinoHttp`.
- In `development`: pretty-printed output via `pino-pretty` (colorized, human-readable).
- In `production`: raw NDJSON to stdout, suitable for log aggregation (Loki, Datadog, CloudWatch).

**Sensitive header redaction (automatic):**
- `req.headers.authorization`
- `req.headers.cookie`
- `res.headers["set-cookie"]`

**Convention:** All application code uses `LoggerService`, never `console.log`.

---

## 9. Exception Handling

Two global filters are registered imperatively in `main.ts` in a specific order:

```typescript
app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());
```

NestJS evaluates filters in the order registered; the first matching filter handles the exception.

| Filter | Catches | Maps |
|---|---|---|
| `PrismaExceptionFilter` | `Prisma.PrismaClientKnownRequestError` | P2002→409, P2025→404, P2003→400, P2014→409 |
| `AllExceptionsFilter` | Everything else | `HttpException`→its status, anything else→500 |

Both filters produce an `ErrorResponse` shaped as:

```json
{
  "success": false,
  "statusCode": 401,
  "error": "UnauthorizedException",
  "message": "Invalid username or password.",
  "path": "/v1/auth/login",
  "timestamp": "2026-06-26T10:00:00.000Z"
}
```

Filters are registered imperatively (not via DI) so they cannot inject services. This is correct behavior for `@Catch()`-based global filters.

---

## 10. Validation

Input validation is handled by `GlobalValidationPipe` registered in `main.ts`:

```typescript
app.useGlobalPipes(GlobalValidationPipe);
```

**Pipe behavior:**
- `transform: true` — automatically transforms plain objects to DTO class instances.
- `whitelist: true` — strips any properties not defined in the DTO.
- `forbidNonWhitelisted: true` — returns 400 if unrecognized properties are sent.
- `enableImplicitConversion: true` — automatically coerces query/param string types (e.g., `"42"` → `number`).
- `stopAtFirstError: false` — collects all validation errors in a single response.
- `exceptionFactory` — flattens nested validation errors into a flat `string[]` for consistent API error shape.

Validation is driven by `class-validator` decorators on DTO classes.

---

## 11. Swagger

Swagger UI is available at `/api/docs` in all environments. It is configured in `src/core/config/swagger.config.ts` and registered via `setupSwagger(app)` in `main.ts`.

**Configuration:**
- Title: `Factory ERP API`
- Version: `1.0.0`
- Bearer JWT auth scheme (`Authorization: Bearer <token>`)
- Protected endpoints use `@ApiBearerAuth('JWT')`.

**Convention for all endpoints:**
- Controllers declare `@ApiTags('ModuleName')`.
- Each handler declares `@ApiOperation({ summary })`.
- Each response code has a matching `@ApiResponse({ status, description })`.
- DTOs have `@ApiProperty()` on every field.

---

## 12. Security Middleware

Three layers of security are applied in `main.ts` before routing:

| Layer | Package | Purpose |
|---|---|---|
| `helmet()` | `helmet ^8` | Sets 14 HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) |
| `compression()` | `compression ^1.8` | Gzip response compression |
| `enableCors()` | Built-in NestJS | CORS headers; `X-Correlation-ID` exposed to clients |
| `CorrelationIdMiddleware` | Custom | Reads or generates `X-Correlation-ID` on every request |
| `ThrottlerGuard` | `@nestjs/throttler ^6` | Rate limiting; default 60 req/60s; login overridden to 10 req/60s |

---

## 13. URI Versioning

All routes are prefixed with `/v1/`. NestJS URI versioning is configured with:

```typescript
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
```

Controllers declare their version: `@Controller({ path: 'auth', version: '1' })`.

The default version (`'1'`) means any controller without an explicit `version` annotation also serves under `/v1/`.
