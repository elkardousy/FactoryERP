# ADR-005 — Configuration System

## Title

Namespaced Configuration with Startup Validation

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

A NestJS application reads configuration from environment variables. Without a structured approach:

1. `process.env.JWT_SECRET` scattered across files makes it impossible to identify all configuration dependencies
2. Missing required configuration causes runtime failures, not startup failures
3. Type safety is lost — `process.env` always returns `string | undefined`
4. Configuration is not testable — tests cannot easily override a few variables

The ERP additionally has multiple configuration domains (application, database, JWT, logging) that must be kept distinct.

---

## Decision

NestJS `@nestjs/config` with `registerAs` namespacing and Joi startup validation is used for all application configuration.

### Configuration Namespaces

| Namespace | Keys | Factory File |
|-----------|------|--------------|
| `app` | `name`, `env`, `port` | `src/core/config/app.config.ts` |
| `database` | `url` | `src/core/config/database.config.ts` |
| `jwt` | `secret`, `expiresIn`, `refreshExpiresIn` | `src/core/config/jwt.config.ts` |
| `logger` | `level` | `src/core/config/logger.config.ts` |

Each factory is a `registerAs` call:
```typescript
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN,
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN,
}));
```

### Startup Validation

A Joi schema (`src/core/config/env.validation.ts`) validates all required variables at startup. If validation fails, the process terminates with a descriptive error before accepting any connections:

```typescript
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  REFRESH_EXPIRES_IN: Joi.string().required(),
  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error').default('info'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
});
```

### Accessing Configuration

All configuration access goes through `ConfigService.getOrThrow<T>(key)`:

```typescript
const secret = this.config.getOrThrow<string>('jwt.secret');
const port = this.config.get<number>('app.port') ?? 3000;
```

`getOrThrow` is preferred over `get` for required values because it throws if the key is absent rather than returning `undefined`.

### Known Exceptions

Two locations are permitted to use `process.env` directly:
1. `PrismaService` constructor — Prisma expects the database URL at instantiation time before NestJS DI is resolved
2. `loggerConfig` constant — the Pino logger is configured before NestJS fully initializes

These exceptions are explicit and documented in `CLAUDE.md`.

### ConfigModule Registration

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, databaseConfig, jwtConfig, loggerConfig],
  validationSchema: envValidationSchema,
  cache: true,
})
```

`cache: true` prevents repeated env parsing on every `config.get()` call.

---

## Rationale

**Why `registerAs` over flat `process.env`?**

Namespacing prevents collisions between configuration keys from different domains. `config.get('jwt.secret')` is self-documenting; `process.env.JWT_SECRET` scattered throughout the codebase is opaque.

**Why Joi schema instead of class-validator for environment validation?**

Class-validator is designed for HTTP input objects. Joi is designed for schema validation of arbitrary objects and is already a `@nestjs/config` native integration. Using Joi for config validation and class-validator for DTOs keeps each tool in its domain.

**Why `isGlobal: true` for ConfigModule?**

Every module in the application requires configuration access. Making `ConfigModule` global eliminates import boilerplate across all modules.

**Why fail-fast on missing required config?**

An ERP that starts without a JWT secret would be silently broken — authentication would fail on first request. It is far better to terminate at startup with a descriptive error than to surface runtime failures.

**Why `getOrThrow` over `get`?**

`config.get('jwt.secret')` returns `undefined` if the key is missing. After startup validation, this should never happen. But if a key is accessed in a path that validation does not cover, `getOrThrow` ensures the failure is immediate and explicit.

---

## Consequences

**Positive:**
- All configuration dependencies are visible in one Joi schema
- Missing required configuration surfaces at process startup
- Configuration is organized by domain, making it easy to find
- `cache: true` ensures zero overhead on repeated config access

**Negative:**
- Developers must remember to add new environment variables to both the Joi schema and the config factory
- `process.env` directly used in `PrismaService` and `loggerConfig` — two known exceptions that must be maintained

**Trade-offs:**
- The two `process.env` exceptions represent a pragmatic compromise: Prisma and Pino initialize before NestJS DI is available. Eliminating these exceptions would require significant refactoring of initialization order.

**Future Implications:**
- Secrets management (AWS Secrets Manager, HashiCorp Vault) can be integrated by replacing environment variables with a custom ConfigLoader while keeping the namespace and validation structure unchanged
- Multi-environment configurations (staging, production-eu, production-us) can be expressed as separate `.env` files with the same Joi schema

---

## Related Components

- `src/core/config/app.config.ts`
- `src/core/config/database.config.ts`
- `src/core/config/jwt.config.ts`
- `src/core/config/logger.config.ts`
- `src/core/config/env.validation.ts`
- `src/core/config/swagger.config.ts`
- `src/app.module.ts` — ConfigModule registration
- `src/modules/auth/services/token.service.ts` — config usage example

---

## Alternatives Considered

### dotenv Directly

Rejected. Pure dotenv provides no validation, no namespacing, and no type safety. It is a lower-level tool that `@nestjs/config` already builds upon.

### Environment-Specific Config Files (per-environment JSON)

Considered. Some frameworks (e.g., Spring Boot) use per-environment config files. Rejected because:
- NestJS convention favors environment variables, which are more deployment-target agnostic
- Container orchestration (Docker, Kubernetes) natively manages environment variables
- Per-environment config files require careful security handling (especially for secrets)

### Zod for Environment Validation

Considered. Zod provides excellent TypeScript inference for validated schemas. Rejected because:
- Joi is the native `@nestjs/config` integration — no additional adapter needed
- Zod would require a custom loader to integrate with `@nestjs/config`

---

## Future Evolution

- **Runtime config reload**: For configuration that changes without deployment (feature flags), `@nestjs/config`'s watch mode can be enabled
- **Secrets injection**: Cloud secret managers can replace static environment variables by implementing a custom `ConfigFactory`
- **Config documentation**: Joi schema descriptions can be extended to generate environment variable documentation automatically

---

## References

- `src/core/config/`
- `src/core/config/env.validation.ts`
- `CLAUDE.md` — Configuration section
- ADR-000 (Architecture Principles) — P-6 (Configuration is Explicit)
