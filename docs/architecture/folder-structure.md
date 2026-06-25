# Folder Structure

**Baseline:** Sprint 8 Foundation Freeze — 2026-06-26

---

## Top-Level

```
FactoryERP/
├── src/                    Application source code
├── prisma/                 Database schema and migrations
├── docs/                   Project documentation (this directory)
├── test/                   e2e test configuration
├── dist/                   Compiled output (git-ignored)
├── node_modules/           Dependencies (git-ignored)
├── CLAUDE.md               AI assistant instructions for this repository
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .eslintrc.js
└── .prettierrc
```

---

## src/

```
src/
├── main.ts                 Application bootstrap and global middleware
├── app.module.ts           Root module: imports, ThrottlerModule, CorrelationIdMiddleware
│
├── common/                 Shared DTOs used by multiple modules
│   └── dto/
│       ├── pagination/     PaginationDto  — page + limit query params
│       ├── filters/        DateRangeDto   — from/to date filter
│       └── params/         IdParamDto     — numeric :id route param
│
├── core/                   Infrastructure shared by all modules
│   ├── config/             Config factories and environment validation
│   ├── constants/          Application-wide constants (auth token lifetimes)
│   ├── database/           Database infrastructure
│   ├── exceptions/         Global exception filters
│   ├── interceptors/       HTTP interceptors (ResponseInterceptor stub)
│   ├── interfaces/         Shared TypeScript interfaces (JwtConfig)
│   ├── logger/             Structured logging
│   ├── middleware/         HTTP middleware (CorrelationIdMiddleware)
│   ├── pipes/              Global validation pipe
│   └── responses/          Response shape definitions
│
└── modules/                Feature modules
    └── auth/               Authentication module (completed Sprint 8)
```

---

## src/core/

```
core/
│
├── config/
│   ├── app.config.ts           Registers 'app' namespace: name, env, port
│   ├── database.config.ts      Registers 'database' namespace: url
│   ├── jwt.config.ts           Registers 'jwt' namespace: secret, expiresIn, refreshExpiresIn
│   ├── logger.config.ts        Pino HTTP logger options (redaction, pretty-print, log level)
│   ├── configuration.ts        Aggregates all config factories into a single export array
│   ├── env.validation.ts       Joi schema — validates env vars at startup, fails fast if missing
│   ├── swagger.config.ts       DocumentBuilder setup + SwaggerModule.setup()
│   └── config.module.ts        (stub — ConfigModule is configured inline in AppModule)
│
├── constants/
│   └── auth.constants.ts       ACCESS_TOKEN_MINUTES = 15, REFRESH_TOKEN_DAYS = 7
│
├── database/
│   ├── prisma/
│   │   ├── prisma.service.ts       PrismaClient subclass; onModuleInit/$connect, onModuleDestroy/$disconnect
│   │   ├── prisma.module.ts        @Global() module; provides PrismaService + DatabaseHealthService
│   │   └── prisma-exception.filter.ts  (legacy path — canonical filter is in core/exceptions/)
│   ├── repositories/
│   │   └── base/
│   │       └── base.repository.ts  Abstract base; exposes this.db and executeInTransaction<T>()
│   ├── health/
│   │   └── database.health.ts      DatabaseHealthService; SELECT 1 liveness probe
│   └── transactions/
│       └── transaction.service.ts  (stub — transactions handled via BaseRepository.executeInTransaction)
│
├── exceptions/
│   ├── filters/
│   │   ├── all-exceptions.filter.ts     @Catch() — catch-all fallback → ErrorResponse
│   │   └── prisma-exception.filter.ts   @Catch(PrismaClientKnownRequestError) — maps P-codes
│   └── exceptions.module.ts             (stub — filters registered imperatively in main.ts)
│
├── interceptors/
│   └── response.interceptor.ts     (stub — ResponseInterceptor not yet implemented or registered)
│
├── interfaces/
│   └── jwt-config.interface.ts     JwtConfig { secret, expiresIn, refreshExpiresIn }
│
├── logger/
│   ├── logger.config.ts        loggerConfig constant: pinoHttp options, redaction rules, transport
│   ├── logger.interceptor.ts   (stub — HTTP logging handled automatically by pinoHttp)
│   ├── logger.interface.ts     (stub)
│   ├── logger.module.ts        @Global() module; wraps nestjs-pino; exports LoggerService
│   └── logger.service.ts       Thin wrapper over PinoLogger: info/warn/error/debug
│
├── middleware/
│   └── correlation-id.middleware.ts  Reads or generates X-Correlation-ID; sets on req + res
│
├── pipes/
│   └── validation.pipe.ts      GlobalValidationPipe instance (transform, whitelist, flattenErrors)
│
└── responses/
    ├── api-error.interface.ts      ApiError interface shape
    ├── api-response.interface.ts   (stub — success response interface)
    ├── error-response.ts           ErrorResponse class implementing ApiError
    └── success-response.ts         (stub — SuccessResponse not yet implemented)
```

---

## src/modules/auth/

```
auth/
├── auth.module.ts              Module declaration; wires all providers, imports JwtModule/PassportModule
│
├── controllers/
│   └── auth.controller.ts      POST /v1/auth/login, /refresh, /logout
│
├── decorators/
│   └── current-user.decorator.ts   @CurrentUser() — extracts request.user (set by JwtStrategy)
│
├── guards/
│   └── jwt-auth.guard.ts       JwtAuthGuard extends AuthGuard('jwt') — protects routes
│
├── repositories/
│   ├── audit.repository.ts         Append-only writes to audit_events
│   ├── user-sessions.repository.ts  Full CRUD for user_sessions (create, revoke, rotate)
│   └── users.repository.ts          Read/write for users (find, updateLastLogin, incrementFailed)
│
├── services/
│   ├── auth.service.ts         validateUser() (credential + lock check); findActiveById() for JwtStrategy
│   ├── jwt.service.ts          Thin wrapper over @nestjs/jwt: signAsync, verifyAsync, decode
│   ├── password.service.ts     bcrypt hash() and verify() — salt rounds 12
│   ├── session.service.ts      Session lifecycle: create, validate, refresh, revoke, revokeAll
│   └── token.service.ts        generateTokenPair, hashRefreshToken, compareRefreshToken, generateAccessToken
│
├── strategies/
│   └── jwt.strategy.ts         PassportStrategy(JwtStrategy); validates every authenticated request vs DB
│
└── use-cases/
    ├── login/
    │   ├── contracts/
    │   │   ├── jwt-payload.interface.ts    { sub, username, roleId, sessionId }
    │   │   ├── login-result.interface.ts   { user, tokens, sessionId, mustChangePassword }
    │   │   └── token-pair.interface.ts     { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt }
    │   ├── dto/
    │   │   └── login.dto.ts                { username, password }
    │   ├── login.use-case.ts               Full login flow (7 steps)
    │   └── index.ts                        Barrel; re-exports with correct export type {} for interfaces
    ├── logout/
    │   ├── logout.use-case.ts              Revoke session + audit
    │   └── index.ts
    └── refresh/
        ├── dto/
        │   └── refresh.dto.ts              { refreshToken }  — composite format "<sessionId>:<uuid>"
        ├── refresh.use-case.ts             Full refresh flow (7 steps)
        └── index.ts
```

---

## prisma/

```
prisma/
├── schema.prisma               Single source of truth for all 80+ models
│                               All models in @@schema("factory") (PostgreSQL multiSchema)
│                               All PKs are BigInt @default(autoincrement())
│                               previewFeatures = ["multiSchema"]  (deprecated — removal tracked)
└── migrations/                 Prisma migration history
```

---

## docs/

```
docs/
├── architecture/
│   ├── project-architecture.md     Layered architecture, all cross-cutting concerns
│   └── folder-structure.md         This file — responsibility of every folder
├── adr/
│   ├── ADR-001-Repository-Pattern.md
│   ├── ADR-002-Authentication-Architecture.md
│   ├── ADR-003-JWT-Strategy.md
│   ├── ADR-004-Configuration.md
│   └── ADR-005-Exception-Handling.md
├── api/
│   └── authentication.md           Login, Refresh, Logout endpoint reference
├── sprint-reports/
│   ├── sprint-08-authentication.md
│   └── foundation-freeze-report.md
└── decisions/
    └── technical-debt-report.md    Known issues, dead code, and improvement backlog
```

---

## Key Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Use case | `<Action>UseCase` | `LoginUseCase` |
| Repository | `<Model>Repository` | `UsersRepository` |
| Service | `<Domain>Service` | `TokenService` |
| Guard | `<Strategy>AuthGuard` | `JwtAuthGuard` |
| DTO | `<Action>Dto` | `LoginDto`, `RefreshDto` |
| Contract interface | `<Concept>Interface` file suffix | `jwt-payload.interface.ts` |
| Config factory | `<namespace>.config.ts` | `jwt.config.ts` |
| Barrel | `index.ts` in every use-case folder | re-exports with `export type {}` for interfaces |
