# Architecture Principles

These principles govern every architectural and implementation decision in FactoryERP. They are derived from the project's Clean Architecture approach and the constraints of building a production ERP for garment manufacturing.

See also: [ADR-000](adr/ADR-000-Architecture-Principles.md) for the full rationale behind each principle.

---

## P-1 — Strict Layer Ordering

```
Controllers → Use Cases → Services → Repositories → PrismaService
```

Each layer may only depend on the layer directly below it. No layer may import from a layer above it or skip a layer.

**Repositories** are the only layer permitted to inject `PrismaService`.

---

## P-2 — Use Cases Are the Business Logic Boundary

Every meaningful business operation is a dedicated Use Case class. Use Cases hold all orchestration logic: validate preconditions, coordinate repositories and services, emit audit events, and return results.

Controllers are thin HTTP adapters. They validate input, call one use case, return the result.

---

## P-3 — Services Provide Cross-Cutting Capabilities

Services (e.g., `PasswordService`, `JwtService`, `TokenService`) provide reusable, stateless capabilities. They are not business operations — they are tools that Use Cases call.

---

## P-4 — Deny by Default

All protected endpoints require explicit authorization. An endpoint without a `@Roles()` annotation is accessible to system administrators only. The system will not accidentally expose data by omission.

---

## P-5 — Audit Every Write Operation

Every state-changing use case emits an audit event. The audit write is always fire-and-forget (`void`). Business operations must never block on audit writing.

---

## P-6 — No `process.env` in Application Code

Configuration is read through `ConfigService`. Environment variables are validated at startup by Joi. The two documented exceptions (`PrismaService` constructor and `loggerConfig` constant) are the only permitted direct `process.env` reads.

---

## P-7 — BigInt for All Primary Keys

All tables use `BigInt @id @default(autoincrement())`. This supports tables that will exceed 2^31 rows and eliminates the need for a future int4-to-int8 migration.

---

## P-8 — Schema First

The Prisma schema is the single source of truth for the database. All schema changes go through Prisma migrations. No raw SQL schema changes outside of migration files.

---

## P-9 — Stable API Contracts

All routes are versioned (`/v1/`). Breaking API changes must introduce a new version. Existing versions must remain functional until explicitly deprecated.

---

## P-10 — LoggerService, Never console

All application logging uses `LoggerService` (from `src/core/logger/`). `console.log`, `console.error`, and `console.warn` are prohibited in production code.

---

## P-11 — Repository Isolation

Repositories are module-private. Cross-module data access uses exported services, not cross-module repository injection.

---

## P-12 — Factory Schema Isolation

All database tables are in the PostgreSQL `factory` schema. This provides multi-tenancy headroom, schema-level backup independence, and database sharing capability.

---

## P-13 — Interfaces at Capability Boundaries

Where future infrastructure changes are anticipated (e.g., swapping in-memory cache for Redis), define an interface and depend on it, not the implementation.

---

## P-14 — Tests for All Use Cases

Every Use Case class has a corresponding unit test suite. Use Cases are the business logic layer; they must be verifiably correct. Repositories are mocked; Services are mocked or real depending on complexity.

---

## How to Apply These Principles

When implementing a new feature or reviewing a pull request, validate against the following checklist:

- [ ] Does the new code follow the layer ordering (P-1)?
- [ ] Is business logic in a Use Case, not a Controller or Repository (P-2)?
- [ ] Are services stateless and reusable (P-3)?
- [ ] Is authorization explicit (P-4)?
- [ ] Does the Use Case emit an audit event for writes (P-5)?
- [ ] Does configuration come from `ConfigService` (P-6)?
- [ ] Are new PKs BigInt (P-7)?
- [ ] Is the schema changed through Prisma migration (P-8)?
- [ ] Does the API have a version prefix (P-9)?
- [ ] Is logging through `LoggerService` (P-10)?
- [ ] Is cross-module data access via exported services (P-11)?
- [ ] Is the table in the `factory` schema (P-12)?
- [ ] Is the new capability behind an interface (P-13)?
- [ ] Is there a use-case test suite (P-14)?
