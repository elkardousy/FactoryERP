# Architecture Summary

One-page overview of FactoryERP's architecture. For details, follow the links to specific ADRs.

---

## What Is FactoryERP

A manufacturing ERP for garment production, built as a TypeScript monolith. The Business Foundation (master data, authentication, authorization) is complete. Customer Manufacturing Orders, inventory management, and production tracking are in the roadmap.

---

## Technology Stack

| Concern | Technology |
|---------|-----------|
| Runtime | Node.js LTS |
| Framework | NestJS 11 |
| Database | PostgreSQL (via Prisma 6) |
| Language | TypeScript (strict mode) |
| Auth | JWT + passport-jwt + bcrypt |
| Validation | class-validator + class-transformer |
| Logging | nestjs-pino (structured JSON) |
| Docs | @nestjs/swagger (OpenAPI 3.0) |
| Tests | Jest + @nestjs/testing |

---

## Layer Architecture

```
HTTP Request
     ↓
Controller           validates input, calls one use case
     ↓
Use Case             all business logic; coordinates repository + services
     ↓      ↓
Repository  Service  data access | reusable capabilities
     ↓
PrismaService        database client
     ↓
PostgreSQL (factory schema)
```

Repositories are the **only** layer that may touch PrismaService. See [ADR-002](adr/ADR-002-Clean-Architecture.md).

---

## Module Structure

```
src/
  core/                  infrastructure (global modules, filters, interceptors)
    config/              ConfigService, Joi env validation
    database/            PrismaService, BaseRepository
    exceptions/          AllExceptionsFilter, PrismaExceptionFilter
    audit/               AuditService (global)
    document-numbering/  DocumentNumberingService (global)
    logger/              LoggerService wrapping nestjs-pino (global)
    interceptors/        ResponseInterceptor
  common/dto/            PaginationDto, DateRangeDto, IdParamDto
  modules/
    auth/                Login, JWT, session management
    authorization/       RolesGuard, ScreenPermissionGuard, UserRole enum
    departments/         CRUD + soft-delete
    working-shifts/      CRUD + soft-delete
    warehouses/          CRUD + soft-delete
    production-lines/    CRUD + soft-delete
    production-stages/   CRUD + hard-delete
    customers/           CRUD + soft-delete + auto-generated codes
    suppliers/           CRUD + soft-delete + auto-generated codes
    garment-models/      CRUD + soft-delete + customer binding
    measurements/        Colors (hard-delete) + Sizes (hard-delete)
```

---

## Guard Stack

Every request passes through these guards in order:

```
ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
```

- **ThrottlerGuard**: 60 req/60s rate limit — runs before auth to protect the auth path itself
- **JwtAuthGuard**: validates token, checks session active in DB
- **RolesGuard**: enforces `@Roles()` — deny-by-default (no annotation = system admin only)
- **ScreenPermissionGuard**: fine-grained UI screen access from DB

See [ADR-013](adr/ADR-013-Guard-Stack.md).

---

## Authentication Flow

```
POST /v1/auth/login
  → PasswordService.compare()          (bcrypt verify)
  → SessionService.create()            (insert session record)
  → TokenService.generateTokenPair()   (sign access + refresh)
  → JwtService.sign() with sessionId   (re-sign to embed session)
  → Return { accessToken, refreshToken }
```

Refresh token is composite: `{sessionId}:{rawUUID}`, stored as bcrypt hash. See [ADR-011](adr/ADR-011-JWT-Refresh-Tokens.md).

---

## Response Envelope

All successful responses:
```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2026-06-26T10:00:00.000Z",
  "path": "/v1/customers"
}
```

All error responses:
```json
{
  "success": false,
  "statusCode": 404,
  "error": "NotFoundException",
  "message": "Customer 42 not found",
  "path": "/v1/customers/42",
  "timestamp": "2026-06-26T10:00:00.000Z"
}
```

BigInt ID fields appear as strings in all responses. See [ADR-021](adr/ADR-021-BigInt-Serialization.md).

---

## Database Schema Facts

- All tables in the `factory` PostgreSQL schema
- All primary keys are `BigInt @id @default(autoincrement())`
- All DateTime columns are `Timestamptz(6)` (timezone-aware, microsecond precision)
- Quantities are `Decimal(12,3)` for exact arithmetic
- Audit payloads are `Json` (PostgreSQL JSONB)
- High-volume tables use composite keys `[id, timestamp]` enabling future partitioning

---

## Key Invariants

1. **Repositories only** touch PrismaService
2. **Use Cases** hold all business logic; Controllers are thin
3. **No `process.env`** in application code — only in `PrismaService` constructor and `loggerConfig`
4. **Audit writes are fire-and-forget** — `void this.auditService.log()`
5. **Deny by default** — missing `@Roles()` = system admin only
6. **`export type {}`** for interface re-exports (isolatedModules: true)
7. **`PartialType`/`OmitType` from `@nestjs/swagger`** not `@nestjs/mapped-types`

---

## Further Reading

| Document | Contents |
|----------|---------|
| [ADR_INDEX.md](ADR_INDEX.md) | All 26 ADRs with links |
| [ARCHITECTURE_PRINCIPLES.md](ARCHITECTURE_PRINCIPLES.md) | 14 governing principles with checklist |
| [DEPENDENCY_RULES.md](DEPENDENCY_RULES.md) | Layer matrix, cross-module rules |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | TypeScript, NestJS, testing patterns |
| [TECHNOLOGY_DECISIONS.md](TECHNOLOGY_DECISIONS.md) | Why each technology was selected |
| [REPOSITORY_RULES.md](REPOSITORY_RULES.md) | Git workflow, commit conventions |
| [ARCHITECTURE_TIMELINE.md](ARCHITECTURE_TIMELINE.md) | Sprint-by-sprint architectural milestones |
| [CLAUDE.md](../../CLAUDE.md) | Commands, module layout, key invariants |
