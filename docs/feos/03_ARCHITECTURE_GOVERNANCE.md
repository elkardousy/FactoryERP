# 03 — Architecture Governance

**Document:** FEOS-03  
**Category:** Architecture  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-01 (Constitution), FEOS-07 (Code Governance), FEOS-11 (Module Governance)  
**Related KEB:** KEB-02 (Architecture Baseline), KEB-10 (Engineering Decisions), KEB-16 (Dependency Graph)

---

## Purpose

This document governs architectural principles, layer ownership, dependency rules, module boundaries, and the ADR policy for FactoryERP. It defines what is architecturally allowed and what is forbidden, providing the framework within which implementation decisions are made.

## Scope

All NestJS modules, their internal structure, their inter-module dependencies, and the layer ordering within each module.

## Audience

All engineers and AI agents implementing or reviewing FactoryERP features.

---

## Verified Architecture State

The following architecture is verified at commit `5a5e3d6` (KEB-02, KEB-20). All rules below govern this architecture and any future extensions of it.

**Framework:** NestJS 11  
**Pattern:** Clean Architecture  
**Language:** TypeScript 5.7 (strict null checks, isolated modules)  
**ORM:** Prisma 6 (`multiSchema` preview)  
**Database:** PostgreSQL 18, schema: `factory`  
**Auth:** JWT via Passport.js  
**Authorization:** Role-based (5 roles) + screen-level CRUD permissions  
**Logging:** nestjs-pino (PinoLogger)  
**Rate limiting:** ThrottlerModule (60 req/60 sec)

---

## Layer Ordering

The following layer ordering is absolute and admits no exceptions:

```
HTTP Request
    ↓
[Controller]
    ↓
[Use Case]          ← Business logic lives here
    ↓
[Service]           ← Reusable cross-cutting logic (e.g., validators, mappers, factories)
    ↓
[Repository]        ← Data access; only layer that touches PrismaService
    ↓
[PrismaService]
    ↓
PostgreSQL
```

### Layer Rules

**Controllers** must:
- Accept and validate HTTP input via DTOs.
- Call exactly one use case per endpoint.
- Return the result of the use case.
- Contain no business logic.
- Inject no repositories directly.

**Use Cases** must:
- Implement exactly one business command or query.
- Orchestrate calls to services and repositories.
- Contain all business logic for their command/query.
- Not inject `PrismaService` directly.
- Be organized in `/use-cases/<feature>/` directories.
- Expose a `execute()` method as their single entry point.

**Services** must:
- Be reusable across multiple use cases.
- Provide cross-cutting capabilities: validation, mapping, factory construction.
- Not inject `PrismaService` directly unless they are a repository.
- Examples: `InventoryTransactionValidator`, `ReservationMapper`, `ReservationFactory`.

**Repositories** must:
- Be the only layer that injects `PrismaService` (via `BaseRepository`).
- Translate between domain entities and Prisma models.
- Expose business-meaningful method names (not raw Prisma method names).
- Never expose `this.prisma` or `this.db` to callers outside the repository.
- Extend `BaseRepository` from `src/core/database/repositories/base/base.repository.ts`.

**PrismaService** must:
- Be injected only by repositories (directly) and `executeInTransaction` callbacks.
- Never be injected by controllers, use cases, or services.

---

## Module Boundaries

### Global Modules (Never Re-Import)

The following modules are declared `@Global()` in `AppModule`. They must **never** be imported in any feature module's `imports` array:

| Module | Provides |
|--------|---------|
| `PrismaModule` | `PrismaService` |
| `LoggerModule` | `LoggerService` |
| `AuditModule` | `AuditService` |
| `DocumentNumberingModule` | `DocumentNumberingService` |

### Feature Module Isolation

Each feature module in `src/modules/<domain>/` must:

1. Declare only its own controllers, use cases, services, and repositories in its `providers` array.
2. Import only modules that provide services it depends on.
3. Export only what other modules need to consume.
4. Not import global modules (they are available automatically).

### Allowed Import Directions

```
AppModule imports → Feature Modules
Feature Module A imports → Feature Module B (when B exports needed services)
Feature Module → Core Module (e.g., ConfigModule)
```

### Forbidden Import Directions

- Feature Module importing from another Feature Module's internal files directly (must go through exports).
- Core infrastructure importing from Feature Modules.
- Repositories importing from Use Cases or Controllers.
- Use Cases importing from Controllers.

### Cross-Module Dependencies (Verified)

The following cross-module dependencies are established and approved:

| Consumer Module | Dependency | Provided Via |
|----------------|-----------|--------------|
| `InventoryModule` | `AuthorizationModule` | `ScreenPermissionGuard` |
| All modules | `PrismaModule` | Global |
| All modules | `LoggerModule` | Global |
| All controllers | `ThrottlerModule` | Global (AppModule) |

---

## Guard Stack

The global guard application order is fixed and governed. The order is registered in `AppModule` and must not be changed without an ADR:

```
1. ThrottlerGuard         (rate limiting)
2. JwtAuthGuard           (authentication)
3. RolesGuard             (role-based authorization)
4. ScreenPermissionGuard  (screen-level CRUD authorization)
```

Each guard runs in sequence. A request that fails `ThrottlerGuard` never reaches `JwtAuthGuard`. A request that fails `JwtAuthGuard` never reaches `RolesGuard`.

### Guard Rules

- `@Public()` decorator bypasses `JwtAuthGuard` only. Rate limiting still applies.
- `@Roles()` decorator required on any endpoint that restricts by role.
- `@ScreenPermission()` decorator required on any endpoint that enforces screen permissions.
- All endpoints require authentication unless `@Public()` is applied.

---

## Exception Filter Order

Global exception filters are registered imperatively in `main.ts`. The order is fixed:

```
1. PrismaExceptionFilter   (maps Prisma error codes P2002, P2025, P2003, P2014)
2. AllExceptionsFilter      (catch-all fallback)
```

`PrismaExceptionFilter` must always be listed **before** `AllExceptionsFilter` in the `app.useGlobalFilters()` call. Reversing the order causes all Prisma errors to be swallowed by `AllExceptionsFilter` and returned as 500 instead of the correct HTTP code.

---

## Response Envelope

All API responses follow a unified envelope shape:

```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "ISO-8601",
  "path": "/v1/..."
}
```

This envelope is applied by `ResponseInterceptor` in `AppModule`. No controller or service must manually construct this wrapper. No controller must return raw Prisma entities — all data passes through mapper services before reaching the controller.

---

## Serialization Rules

### BigInt

All `BigInt` values must be serialized to `string` before leaving the API layer. `serializeBigInts()` is applied by `ResponseInterceptor`. No BigInt value may be returned as a raw number in JSON. JavaScript `JSON.stringify()` throws on BigInt — this behavior is governed by the interceptor.

### Prisma Decimal

Prisma `Decimal` implements `.toJSON()` returning a string. No manual conversion is needed. Do not convert Decimal to `number` (precision loss).

---

## ADR Policy

### When an ADR Is Required

An ADR must be written whenever:

1. A technology choice is made (framework, library, ORM, database).
2. A significant architectural pattern is chosen over alternatives.
3. A business constraint drives a technical implementation choice.
4. A deviation from an existing pattern is introduced.
5. A decision is made that future engineers would likely question.

### ADR Format

ADRs live in `docs/architecture/adr/`. The numbering sequence continues from ADR-026.

Required sections:
- **Context:** Why the decision was needed.
- **Decision:** What was decided.
- **Consequences:** What trade-offs were accepted.
- **Status:** Accepted / Superseded / Deprecated.

### ADR Immutability

Accepted ADRs are not modified. If a decision is reversed, the original ADR is marked `Superseded by ADR-NNN` and a new ADR is written.

---

## Allowed Patterns

The following patterns are pre-approved and must be used consistently:

| Pattern | Where Applied |
|---------|--------------|
| CQRS (Commands + Queries) | All use cases in inventory and future modules |
| Repository pattern | All data access |
| DTO validation (class-validator) | All controller inputs |
| Mapper services | DTO ↔ domain model conversion |
| Factory services | Domain object construction (with business invariants) |
| Validator services | Business rule validation |
| `executeInTransaction()` | Multi-record atomic operations |
| `@Public()` decorator | Unauthenticated endpoints |
| `serializeBigInts()` | BigInt serialization in response interceptor |

---

## Forbidden Patterns

The following patterns are explicitly prohibited:

| Pattern | Reason |
|---------|--------|
| `PrismaService` injected in Controller | Violates layer ordering |
| `PrismaService` injected in Service | Violates layer ordering |
| `PrismaService` injected in Use Case | Violates layer ordering |
| `prisma db pull` | Destroys custom schema definitions |
| `prisma migrate deploy` | `elkardousy` lacks DDL privileges |
| `console.log()` in production code | Use `LoggerService.info()` |
| `this.logger.log()` | Method does not exist on `LoggerService` |
| Raw `process.env` access | Use `ConfigService` with namespaced config |
| `export { SomeInterface }` for pure types | Must use `export type { SomeInterface }` (isolatedModules) |
| `findUnique()` on composite PK tables | Use `findFirst()` for `inventory_transactions`, `audit_events` |
| Returning `EXPIRED` from ReservationStatusEnum | Enum has no EXPIRED value; expire → CANCELLED |
| Circular imports | NestJS DI will throw at startup |

---

## Compliance Rules

### Rule A-001 — Layer Injection

**Classification:** MANDATORY  
**Statement:** `PrismaService` must only be injected by classes that extend `BaseRepository`. Any class injecting `PrismaService` that does not extend `BaseRepository` is a violation.  
**Violation Impact:** Architecture violation, blocking code review.  
**Risk:** Untestable code, bypassed transaction management.  
**Recovery:** Refactor to use a repository. Create a new repository if needed.  
**Approval Required:** Architect sign-off on any claimed exception.

### Rule A-002 — Single Controller Entry Point

**Classification:** MANDATORY  
**Statement:** Each controller action (HTTP endpoint handler) must call exactly one use case. Business logic in controllers is forbidden.  
**Violation Impact:** Blocking code review finding.  
**Risk:** Untestable business logic, controller bloat.  
**Recovery:** Extract logic to a use case.  
**Approval Required:** None — this is an implementation requirement.

### Rule A-003 — Composite PK Query

**Classification:** MANDATORY  
**Statement:** Tables with composite PKs (`inventory_transactions`, `audit_events`) must be queried using `findFirst()`, not `findUnique()`. `findUnique()` on composite PKs throws a Prisma error at runtime.  
**Violation Impact:** Runtime error (500) on affected endpoints.  
**Risk:** Data retrieval failure.  
**Recovery:** Replace `findUnique()` with `findFirst()` using `where` clause for all composite PK fields.  
**Approval Required:** None.

### Rule A-004 — Global Module Non-Re-Import

**Classification:** MANDATORY  
**Statement:** `PrismaModule`, `LoggerModule`, `AuditModule`, and `DocumentNumberingModule` must not appear in any feature module's `imports` array.  
**Violation Impact:** NestJS provider duplication, potential DI conflicts.  
**Risk:** Runtime errors, duplicate provider instances.  
**Recovery:** Remove from feature module imports array.  
**Approval Required:** None.

### Rule A-005 — Filter Registration Order

**Classification:** MANDATORY  
**Statement:** In `main.ts`, `PrismaExceptionFilter` must be the first argument to `app.useGlobalFilters()`, followed by `AllExceptionsFilter`.  
**Violation Impact:** All Prisma errors return HTTP 500 instead of correct codes (409, 404, 400).  
**Risk:** Incorrect error responses; Prisma constraint violations masked.  
**Recovery:** Restore correct registration order.  
**Approval Required:** None — restore to documented order.

---

## Exceptions

Architecture exceptions require:
1. Written rationale in an ADR.
2. Architect approval.
3. Documentation in KEB-02 (Architecture Baseline) after approval.
