# Architecture Timeline

Chronological record of major architectural milestones for FactoryERP.

---

## Sprint 01 — Project Bootstrap

**Milestone: NestJS project initialized**

- NestJS CLI project created with TypeScript
- ESLint + Prettier configured
- Initial `package.json` with core dependencies

---

## Sprint 02 — Core Infrastructure

**Milestone: Application foundation established**

- `PrismaService` with lifecycle management and `enableShutdownHooks`
- `PrismaModule` declared as `@Global()` — available everywhere without re-import
- `BaseRepository` abstract class with `this.db` alias and `executeInTransaction()`
- `PrismaExceptionFilter` mapping Prisma error codes to HTTP status codes
- `AllExceptionsFilter` as the catch-all fallback filter
- Filter registration in `main.ts` (imperative, not via DI) with correct ordering
- `LoggerModule` with `nestjs-pino`, sensitive header redaction, and pretty-print in dev
- `LoggerService` wrapping `PinoLogger`
- `GlobalValidationPipe` — whitelist, forbidNonWhitelisted, transform
- `ResponseInterceptor` — response envelope `{ data, statusCode, timestamp, path }`
- `ConfigModule` with Joi env validation, five required variables
- Config namespaces: `app`, `database`, `jwt`, `logger`
- Swagger configured with Bearer JWT

---

## Sprint 03 — Authentication

**Milestone: JWT authentication with session-based revocation**

- `UsersRepository` — queries the `users` table
- `PasswordService` — bcrypt with 12 salt rounds
- `JwtService` — wraps `@nestjs/jwt`, sign/verify/decode
- `TokenService` — `generateTokenPair()`, composite refresh token `{sessionId}:{rawUUID}`
- `SessionService` — session lifecycle (create, validate, revoke, revoke all)
- `LoginUseCase` — orchestrates authentication: verify password → create session → generate token pair → re-sign JWT with embedded `sessionId`
- `JwtStrategy` — passport strategy, validates session on every request
- `AuthModule` registered in `AppModule`

---

## Sprint 04 — Authorization

**Milestone: Role and screen-permission guard stack**

- `UserRole` enum: `system_admin`, `factory_manager`, `production_manager`, `warehouse_manager`, `hr_manager`, `accountant`, `operator`
- `RolesGuard` — enforces `@Roles()` decorator; deny-by-default (no annotation = system admin only)
- `ScreenPermissionGuard` — checks database-stored screen permissions for fine-grained UI access
- `IPermissionCache` interface for screen permissions
- `MemoryPermissionCache` — single-instance in-memory implementation
- `ThrottlerGuard` registered as first `APP_GUARD` (before auth)
- Guard stack order: `ThrottlerGuard → JwtAuthGuard → RolesGuard → ScreenPermissionGuard`
- `@Public()` decorator — skip `JwtAuthGuard` for unauthenticated endpoints
- `@CurrentUser()` parameter decorator — extract user from request

---

## Sprint 05 — Response Infrastructure

**Milestone: BigInt serialization and response envelope complete**

- `serializeBigInts()` utility — `JSON.stringify` replacer converting BigInt to string
- `ResponseInterceptor` updated to call `serializeBigInts` before wrapping
- `buildPaginationMeta()` helper — consistent pagination metadata
- `PaginatedResult<T>` interface — `{ items: T[], meta: PaginationMeta }`
- `ErrorResponse` class with `success = false as const`
- `CorrelationIdMiddleware` — assigns `X-Correlation-ID` to every request

---

## Sprint 06 — Audit Architecture

**Milestone: Fire-and-forget audit with JSONB payloads**

- `AuditModule` declared as `@Global()`
- `AuditService.log()` — fire-and-forget pattern, never awaited
- `audit_events` table with JSONB `payload` for arbitrary event metadata
- Composite key `[event_id, occurred_at]` enabling future table partitioning
- All use-cases in Business Foundation modules call `void this.auditService.log()`

---

## Sprint 07 — Document Numbering

**Milestone: Template-based atomic document numbering**

- `DocumentNumberingModule` declared as `@Global()`
- `number_sequences` table: `entity_type`, `template`, `last_number`, `prefix`, `suffix`, `pad_length`
- `DocumentNumberingService.generate()` — atomic `UPDATE ... RETURNING` to avoid race conditions
- Template syntax: `{YYYY}-{MM}-{SEQ:N}` where `N` is pad length
- Used in Customer and Supplier modules for `customer_code` and `supplier_code`

---

## Sprint 08 — Business Foundation: Organization

**Milestone: Departments and Work Shifts**

- `DepartmentsModule` — CRUD + soft-delete + reactivation
- `WorkShiftsModule` — CRUD + soft-delete + reactivation
- Standard module structure: repository → use-cases → controller
- Pagination via `PaginationDto` with `page`/`limit` query params

---

## Sprint 09 — Business Foundation: Infrastructure

**Milestone: Warehouses, Production Lines, Production Stages**

- `WarehousesModule` — CRUD + soft-delete + reactivation
- `ProductionLinesModule` — CRUD + soft-delete + reactivation
- `ProductionStagesModule` — CRUD + hard-delete (lookup table)
- Three modules follow identical structure

---

## Sprint 10 — Business Foundation: Relationships and Catalog

**Milestone: Customers, Suppliers, Garment Models, Measurements**

- `CustomersModule` — auto-generated `customer_code` via DocumentNumberingService
- `SuppliersModule` — auto-generated `supplier_code` via DocumentNumberingService
- `GarmentModelsModule` — bound to customer (`customer_id` FK), soft-delete
- `MeasurementsModule` — Colors (hard-delete) and Sizes (hard-delete), sub-resource endpoints

---

## Sprint 10.5 — Business Foundation Stabilization

**Milestone: Full test coverage and lint clean**

- Unit tests written for all 20 use-case suites (142 test cases total)
- ESLint spec file override added for test-specific rules
- 53 lint errors resolved across all modules
- `npm run lint`: 0 errors, 0 warnings
- `npm run build`: clean
- `npm run test`: 20 suites / 142 tests passing

---

## Sprint 10.5 (Documentation) — Architecture Decision Records

**Milestone: Complete ADR library (26 ADRs)**

- `docs/architecture/adr/` directory created
- ADR-000 through ADR-025 written
- `ADR_INDEX.md` with cross-reference by topic
- `ARCHITECTURE_PRINCIPLES.md` — governing principles
- `ARCHITECTURE_TIMELINE.md` (this document)
- `TECHNOLOGY_DECISIONS.md` — technology stack decisions
- `DEPENDENCY_RULES.md` — layer and module dependency rules
- `REPOSITORY_RULES.md` — git workflow and branch rules
- `CODING_STANDARDS.md` — TypeScript/NestJS coding standards
- `ARCHITECTURE_SUMMARY.md` — one-page architecture overview

---

## Pending (Backlog)

- **DB Schema Completion**: Add `updated_at @updatedAt` to `departments`, `working_shifts`, `warehouses`, `production_lines`; add `deactivated_at DateTime?` / `deactivated_by BigInt?` to all soft-delete entities
- **CMO Phase**: Customer Manufacturing Orders, Model Parts, Packaging Lists, CMO Line Items
- **Procurement Phase**: Purchase Orders, Receiving, Physical Bags
- **Inventory Phase**: Inventory Bags, Inventory Transactions, Stock Reservations
- **Production Phase**: Production Orders, Stage Tracking, Workflow Engine
