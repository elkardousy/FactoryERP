# PROJECT_MEMORY.md

> **Primary entry point for every future AI session and developer onboarding.**
> Reading this file, `docs/architecture/ADR_INDEX.md`, and `CLAUDE.md` is sufficient to resume development without any prior conversation history.

---

## Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | FactoryERP — Garment Manufacturing ERP |
| **Package Name** | `backend` |
| **Package Version** | 0.0.1 (internal; functional milestone: v0.3.0-business-foundation) |
| **Current Phase** | Business Foundation — Complete |
| **Current Sprint** | Sprint 10.5 (Stabilization + Architecture Documentation) |
| **Current Milestone** | Business Foundation Acceptance |
| **Current Git Branch** | `main` |
| **Latest Git Tag** | `v0.3.0-business-foundation` |
| **Recommended Next Tag** | `v0.4.0-cmo-foundation` |
| **Generation Date** | 2026-06-26 |

---

## Executive Summary

FactoryERP is a TypeScript/NestJS monolith implementing a garment manufacturing ERP for a factory environment. The project follows Clean Architecture with strict layer ordering (Controllers → Use Cases → Services → Repositories → PrismaService), NestJS module boundaries, and a PostgreSQL database accessed exclusively via Prisma 6.

**Architecture status:** Complete and stable. All infrastructure layers (auth, authorization, audit, document numbering, logging, validation, serialization, error handling) are implemented, tested, and documented.

**ERP maturity:** The master data layer (Business Foundation) is complete — 9 domain modules covering organization, infrastructure, relationships, product catalog, and measurements. The transactional ERP layers (Customer Manufacturing Orders, inventory, production) are defined in the Prisma schema but not yet implemented in application code.

**Implementation phase:** Entering the Customer Manufacturing Order (CMO) phase. The Business Foundation provides all prerequisite master data for CMO operations.

**Repository health:** Excellent. Lint: 0 errors. Build: clean. Tests: 20 suites / 142 tests passing. 26 ADRs documenting all significant architectural decisions. Full architecture documentation suite complete.

---

## Current Status

### Platform Status

| Concern | Status |
|---------|--------|
| NestJS framework | v11 — operational |
| Prisma ORM | v6 — schema complete, no migration files yet |
| TypeScript | Strict mode (`strictNullChecks`, `isolatedModules`) — clean |
| Configuration | ConfigModule with Joi validation — operational |
| Swagger UI | Available at `/api/docs` — operational |
| URI versioning | All routes under `/v1/` — operational |

### Business Foundation Status

| Module | Entities | Soft/Hard Delete | Auto-Code | Tests |
|--------|----------|-----------------|-----------|-------|
| `organization` | Departments, Work Shifts | Soft + Reactivate | — | ✅ |
| `production-setup` | Production Lines (soft), Production Stages (hard) | Mixed | — | ✅ |
| `warehouses` | Warehouses | Soft + Reactivate | — | ✅ |
| `customers` | Customers | Soft + Reactivate | customer_code | ✅ |
| `suppliers` | Suppliers | Soft + Reactivate | supplier_code | ✅ |
| `garment-models` | Models, Parts, Color-Sizes | Soft + Reactivate | — | ✅ |
| `measurements` | Colors, Sizes | Hard Delete | — | ✅ |

### Acceptance Status

| Review | Status |
|--------|--------|
| Platform Foundation Review | Accepted |
| Authentication Architecture Review | Accepted |
| Authorization Architecture Review | Accepted |
| Business Foundation Review | Accepted |
| Sprint 10.5 Stabilization | Accepted |

### Documentation Status

| Document Set | Status |
|-------------|--------|
| ADRs (26 files, ADR-000 to ADR-025) | Complete |
| ADR_INDEX.md | Complete |
| ARCHITECTURE_SUMMARY.md | Complete |
| ARCHITECTURE_PRINCIPLES.md | Complete |
| ARCHITECTURE_TIMELINE.md | Complete |
| TECHNOLOGY_DECISIONS.md | Complete |
| DEPENDENCY_RULES.md | Complete |
| REPOSITORY_RULES.md | Complete |
| CODING_STANDARDS.md | Complete |
| PROJECT_MEMORY.md | Complete (this file) |

### ADR Status

26 ADRs, all status **Accepted**. See [docs/architecture/ADR_INDEX.md](architecture/ADR_INDEX.md).

### Testing Status

```
Test Suites:  20 passed, 20 total
Tests:       142 passed, 142 total
Snapshots:     0 total
```

All use-case classes have unit test coverage. Infrastructure services (PasswordService, TokenService, JwtStrategy, DocumentNumberingService, ResponseInterceptor, MemoryPermissionCache, AuthorizationService, PermissionResolverService) have dedicated test suites.

### Build Status

`npm run build` — **clean**. No TypeScript errors. Output in `./dist`.

### Lint Status

`npm run lint` — **0 errors, 0 warnings**.

ESLint spec file override is in place for `*.spec.ts` files (turns off `unbound-method`, `no-unsafe-assignment`, `no-unsafe-argument`, `no-unsafe-member-access`).

### Database Status

**Schema:** Complete in `prisma/schema.prisma`. 98 Prisma models covering the full ERP domain (master data through production and finance). All models in the `factory` PostgreSQL schema. `previewFeatures = ["multiSchema"]` active.

**Migrations:** No `prisma/migrations/` directory exists. The schema has not yet been applied to any database via `prisma migrate dev`. This is the most critical pending item before integration testing is possible.

### Migration Status

**Blocked.** No migrations have been generated or applied. Running `npx prisma migrate dev --name initial-schema` against a PostgreSQL instance with the `factory` schema is the first step before any database operation can succeed.

---

## Completed Milestones

### 1 — Platform Foundation

**Date:** 2026-06 (Sprint 02)
**Version:** foundation-v1

Core infrastructure assembled: PrismaService with global module, BaseRepository abstract class, AllExceptionsFilter + PrismaExceptionFilter (registered imperatively in `main.ts`), nestjs-pino structured logging with sensitive header redaction, GlobalValidationPipe, ConfigModule with Joi env validation, Swagger with Bearer JWT, CorrelationIdMiddleware.

---

### 2 — Authentication Foundation

**Date:** 2026-06 (Sprint 03)
**Version:** v0.1.0-auth-foundation

JWT authentication with session-based revocation implemented. UsersRepository, PasswordService (bcrypt 12 rounds), JwtService, TokenService (composite refresh token `{sessionId}:{rawUUID}`), SessionService, LoginUseCase with re-signing pattern (JWT re-signed after session creation to embed real `sessionId`), JwtStrategy (per-request session database check).

---

### 3 — Authorization Architecture

**Date:** 2026-06 (Sprint 04)

Role-based and screen-permission guard stack: ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard. Deny-by-default: no `@Roles()` = system admin only. `IPermissionCache` interface with `MemoryPermissionCache` implementation. UserRole enum with 7 roles.

---

### 4 — Response and Serialization Infrastructure

**Date:** 2026-06 (Sprint 05)

ResponseInterceptor with response envelope `{ data, statusCode, timestamp, path }`, `serializeBigInts()` utility for BigInt-to-string JSON conversion, `buildPaginationMeta()` helper, `PaginatedResult<T>` interface, `ErrorResponse` class.

---

### 5 — Audit Architecture

**Date:** 2026-06 (Sprint 06)

AuditModule declared `@Global()`. AuditService with fire-and-forget pattern (`void this.auditService.log()`). `audit_events` table with JSONB payload and composite key `[event_id, occurred_at]` for future partitioning.

---

### 6 — Document Numbering

**Date:** 2026-06 (Sprint 07)

DocumentNumberingModule declared `@Global()`. Template-based atomic sequence generation via `UPDATE ... RETURNING`. Template syntax: `{YYYY}-{MM}-{SEQ:N}`. Used for `customer_code` and `supplier_code`.

---

### 7 — Business Foundation Modules

**Date:** 2026-06 (Sprints 08–10)

All 7 business foundation modules implemented: Organization (departments, working shifts), Production Setup (production lines, production stages), Warehouses, Customers, Suppliers, Garment Models (with parts and color-size assignments), Measurements (colors, sizes).

Pattern: Repository → Use Cases → Controller. Soft-delete with reactivation (`PATCH /:id/reactivate`) for entity-type resources. Hard-delete for lookup tables. Auto-generated codes via DocumentNumberingService for customers and suppliers.

---

### 8 — Business Foundation Stabilization

**Date:** 2026-06-25 (Sprint 10.5)

20 test suites, 142 tests written. 53 lint errors resolved. ESLint spec file override added. `npm run lint`: 0 errors. `npm run build`: clean. `npm test`: 20/20 suites passing.

---

### 9 — Architecture Documentation

**Date:** 2026-06-26 (Sprint 10.5 Documentation)

26 ADRs (ADR-000 through ADR-025) written from codebase analysis. Complete architecture documentation suite: ADR_INDEX, ARCHITECTURE_SUMMARY, ARCHITECTURE_PRINCIPLES, ARCHITECTURE_TIMELINE, TECHNOLOGY_DECISIONS, DEPENDENCY_RULES, REPOSITORY_RULES, CODING_STANDARDS, PROJECT_MEMORY.

---

## Current Repository Metrics

| Metric | Count |
|--------|-------|
| Domain modules | 9 |
| Core/infrastructure modules | 4 (Prisma, Logger, Audit, DocumentNumbering) |
| Total registered NestJS modules | 13 |
| Repositories | 18 |
| Controllers | 13 |
| Services | 12 (4 core + 8 module) |
| Use Cases | 62 |
| DTO files | 18 |
| ADRs | 26 |
| Architecture documents | 9 (summary, principles, timeline, tech decisions, dep rules, repo rules, coding standards, index, this file) |
| Prisma schema models | 98 |
| Test suites | 20 |
| Automated tests | 142 |
| Build status | ✅ Clean |
| Lint status | ✅ 0 errors / 0 warnings |

---

## Current Architecture

### Layering Strategy

Strict four-layer ordering enforced by convention and code review:
```
Controllers → Use Cases → Services → Repositories → PrismaService
```
Repositories are the only layer permitted to inject PrismaService. See [ADR-002](architecture/adr/ADR-002-Clean-Architecture.md).

### Repository Pattern

All repositories extend `BaseRepository` (`src/core/database/repositories/base/`). `BaseRepository` exposes `this.db` (alias for `this.prisma`) and `executeInTransaction<T>()`. Transactions pass a cast `tx as PrismaService` — treat as `Prisma.TransactionClient` inside the callback. See [ADR-001](architecture/adr/ADR-001-Repository-Pattern.md).

### Clean Architecture

Controllers: thin HTTP adapters — validate input, call one use case, return the result.
Use Cases: all business logic, orchestrate repositories and services, emit audit events.
Services: reusable cross-cutting capabilities (PasswordService, JwtService, TokenService, DocumentNumberingService, etc.).
See [ADR-002](architecture/adr/ADR-002-Clean-Architecture.md).

### Authorization Pipeline

Guard stack registered in `AppModule` via `APP_GUARD`:
```
ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard
```
Deny-by-default: no `@Roles()` annotation = system admin only. `@Public()` skips JwtAuthGuard. See [ADR-013](architecture/adr/ADR-013-Permission-Resolution.md).

### Audit Pipeline

Every state-changing use case calls:
```typescript
void this.auditService.log({ action: 'ENTITY_ACTION', entityId, userId, payload });
```
Always fire-and-forget. Never `await`. AuditModule is `@Global()`. See [ADR-016](architecture/adr/ADR-016-Audit-Architecture.md).

### Validation Strategy

`GlobalValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. All HTTP input must be DTO classes with `class-validator` decorators. See [ADR-006](architecture/adr/ADR-006-Validation-Strategy.md).

### Serialization Strategy

`ResponseInterceptor` wraps all successful responses in `{ data, statusCode, timestamp, path }`. Calls `serializeBigInts()` before wrapping — converts all `BigInt` fields to strings (JSON does not support BigInt). All IDs in API responses are strings. See [ADR-015](architecture/adr/ADR-015-Response-Serialization.md) and [ADR-021](architecture/adr/ADR-021-BigInt-Serialization.md).

### Document Numbering

`DocumentNumberingService.generate(entityType)` generates atomic, gap-free codes. Template stored in DB: `{YYYY}-{MM}-{SEQ:N}`. Used by `CreateCustomerUseCase` and `CreateSupplierUseCase`. Adding new document types requires only a DB row insert. See [ADR-017](architecture/adr/ADR-017-Document-Numbering.md).

### Shared Infrastructure (Global Modules)

| Module | Exports | Scope |
|--------|---------|-------|
| `PrismaModule` | `PrismaService` | All modules |
| `LoggerModule` | `LoggerService` | All modules |
| `AuditModule` | `AuditService` | All modules |
| `DocumentNumberingModule` | `DocumentNumberingService` | All modules |

These do not need to be imported in feature modules — `@Global()` makes their exports universally available.

### Business Foundation

7 domain modules covering all master data required for ERP operations:
- **Organization**: departments, working shifts
- **Production Setup**: production lines, production stages
- **Warehouses**: warehouse locations
- **Customers**: customer master with auto-generated codes
- **Suppliers**: supplier master with auto-generated codes
- **Garment Models**: model catalog with customer binding, parts, and color-size assignments
- **Measurements**: colors and sizes lookup tables

---

## Recent Architectural Decisions

All 26 ADRs were written in Sprint 10.5 to document decisions made throughout the project. Key decisions introduced since the authorization phase:

| ADR | Decision |
|-----|---------|
| ADR-016 | Fire-and-forget audit with JSONB payloads and composite keys for future partitioning |
| ADR-017 | Template-based atomic document numbering via `UPDATE ... RETURNING` |
| ADR-019 | Business Foundation module pattern: soft-delete + reactivation + audit on all writes |
| ADR-020 | Soft-delete via `is_active: boolean` + `PATCH /:id/reactivate`; hard-delete for lookup tables |
| ADR-021 | BigInt serialized to string in all API responses via `JSON.stringify` replacer |
| ADR-022 | Formal layer dependency matrix and cross-module rules (CM-1, CM-2, CM-3) |
| ADR-023 | Defense-in-depth security: Helmet + ThrottlerGuard + bcrypt 12 rounds + session revocation |
| ADR-024 | Scalability provisions: BigInt PKs, composite keys, schema isolation, interface-based cache |
| ADR-025 | Full ERP domain model: CMO → Procurement → Inventory → Production roadmap |

---

## Current Risks

### Critical Risks

**RISK-C1: No database migrations exist**

The Prisma schema is complete but `prisma/migrations/` does not exist. No integration test or end-to-end test is possible until `npx prisma migrate dev --name initial-schema` is run against a live PostgreSQL instance with the `factory` schema. All current test coverage is unit tests with mocked repositories — no query has ever been executed against a real database.

**Impact:** Cannot verify query correctness, FK constraint behavior, or schema validity until migrations are generated.

### High Risks

**RISK-H1: AuditRepository in AuthModule**

`src/modules/auth/repositories/audit.repository.ts` is a duplicate audit repository in the auth module, predating the global `AuditModule`. Auth use-cases should use `AuditService` from `AuditModule` instead. This is inconsistent with the fire-and-forget audit pattern and the global module design.

**Impact:** Auth audit events bypass the standard audit pipeline. Low immediate impact; high architectural debt.

### Medium Risks

**RISK-M1: Incomplete schema fields**

The following schema additions are pending:
- `@updatedAt` on: `departments`, `working_shifts`, `warehouses`, `production_lines`
- `deactivated_at DateTime?` and `deactivated_by BigInt?` on all soft-delete entities

**Impact:** Missing audit trail fields for deactivation events. Not blocking but should be resolved before production.

**RISK-M2: No integration tests**

All 142 tests are unit tests with mocked repositories. No tests verify that the Prisma queries are correct, that FK constraints are respected, or that migrations apply cleanly.

**Impact:** Bugs in repository query logic will not be detected until manual testing or production.

### Low Risks

**RISK-L1: Memory permission cache is single-instance only**

`MemoryPermissionCache` stores screen permissions in process memory. In a multi-instance deployment, each instance has a separate cache — cache invalidation on one instance does not propagate. The `IPermissionCache` interface supports dropping in a Redis implementation without application code changes (see ADR-014), but Redis is not yet configured.

**Impact:** Acceptable for single-instance deployment. Must be addressed before horizontal scaling.

---

## Technical Debt

### TD-1 (High): AuditRepository in AuthModule

`src/modules/auth/repositories/audit.repository.ts` must be removed. Auth use-cases (`LoginUseCase`, `LogoutUseCase`, `RefreshUseCase`) must be updated to call `AuditService` from the global `AuditModule` using the fire-and-forget pattern.

### TD-2 (Medium): Missing Schema Fields

Missing `@updatedAt`, `deactivated_at`, and `deactivated_by` on several entities. Requires schema change + migration.

### TD-3 (Medium): PaginationDto and IdParamDto Missing @ApiProperty

`src/common/dto/pagination/pagination.dto.ts` and `src/common/dto/params/id-param.dto.ts` lack `@ApiProperty()` decorators. Swagger schema for these DTOs is incomplete.

### TD-4 (Medium): findAllWithPagination Inconsistency

Not all list use-cases apply a default `is_active: true` filter. The `findAllWithPagination` pattern is not fully standardized across all repositories.

### TD-5 (Low): `customer_id` in UpdateModelDto

`UpdateModelDto` includes `customer_id` — changing the customer binding on an existing model is not a valid business operation. The field should be removed from the update DTO.

---

## Known Limitations

**No database applied:** The entire codebase has been developed and tested with mocked repositories. A live PostgreSQL connection with the `factory` schema and a successful `prisma migrate dev` run have not occurred.

**No Docker / deployment configuration:** There is no `Dockerfile`, `docker-compose.yml`, or CI/CD pipeline. Deployment process is undefined.

**No E2E tests:** The `test/` directory has an e2e config but no e2e tests have been written. All coverage is at the unit test level.

**Single-instance session store:** The `UserSession` validation on every request hits the PostgreSQL `user_sessions` table. For high-concurrency deployments, a Redis session cache would be needed.

**No refresh token rotation:** The current implementation does not rotate refresh tokens on use. If a refresh token is stolen, it can be used until it expires or the session is explicitly revoked.

---

## Immediate Next Sprint

### Sprint 11 — Database Foundation + CMO Phase Bootstrap

**Objectives:**

1. Apply the Prisma schema to a real PostgreSQL database
2. Resolve all High and Medium technical debt items
3. Implement the Customer Manufacturing Order (CMO) module

**Step 1: Database Setup (Prerequisite)**

```bash
# Ensure PostgreSQL is running with the factory schema available
# Set DATABASE_URL in .env
npx prisma migrate dev --name initial-schema
npx prisma generate
```

This generates `prisma/migrations/` and verifies the 98-model schema is valid.

**Step 2: Resolve Technical Debt (Before CMO)**

- [ ] TD-1: Remove `AuditRepository` from `AuthModule`; migrate auth use-cases to `AuditService`
- [ ] TD-2: Add `@updatedAt`, `deactivated_at DateTime?`, `deactivated_by BigInt?` to relevant models; run `prisma migrate dev`
- [ ] TD-3: Add `@ApiProperty()` to `PaginationDto` and `IdParamDto`
- [ ] TD-4: Standardize `findAllWithPagination` with default `is_active: true` across all repositories
- [ ] TD-5: Remove `customer_id` from `UpdateModelDto`

**Step 3: CMO Module**

New module: `src/modules/customer-orders/`

Entities (already in Prisma schema):
- `customer_manufacturing_orders` — top-level order record
- `cmo_line_items` — specific model+color+size+quantity combinations
- `packing_patterns` and `packing_pattern_lines` — customer-specified packaging

Use cases to implement:
- `CreateCmoUseCase` — validate customer active, validate models, create CMO + line items in transaction
- `GetCmoUseCase`
- `ListCmosUseCase` — paginated, filterable by customer/status
- `UpdateCmoUseCase`
- `CancelCmoUseCase` — soft-cancel with audit
- `ManageCmoLineItemsUseCase`

**Dependencies:** Customers module, GarmentModels module (customer binding validation).

**Acceptance Criteria:**
- Database migrations applied successfully
- All TD items resolved
- All existing tests still passing
- CMO module: 20+ tests covering all use cases
- Lint: 0 errors
- Build: clean

**Expected Deliverables:**
- `prisma/migrations/` directory with initial migration
- CMO module with full CRUD
- Updated test count ≥ 180 tests

---

## Long-Term Roadmap

### Phase 3 — CMO and Procurement (Sprint 11–13)

- Customer Manufacturing Orders (CMOs)
- Purchase Orders from suppliers
- Receiving audit items (quality inspection on receipt)
- Physical bags (barcode-tracked material units)

### Phase 4 — Inventory Management (Sprint 14–16)

- Inventory bags (logical inventory records)
- Inventory transactions (receive, reserve, release, consume, return)
- Stock reservations linked to production orders
- Inventory reporting and stock level queries

### Phase 5 — Production (Sprint 17–20)

- Production orders (linked to CMO line items)
- Production stage tracking (time-based stage logging)
- Workflow engine (approval templates, instances, steps)
- Supplementary material requests
- Defect recording

### Phase 6 — Operations Hardening (Sprint 21–22)

- E2E test suite
- Docker + docker-compose
- CI/CD pipeline
- Performance testing
- Security penetration testing
- Redis integration for session cache and permission cache

### Phase 7 — Version 1.0 Release

- All ERP domains implemented and tested
- Production deployment configuration complete
- Monitoring and alerting configured
- Documentation complete
- Stakeholder acceptance testing passed

---

## Development Rules

These rules are permanent project governance. Every contribution must comply.

**Architecture Rules:**
1. Repository Pattern — `PrismaService` is injected only in classes extending `BaseRepository`
2. Clean Architecture — Controllers → Use Cases → Services → Repositories → PrismaService (no skipping)
3. No cross-module repository injection (Rule CM-1) — cross-module data access via exported services only
4. Use Cases hold all business logic — Controllers are thin HTTP adapters

**Authorization Rules:**
5. Every protected endpoint must have `@Roles()` — no annotation = system admin access only
6. `ThrottlerGuard` always runs before authentication in the guard stack

**Audit Rules:**
7. Every state-changing use case emits an audit event
8. Audit writes are always fire-and-forget: `void this.auditService.log()` — never `await`

**Validation Rules:**
9. All HTTP input is typed as DTO classes with `class-validator` decorators
10. Update DTOs use `PartialType(CreateXxxDto)` — fields are never duplicated

**Configuration Rules:**
11. No `process.env` in application code — use `ConfigService.getOrThrow()` (two documented exceptions)
12. All configuration is validated by Joi at startup

**TypeScript Rules:**
13. `export type { Foo }` for interface/type re-exports (isolatedModules: true)
14. `PartialType` / `OmitType` from `@nestjs/swagger`, not `@nestjs/mapped-types`
15. BigInt PKs for all primary keys — no `int` or `number` IDs

**Logging Rules:**
16. Use `LoggerService` from `src/core/logger/` — no `console.log` in production code

**Testing Rules:**
17. Every Use Case class has a unit test suite
18. Repositories are mocked in unit tests — no real database connections in unit tests

**Database Rules:**
19. All schema changes go through Prisma migrations — no raw SQL schema changes
20. All tables in the `factory` PostgreSQL schema

---

## Repository Health

| Category | Score | Notes |
|----------|-------|-------|
| **Architecture** | 9 / 10 | Strict layer ordering, clean module boundaries. -1 for AuditRepository in AuthModule (TD-1) |
| **Security** | 8 / 10 | Defense-in-depth implemented. -1 no refresh token rotation; -1 no penetration test |
| **Performance** | 7 / 10 | Appropriate for current scale. -1 per-request session DB read; -1 no caching layer; -1 no load test |
| **Documentation** | 10 / 10 | 26 ADRs, complete architecture docs, PROJECT_MEMORY, CODING_STANDARDS |
| **Testing** | 7 / 10 | 142 unit tests passing. -3 for zero integration tests, zero E2E tests, no real DB queries tested |
| **ERP Readiness** | 4 / 10 | Business Foundation complete; transactional ERP layers (CMO, inventory, production) not yet implemented |
| **Overall Repository Health** | **8 / 10** | Production-ready foundation; ERP functionality not yet complete |

---

## Final Recommendation

**Current state:** The Business Foundation is feature-complete, lint-clean, and fully tested at the unit level. The architecture is sound, well-documented, and ready for the next phase. The codebase is in the best shape it has been at any point in the project.

**Ready for next sprint:** Yes — with one prerequisite. Before Sprint 11 begins, a live PostgreSQL connection must be established and `npx prisma migrate dev --name initial-schema` must succeed. This is not a code change; it is an infrastructure setup step.

**Current Git tag:** `v0.3.0-business-foundation` — applied at Business Foundation release.

**Recommended next milestone:** Sprint 11 — Database Foundation + CMO Phase Bootstrap (as described in "Immediate Next Sprint" above).

**Recommended next architecture review:** After CMO module is complete and integrated with real database migrations. The review should verify:
- FK constraint behavior matches the intended business rules
- Soft-delete filters work correctly in paginated queries
- Document numbering sequences are gap-free under concurrent load
- Audit events are correctly emitted for all CMO operations
