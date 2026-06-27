# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build
npm run build            # nest build (outputs to ./dist, clears outDir first)

# Development
npm run start:dev        # watch mode (use this during development)
npm run start:prod       # node dist/main

# Tests
npm run test             # jest (unit tests, *.spec.ts under src/)
npm run test:watch       # jest --watch
npm run test:cov         # jest --coverage
npm run test:e2e         # jest --config ./test/jest-e2e.json
npm run test -- --testPathPattern=auth   # run tests matching a path pattern

# Code quality
npm run lint             # eslint with auto-fix
npm run format           # prettier --write

# Prisma — always prefix with DATABASE_URL= (prisma.config.ts skips .env loading)
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma validate
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate status
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma studio
# WARNING: prisma db pull is PROHIBITED — see "Never run prisma db pull" section below
```

## Architecture

### Strict layer ordering

```
Controllers → Use Cases → Services → Repositories → PrismaService
```

- **Repositories** are the only layer that may touch `PrismaService`. Services must never inject it directly.
- **Use Cases** hold all business logic for a feature. Services provide reusable, cross-cutting capabilities (e.g., `PasswordService`, `TokenService`).
- **Controllers** must stay thin: validate input, call one use case, return the result.

### Module layout

```
src/
  core/                        # Infrastructure shared by all modules
    config/                    # app / database / jwt / logger config factories
    database/
      prisma/                  # PrismaService (global), PrismaExceptionFilter
      repositories/base/       # BaseRepository abstract class
      health/                  # DatabaseHealthService
    exceptions/filters/        # AllExceptionsFilter, PrismaExceptionFilter (global)
    interceptors/              # ResponseInterceptor (stub)
    logger/                    # LoggerModule (global), LoggerService wrapping PinoLogger
    pipes/                     # GlobalValidationPipe
    responses/                 # ErrorResponse class, ApiError interface
  common/dto/                  # Shared DTOs: PaginationDto, DateRangeDto, IdParamDto
  modules/
    auth/
      controllers/
      decorators/
      guards/
      repositories/            # UsersRepository
      services/                # AuthService, JwtService, TokenService, PasswordService, SessionService
      strategies/              # JwtStrategy
      use-cases/
        login/
          dto/                 # LoginDto
          contracts/           # JwtPayload, TokenPair, LoginResult interfaces
          login.use-case.ts
          index.ts             # barrel
```

### Configuration

All config is accessed via `ConfigService`, never `process.env` directly (except inside the `PrismaService` constructor and `loggerConfig` constant, which are known exceptions). Config is namespaced:

| Namespace | Keys |
|---|---|
| `app` | `name`, `env`, `port` |
| `database` | `url` |
| `jwt` | `secret`, `expiresIn`, `refreshExpiresIn` |
| `logger` | `level` |

Env vars are validated by Joi at startup (`src/core/config/env.validation.ts`). Required: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_EXPIRES_IN`.

### Prisma

- Schema lives in `prisma/schema.prisma`, all models in the `factory` PostgreSQL schema (`@@schema("factory")`).
- `previewFeatures = ["multiSchema"]` is active.
- All primary keys are `BigInt` — be aware this does not serialize to JSON numbers natively.
- `PrismaModule` is `@Global()`, so no module needs to import it again after `AppModule`.
- `BaseRepository` exposes `this.db` (alias for `this.prisma`) and `executeInTransaction<T>()`. The transaction callback receives a cast `tx as PrismaService` — treat it as a `Prisma.TransactionClient` inside the callback, not a full `PrismaService`.

### CRITICAL — Never run `prisma db pull`

**`prisma db pull` is PROHIBITED without explicit authorization.** It overwrites `prisma/schema.prisma` from the live database and:
- Removes `ReservationStatusEnum` and other custom enums (they become raw strings)
- Strips all `@updatedAt` directives
- Renames relations (breaking TypeScript compilation — 6+ type errors)
- Removes custom indexes added via schema directives
- Destroys the committed schema that is the source of truth

The database was created by SQL Phase 0–20 scripts before Prisma was introduced. The committed `schema.prisma` is the authoritative source, not the live DB introspection. If you accidentally run `prisma db pull`, immediately restore with:

```bash
git checkout HEAD -- prisma/schema.prisma
npx prisma generate
npm run build
```

### Prisma migration workflow

All migrations must be run as the `postgres` superuser (not `elkardousy`), because `elkardousy` lacks `ALTER TABLE` / `CREATE TYPE` privileges on the `factory` schema objects owned by `postgres`. Workflow:

```bash
# 1. Write migration SQL to prisma/migrations/<timestamp>_<name>/migration.sql
# 2. Execute it as superuser:
PGPASSWORD="<postgres-pw>" psql -U postgres -h localhost -p 5432 -d factory_erp -f prisma/migrations/<dir>/migration.sql
# 3. Mark it applied in Prisma:
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate resolve --applied "<migration-name>"
# 4. Regenerate client:
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
```

Always pass `DATABASE_URL` explicitly because `prisma.config.ts` causes Prisma to skip `.env` loading.

### Logging

Use `LoggerService` (from `src/core/logger/logger.service.ts`), not `console.log`. `LoggerModule` is `@Global()`. The underlying transport is `nestjs-pino`; in development it outputs pretty-printed logs, in production raw JSON. Sensitive headers (`authorization`, `cookie`, `set-cookie`) are redacted automatically.

### Error handling

Throw NestJS HTTP exceptions (`UnauthorizedException`, `NotFoundException`, etc.) from services/use-cases. Two global filters catch them:

1. `PrismaExceptionFilter` — maps `PrismaClientKnownRequestError` codes (P2002 → 409, P2025 → 404, P2003/P2014 → 400/409).
2. `AllExceptionsFilter` — catch-all fallback, wraps everything in `ErrorResponse`.

Filters are registered imperatively in `main.ts` (not via DI), so they cannot inject services. The correct registration order matters: `PrismaExceptionFilter` must be listed before `AllExceptionsFilter` in the `useGlobalFilters` call so NestJS evaluates the more-specific filter first.

### TypeScript constraints

`tsconfig.json` has `"isolatedModules": true`. This means:

- Re-exporting a pure TypeScript interface or type from a barrel **must** use `export type { Foo }`, not `export { Foo }`.
- Class and enum re-exports use plain `export { }` as normal.

`"noImplicitAny": false` and `"strictBindCallApply": false` are intentionally off. `"strictNullChecks": true` is on.

### Swagger

Available at `/api/docs`. Configured with Bearer JWT in `src/core/config/swagger.config.ts`. All versioned routes are prefixed `/v1/`. Add `@ApiBearerAuth('JWT')` to protected controllers and `@ApiProperty()` to DTOs.

### URI versioning

All routes are versioned. Default version is `1`. Controllers declare `version: '1'` in `@Controller({ path: '...', version: '1' })`.
