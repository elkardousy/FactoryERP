# 02 — Architecture Baseline

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Architectural Pattern

NestJS monolith implementing **Clean Architecture** with strict layer ordering.

```
HTTP Request
     │
     ▼
  Controllers          (thin — validate input, call one use case, return result)
     │
     ▼
  Use Cases            (all business logic per feature)
     │
     ▼
  Services             (reusable, cross-cutting: PasswordService, TokenService, etc.)
     │
     ▼
  Repositories         (only layer touching PrismaService)
     │
     ▼
  PrismaService        (database access)
     │
     ▼
  PostgreSQL (factory schema)
```

**Absolute rule:** Repositories are the ONLY layer permitted to inject `PrismaService`. Services must never inject it directly.

---

## Application Bootstrap (`src/main.ts`)

| Step | Detail |
|------|--------|
| Logger | `app.useLogger(app.get(Logger))` — Pino logger |
| Security | Helmet (HTTP headers) + compression |
| CORS | Enabled, exposes `X-Correlation-ID` header |
| Global filters | `PrismaExceptionFilter` first, then `AllExceptionsFilter` |
| Global pipe | `GlobalValidationPipe` |
| Versioning | `VersioningType.URI`, defaultVersion `'1'` |
| Shutdown hooks | `prismaService.enableShutdownHooks(app)` |
| Swagger | `setupSwagger(app)` at `/api/docs` |
| Port | From `app.port` config, fallback 3000 |

**Filter order matters:** `PrismaExceptionFilter` must be listed before `AllExceptionsFilter` in `useGlobalFilters`. NestJS evaluates in reverse registration order (last registered = first evaluated). More specific filter must be listed first.

---

## Guard Stack (AppModule — applied globally in order)

```
Request
   │
   ▼
ThrottlerGuard          (rate limit: 60 req / 60s)
   │
   ▼
JwtAuthGuard            (validates Bearer JWT, populates user)
   │
   ▼
RolesGuard              (checks @Roles decorator against user role)
   │
   ▼
ScreenPermissionGuard   (checks screen-level CRUD permissions)
   │
   ▼
Controller handler
```

Guards are registered as `APP_GUARD` providers in `AppModule` — applied to every route. Routes marked `@Public()` bypass `JwtAuthGuard`.

---

## Global Modules

| Module | Scope | Exports |
|--------|-------|---------|
| `PrismaModule` | `@Global()` | `PrismaService` |
| `LoggerModule` | `@Global()` | `LoggerService` |
| `AuditModule` | `@Global()` | `AuditService` |
| `DocumentNumberingModule` | `@Global()` | `DocumentNumberingService` |

Do NOT import these modules again in individual feature modules — they are already available everywhere.

---

## AppModule Imports

```
ConfigModule (global, cached)
PrismaModule
LoggerModule
AuditModule
DocumentNumberingModule
OrganizationModule
MeasurementsModule
WarehousesModule
ProductionSetupModule
CustomersModule
SuppliersModule
GarmentModelsModule
AuthModule
AuthorizationModule
InventoryModule
ThrottlerModule (60 req / 60s)
```

---

## Middleware

`CorrelationIdMiddleware` applied to all routes (`'*'`).  
Adds/propagates `X-Correlation-ID` header for request tracing.

---

## Response Envelope (ResponseInterceptor)

All responses are wrapped:

```json
{
  "data": <payload>,
  "statusCode": 200,
  "timestamp": "2026-06-28T...",
  "path": "/v1/inventory/transactions"
}
```

`serializeBigInts()` is called on the payload before wrapping — converts all `BigInt` values to strings recursively.

---

## Exception Handling

### PrismaExceptionFilter

Maps Prisma error codes to HTTP status codes:

| Prisma Code | Meaning | HTTP Status |
|-------------|---------|-------------|
| P2002 | Unique constraint violation | 409 Conflict |
| P2025 | Record not found | 404 Not Found |
| P2003 | Foreign key constraint | 400 Bad Request |
| P2014 | Relation violation | 409 Conflict |

### AllExceptionsFilter

Catch-all fallback — wraps everything in `ErrorResponse`.

### Application-level exceptions

Throw NestJS HTTP exceptions from services/use-cases:
- `NotFoundException` (404)
- `UnauthorizedException` (401)
- `ConflictException` (409)
- `BadRequestException` (400)
- `UnprocessableEntityException` (422)

---

## Configuration System

All config via `ConfigService`, never `process.env` directly.

| Namespace | Keys |
|-----------|------|
| `app` | `name`, `env`, `port` |
| `database` | `url` |
| `jwt` | `secret`, `expiresIn`, `refreshExpiresIn` |
| `logger` | `level` |

Known exceptions where `process.env` is used directly:
- `PrismaService` constructor
- `loggerConfig` constant

`prisma.config.ts` causes Prisma CLI to skip `.env` loading — always prefix Prisma CLI commands with `DATABASE_URL=`.

---

## BaseRepository Contract

```typescript
abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaService) {}
  
  protected get db(): PrismaService   // alias for this.prisma
  
  async executeInTransaction<T>(
    callback: (tx: PrismaService) => Promise<T>
  ): Promise<T>                       // wraps callback in $transaction
}
```

All repositories extend `BaseRepository`. The transaction callback receives `tx as PrismaService` — treat it as `Prisma.TransactionClient` inside the callback.

---

## URI Versioning

All routes prefixed with `/v1/`. Controllers declare:

```typescript
@Controller({ path: 'resource', version: '1' })
```

Default version is `'1'` (set in `main.ts`).

---

## Swagger

- Available at `/api/docs`
- Bearer JWT configured (`Bearer JWT` security scheme)
- Controllers use `@ApiBearerAuth('JWT')`
- DTOs use `@ApiProperty()`
- Tags group endpoints by feature

---

## Module Anatomy (Standard Pattern)

```
src/modules/<name>/
  controllers/          <name>.controller.ts
  dto/                  request/response/filter DTOs
  repositories/         <name>.repository.ts (extends BaseRepository)
  services/             domain services
  use-cases/            <feature>/
    commands/           command objects
    queries/            query objects
    <feature>.use-case.ts
  contracts/            result interfaces
  <name>.module.ts
```

---

## TypeScript Invariants

1. `isolatedModules: true` — re-exporting a pure TS interface/type from a barrel MUST use `export type { Foo }`, not `export { Foo }`.
2. Classes and enum re-exports use plain `export { }`.
3. `strictNullChecks: true` — null checks are enforced.
4. `noImplicitAny: false` — implicit any allowed.
5. `strictBindCallApply: false` — bind/call/apply not strictly typed.

---

## LoggerService API

```typescript
this.logger.info(msg, context?)
this.logger.warn(msg, context?)
this.logger.error(msg, context?)
this.logger.debug(msg, context?)
```

**There is no `this.logger.log()` method.** Using `.log()` causes a TypeScript compilation error (TS2339).

---

## Authentication Architecture

- JWT strategy (Passport)
- `JwtAuthGuard` — validates Bearer token
- `@CurrentUser()` decorator — extracts `JwtPayload` from request
- `JwtPayload.sub` — the authenticated user's BigInt user ID
- Refresh token flow: `POST /v1/auth/refresh`
- Logout: `POST /v1/auth/logout` (204)
- Public routes: `@Public()` decorator bypasses JwtAuthGuard

---

## Authorization Architecture

- `RolesGuard` — checks `@Roles(SystemRoles.ADMIN, ...)` on controller/handler
- `ScreenPermissionGuard` — fine-grained screen-level CRUD permission check
- Permission resolution: `PermissionResolverService` with `MemoryPermissionCache`
- SystemRoles enum: `SYSTEM_ADMIN`, `ADMIN`, `MANAGER`, `SUPERVISOR`, `STAFF`

---

## BigInt Serialization

- All primary keys are `BigInt` in PostgreSQL/Prisma
- `BigInt` does not serialize to JSON natively (throws `TypeError`)
- `ResponseInterceptor` calls `serializeBigInts()` from `src/core/utils/bigint-serializer.ts`
- This converts all BigInt values in the response payload to strings
- Prisma `Decimal` implements `.toJSON()` returning string — serializes naturally
- In controllers, incoming string IDs from URL params are converted: `BigInt(id)`

---

## Audit System

`AuditModule` is global. `AuditService` logs entity changes to `audit_events` table.  
`audit_events` uses composite PK `@@id([event_id, occurred_at])`.
