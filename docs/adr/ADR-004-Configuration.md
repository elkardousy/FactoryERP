# ADR-004 — Configuration Management

**Status:** Accepted
**Date:** 2026-06-26
**Deciders:** Principal Architect
**Applies to:** All modules — `src/core/config/`

---

## Context

The application requires configuration for: database connection, JWT signing, token lifetimes, logging level, server port, and application name. These values differ across environments (development, staging, production) and must never be hardcoded.

Key constraints:
- The application should fail fast at startup if required configuration is missing, rather than failing at runtime when a misconfigured feature is first used.
- Configuration consumers should not need to know the name of environment variables — they should receive typed, namespaced values.
- `process.env` access scattered across the codebase is an anti-pattern that makes environment portability harder.
- The TypeScript compiler cannot validate `process.env.X` accesses (all values are `string | undefined`).

---

## Decision

Use **NestJS `ConfigModule` with namespaced factory functions** and **Joi validation at startup**.

**Structure:**

```
src/core/config/
├── app.config.ts        registerAs('app', () => ({ name, env, port }))
├── database.config.ts   registerAs('database', () => ({ url }))
├── jwt.config.ts        registerAs('jwt', () => ({ secret, expiresIn, refreshExpiresIn }))
├── logger.config.ts     registerAs('logger', () => ({ level }))  — loggerConfig constant also here
├── configuration.ts     export default [app, database, jwt, logger]  — aggregates all factories
└── env.validation.ts    Joi.object({ NODE_ENV, DATABASE_URL, JWT_SECRET, ... })
```

**Registration in `AppModule`:**

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  expandVariables: true,
  load: configuration,         // all factories
  validationSchema,            // Joi schema
})
```

**Consumption in any injectable class:**

```typescript
const secret = this.config.getOrThrow<string>('jwt.secret');
const port   = this.config.get<number>('app.port') ?? 3000;
```

**Exceptions (documented, not violations):**

Two locations read `process.env` directly by necessity:
1. `PrismaService` constructor — must pass `DATABASE_URL` before the NestJS DI container is initialized.
2. `loggerConfig` constant — used by `LoggerModule.forRoot()` at module compilation time, before `ConfigService` is available.

All other code must use `ConfigService`.

**Startup validation:**

Joi schema in `env.validation.ts` is passed to `ConfigModule.forRoot({ validationSchema })`. If any required variable is absent or invalid, the application throws during bootstrap and never accepts HTTP traffic:

```
[Nest] ERROR [ExceptionHandler] Config validation error:
  "JWT_SECRET" is required
```

---

## Alternatives Considered

### A — Read `process.env` directly everywhere
Simplest approach. Rejected because:
- All values are `string | undefined` — consumers must handle undefined at every call site.
- No startup validation — misconfiguration surfaces at runtime, not at boot.
- Refactoring variable names requires grep across the whole codebase.
- No namespace structure — `JWT_SECRET` vs `SECRET` vs `AUTH_SECRET` is arbitrary.

### B — Custom config service (manual dotenv + class)
Build a typed config class with explicit properties. Rejected because NestJS `ConfigModule` already provides this, with additional features (`cache`, `expandVariables`, Joi integration).

### C — Environment-specific YAML files
Load `config.development.yaml`, `config.production.yaml`. Rejected because:
- Adds a YAML parser dependency.
- Config files checked into source control can accidentally contain secrets.
- Environment variables are the 12-factor app standard for containerized deployments.

### D — `@nestjs/config` with `validateSync` (class-transformer/class-validator)
Use a config class with `@IsString()`, `@IsNumber()` etc. instead of Joi. Viable alternative. Joi was chosen because it is already installed (via `@hapi/joi`-style validation), well-known, and the `Joi.object()` DSL is readable inline.

---

## Consequences

**Positive:**
- Required variables are validated at startup — fast feedback on misconfiguration.
- `ConfigService.getOrThrow()` throws if a key is missing — eliminates silent undefined propagation.
- Namespacing (`jwt.secret` vs `app.port`) prevents key name collisions across modules.
- `cache: true` means config is read once and cached — no repeated `process.env` lookups.
- `expandVariables: true` supports `DATABASE_URL=${HOST}:${PORT}/db` style composition in `.env`.
- `isGlobal: true` means no module needs to import `ConfigModule` again.

**Negative / Trade-offs:**
- `ConfigService.get<T>()` returns `T | undefined` — callers must use `getOrThrow<T>()` or add null checks. Inconsistency between `get` and `getOrThrow` is a minor footgun.
- Joi validation only catches missing/wrong-type values at startup. It cannot validate that `DATABASE_URL` actually resolves to a reachable database — that is caught by `PrismaService.$connect()`.
- The `loggerConfig` constant reads `process.env.LOG_LEVEL` and `process.env.NODE_ENV` directly. This is a known exception and is documented in `CLAUDE.md`.
