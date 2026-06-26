# Technology Stack Decisions

This document explains the technology choices made for FactoryERP and why each was selected over its alternatives.

---

## Runtime and Framework

### Node.js + NestJS 11

**Selected over**: Express (raw), Fastify, Hapi, Spring Boot, Django

**Why NestJS:**
- Provides opinionated structure (modules, controllers, services, guards, interceptors) that enforces the Clean Architecture approach
- First-class TypeScript support — types are not bolted on
- Dependency injection container reduces wiring boilerplate
- Decorator-based architecture aligns with the use-case-per-operation pattern
- `@nestjs/swagger` generates OpenAPI docs from TypeScript decorators (no separate schema files)
- Large ecosystem: throttler, passport, config, jwt, pino — all official packages

**Why not Express raw:**
- No enforced structure — team must invent and maintain conventions
- No DI container — manual dependency wiring creates hidden coupling

**Why not Spring Boot / Django:**
- FactoryERP is TypeScript-native (shared types with future frontend)
- Node.js deployment model is simpler for the target infrastructure

---

## Database

### PostgreSQL via Prisma 6

**Selected over**: MySQL, MongoDB, SQLite, TypeORM, MikroORM, raw `pg`

**Why PostgreSQL:**
- ACID transactions are required for inventory management (quantities cannot be negative)
- `JSONB` for audit event payloads — flexible schema for event metadata without sacrificing queryability
- `Decimal` type for exact quantity arithmetic (no floating-point errors)
- `@db.Timestamptz(6)` for timezone-aware timestamps with microsecond precision
- Multi-schema support (`factory` schema isolation) via `previewFeatures = ["multiSchema"]`
- Mature partitioning for future high-volume tables

**Why Prisma:**
- Type-safe queries generated from schema — query errors caught at compile time
- Schema-as-code (`schema.prisma`) is the single source of truth
- Migrations tracked in `prisma/migrations/` — no drift between schema and database
- Automatic client generation after schema changes
- Better TypeScript ergonomics than TypeORM decorators

**Why not TypeORM:**
- Decorator-based entity definitions can diverge from the actual database schema
- Migration reliability issues in complex schema scenarios
- Less strict TypeScript types than Prisma-generated client

**Why not MongoDB:**
- Document model does not suit relational ERP data (inventory transactions reference orders, orders reference customers)
- No ACID multi-document transactions in the general case

---

## Authentication

### @nestjs/jwt + passport-jwt

**Selected over**: Auth0, Firebase Auth, Keycloak, session cookies

**Why local JWT:**
- The ERP manages its own user database — no external auth provider required
- Session-based revocation (not pure stateless JWT) handles immediate account deactivation
- Full control over token payload (`JwtPayload` carries `userId`, `sessionId`, `role`)
- `ThrottlerGuard` + `bcrypt` provide brute-force protection without an external service

**Why not Auth0/Keycloak:**
- External dependencies add cost, latency, and availability risk
- The user model (with `UserRole` enum and screen permissions) is ERP-specific
- Migration to an external IdP is possible in the future if requirements change

---

## Logging

### nestjs-pino

**Selected over**: Winston, Bunyan, Morgan, console.log

**Why nestjs-pino:**
- Structured JSON logging by default — log aggregators (ELK, Loki) ingest JSON natively
- Pino is one of the fastest Node.js loggers (low-overhead serialization)
- `pino-http` provides automatic request/response logging
- Sensitive header redaction built in (`authorization`, `cookie`, `set-cookie`)
- `pino-pretty` in development, JSON in production — same config, different transport

**Why not Winston:**
- Slower than Pino
- More complex configuration for structured output

---

## Validation

### class-validator + class-transformer

**Selected over**: Zod, Yup, Joi (for request bodies), manual validation

**Why class-validator:**
- NestJS `ValidationPipe` integrates natively
- Declarative decorator syntax (`@IsString()`, `@IsEmail()`, etc.) is co-located with the DTO
- `@nestjs/swagger` reads class-validator decorators to generate API schema properties
- `whitelist: true` strips unknown fields automatically

**Note**: Joi is used for **environment variable validation** (at startup, via `ConfigModule.forRoot({ validationSchema: Joi.object(...) })`). This is separate from request body validation.

---

## API Documentation

### @nestjs/swagger (OpenAPI 3.0)

**Selected over**: Manual OpenAPI files, Postman collections, API Blueprint

**Why Swagger:**
- Docs are generated from code — cannot drift from the actual API
- `@nestjs/swagger` reads DTO decorators, controller decorators, and response types
- Interactive UI at `/api/docs` for manual testing
- OpenAPI 3.0 output can be imported into Postman, Insomnia, or any API client

---

## Security

### helmet + @nestjs/throttler + bcrypt

| Library | Purpose |
|---------|---------|
| `helmet` | HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) |
| `@nestjs/throttler` | Rate limiting — 60 req/60s per IP |
| `bcrypt` | Password hashing (12 salt rounds) and refresh token hashing |
| `compression` | Response compression |

**Why bcrypt over argon2/scrypt:**
- bcrypt is battle-tested and widely understood
- 12 salt rounds provides adequate security for ERP use cases (~300ms per hash)
- argon2 is preferred for new systems but bcrypt is not a security weakness here

---

## Testing

### Jest + @nestjs/testing

**Selected over**: Mocha, Vitest, Jasmine

**Why Jest:**
- NestJS default, no configuration required
- First-class TypeScript support via `ts-jest`
- `@nestjs/testing` creates a Nest testing module that mirrors the real DI container
- `jest.fn()` mocking integrates cleanly with the DI pattern
- Code coverage built in (`--coverage`)

---

## Package Registry and Runtime

| Concern | Choice |
|---------|--------|
| Package manager | npm |
| Runtime | Node.js LTS |
| Build output | `./dist` via `nest build` (wraps `tsc`) |
| Process manager (production) | To be determined (PM2, Docker CMD, or systemd) |

---

## Not Yet Selected

| Concern | Deferred Until |
|---------|---------------|
| Redis | When `MemoryPermissionCache` is insufficient (horizontal scaling) |
| Message queue | When cross-domain fire-and-forget patterns are needed |
| S3-compatible storage | When document attachments are required |
| Email service | When notification features are implemented |
| CI/CD pipeline | Before first production deployment |
