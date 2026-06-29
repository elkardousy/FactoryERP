# 10 — Engineering Decisions

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## ADR Summary (27 Architecture Decision Records)

All ADRs are located in `docs/architecture/adr/`.  
All 27 ADRs have status: **Accepted**.

---

## ADR-000: Architecture Principles

**Decision:** Establish 14 governing principles for the project.  
**Location:** `docs/architecture/adr/ADR-000-Architecture-Principles.md`

Key principles include:
- Clean Architecture with strict layer ordering
- Dependency inversion (depend on abstractions)
- Single Responsibility Principle
- No direct database access outside repositories
- Global modules for cross-cutting concerns

---

## ADR-001: Repository Pattern

**Decision:** Use the Repository Pattern to abstract all database access.  
**Why:** Allows service layer to remain database-agnostic, testable without live DB.  
**Implementation:** `BaseRepository` abstract class in `src/core/database/repositories/base/`

All repositories:
1. Extend `BaseRepository`
2. Are injected with `PrismaService` through constructor
3. Expose domain-focused methods (not raw Prisma queries externally)

---

## ADR-002: Clean Architecture

**Decision:** Implement strict Clean Architecture layer ordering.  
**Layer order:** Controllers → Use Cases → Services → Repositories → PrismaService  
**Enforcement:** Code review + CLAUDE.md rules

---

## ADR-003: NestJS Module Boundaries

**Decision:** Each domain is its own NestJS module with explicit imports/exports.  
**Why:** Enforces encapsulation, prevents accidental coupling.  
**Rule:** Only export what other modules need. Never expose repositories unless necessary.

---

## ADR-004: Prisma Integration

**Decision:** Use Prisma as the ORM with `PrismaModule` as `@Global()`.  
**Why:** Single source of truth for DB access, consistent types.  
**Constraints:**
- `previewFeatures = ["multiSchema"]` for factory schema
- All models in `@@schema("factory")`
- All PKs are BigInt

---

## ADR-005: Configuration System

**Decision:** Use `@nestjs/config` with namespaced configuration factories and Joi validation.  
**Why:** Type-safe config access, validated at startup, no silent env-var failures.  
**Namespaces:** `app`, `database`, `jwt`, `logger`

---

## ADR-006: Validation Strategy

**Decision:** Use `class-validator` + `class-transformer` via global `GlobalValidationPipe`.  
**Why:** Declarative validation at DTO level, consistent HTTP 400 responses.  
**Transformation:** DTOs transformed (whitelist: true, forbidNonWhitelisted implied).

---

## ADR-007: Exception Handling

**Decision:** Two global exception filters: `PrismaExceptionFilter` + `AllExceptionsFilter`.  
**Registration order matters:** PrismaExceptionFilter must be registered FIRST in `useGlobalFilters()`.  
**Why:** NestJS evaluates filters in reverse registration order.

---

## ADR-008: Logging Architecture

**Decision:** Use `nestjs-pino` for structured logging with `LoggerModule` as `@Global()`.  
**Why:** JSON output in production, structured context, request logging, sensitive header redaction.  
**API:** `info()`, `warn()`, `error()`, `debug()` — no `.log()` method.

---

## ADR-009: Swagger Strategy

**Decision:** Swagger at `/api/docs`, Bearer JWT security, `@ApiProperty()` on all DTOs.  
**Why:** API documentation co-located with code, always up-to-date.

---

## ADR-010: Authentication

**Decision:** JWT-based authentication with Passport.js.  
**Why:** Stateless, scalable, industry standard.  
**Implementation:** `JwtStrategy`, `JwtAuthGuard` (global via APP_GUARD).

---

## ADR-011: JWT and Refresh Tokens

**Decision:** Short-lived access tokens (15m) + long-lived refresh tokens (7d).  
**Why:** Security (short access window) + UX (no frequent re-login).  
**Storage:** Refresh tokens hashed and stored in `user_sessions`.

---

## ADR-012: Authorization Architecture

**Decision:** Two-layer authorization: Role-based (RolesGuard) + Screen-level (ScreenPermissionGuard).  
**Why:** Coarse role checking first (fast), fine CRUD permissions second.

---

## ADR-013: Permission Resolution

**Decision:** `PermissionResolverService` resolves effective permissions by combining role + screen permissions.  
**Cache:** Results cached in `MemoryPermissionCache`.

---

## ADR-014: Permission Cache

**Decision:** In-memory cache for permission resolution.  
**Why:** Permission resolution hits multiple DB tables — caching avoids per-request overhead.  
**Registered as:** `PERMISSION_CACHE` injection token.  
**Risk:** Cache invalidation on role/permission changes (manual or restart required).

---

## ADR-015: Response Serialization

**Decision:** All responses wrapped in `{ data, statusCode, timestamp, path }` envelope by `ResponseInterceptor`.  
**BigInt handling:** `serializeBigInts()` utility called before wrapping.  
**Decimal handling:** Prisma `Decimal` serializes naturally via `.toJSON()`.

---

## ADR-016: Audit Architecture

**Decision:** All significant entity operations logged to `audit_events` via `AuditService` (global).  
**Storage:** PostgreSQL `audit_events` table with composite PK `[event_id, occurred_at]`.  
**Payload:** JSON blob of entity snapshot at time of event.

---

## ADR-017: Document Numbering

**Decision:** Centralized `DocumentNumberingService` for all auto-generated document numbers.  
**Storage:** `number_sequences` table with patterns and current values.  
**Why:** Consistent naming, sequential numbers, auditable.

---

## ADR-018: Testing Strategy

**Decision:** Unit test use cases with mocked repositories. No DB in unit tests.  
**E2E:** Skeleton exists, not fully implemented.  
**Repository tests:** Not implemented (considered integration tests, require live DB).

---

## ADR-019: Business Foundation

**Decision:** Build all master data modules (customers, suppliers, models, etc.) before transaction modules.  
**Why:** Transaction modules depend on master data entities being stable.

---

## ADR-020: Shared Infrastructure

**Decision:** Core infrastructure (Prisma, Logger, Audit, Config) are `@Global()` modules.  
**Why:** Avoids redundant imports across 10+ feature modules.

---

## ADR-021: BigInt Serialization

**Decision:** All PKs are BigInt. `serializeBigInts()` in ResponseInterceptor converts to strings.  
**Why:** PostgreSQL BigInt → JavaScript BigInt → JSON stringify throws. String conversion ensures safe serialization.  
**Contract:** All IDs in API responses are strings.

---

## ADR-022: Dependency Rules

**Decision:** Strict unidirectional dependency graph: outer layers depend on inner layers, never reverse.  
**Enforcement:** No circular imports. Module exports control what is accessible.  
**See:** `docs/architecture/DEPENDENCY_RULES.md`

---

## ADR-023: Security Principles

**Decision:** Security-first approach with Helmet, CORS, rate limiting, input validation, auth on all routes.  
**Implementation:**
- Helmet (HTTP security headers)
- ThrottlerGuard (rate limit: 60/60s globally)
- GlobalValidationPipe (strip unknown fields)
- JwtAuthGuard on all routes (Public decorator for exceptions)

---

## ADR-024: Future Scalability

**Decision:** Monolith-first, designed for potential future extraction into services.  
**Current state:** Single NestJS process.  
**Scalability path:** Module boundaries are service-extraction boundaries.

---

## ADR-025: ERP Architecture Vision

**Decision:** Full ERP coverage in phases: Foundation → Business Foundation → Transaction Engine → Execution.  
**Current phase:** Phase 3 (Transaction & Execution Engine), Sprint 11.3.

---

## ADR-026: Inventory Architecture

**Decision:** Inventory module uses dual-model approach:
1. `inventory_bags` — aggregate ledger (dozens_on_hand per warehouse/model/part)
2. `physical_bags` — individual bag tracking with full lifecycle

Transaction engine creates audit trail in `inventory_transactions`.  
Reservation engine uses `physical_bag_reservations` with optimistic validation.

**Key invariants:**
- `inventory_transactions` composite PK requires `findFirst` not `findUnique`
- TRANSFER = two atomic records (RELEASE + RECEIVING) in one transaction
- Available qty = current_dozens - SUM(ACTIVE reserved_dozens)
- `expire` operation maps to CANCELLED status (no EXPIRED enum value)

---

## Key Engineering Decisions Not In ADRs

### Decision: prisma.config.ts skips .env loading

`prisma.config.ts` causes Prisma CLI to skip automatic `.env` loading.  
**Mitigation:** Every Prisma CLI command must be prefixed with `DATABASE_URL=...`.  
**Status:** Documented in CLAUDE.md as a known exception.

### Decision: postgres superuser required for migrations

`elkardousy` application user lacks `ALTER TABLE`/`CREATE TYPE` on `factory` schema (owned by `postgres`).  
**Mitigation:** All DDL executed as `postgres` superuser; then `prisma migrate resolve --applied`.  
**NEVER use:** `prisma migrate deploy` (would fail with privilege errors).

### Decision: expire → CANCELLED in ReservationStatusEnum

No `EXPIRED` value exists in the enum. The expire API endpoint sets status to `CANCELLED`.  
**Why:** The `/expire` endpoint provides API semantic distinction without requiring a new DB enum value.

### Decision: LoggerService methods: no .log()

`LoggerService` exposes `info()`, `warn()`, `error()`, `debug()`. There is no `.log()` method.  
**Why:** Follows Pino logger API convention. `.log()` would cause TS2339 compile error.

### Decision: InventoryController rolls up all inventory endpoints

A single `InventoryController` handles both transaction endpoints (8) and reservation endpoints (8).  
**Why:** Keeps the inventory module to one controller. If the module grows, split into sub-controllers.
