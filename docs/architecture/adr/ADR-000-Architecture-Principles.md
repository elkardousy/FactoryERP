# ADR-000 — Architecture Principles

## Title

Foundational Engineering Principles for the FactoryERP Platform

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

Before the first line of production code was written, the team needed to establish a permanent set of engineering principles to govern every architectural decision made throughout the lifecycle of the ERP platform.

Without explicit, written principles, different developers make different local decisions that feel individually correct but collectively create inconsistency. Inconsistency in an ERP system — which must remain maintainable for years and grow to cover dozens of business domains — is a form of structural debt that compounds over time.

The FactoryERP is a manufacturing-focused ERP covering production orders, inventory, customer management, supplier management, and eventually multi-site operations. Its architecture must support:

- Correctness over performance (inventory quantities must never be wrong)
- Auditability (every write must leave a traceable record)
- Extensibility (new ERP modules must plug in without rewiring core infrastructure)
- Security by default (authorization must be enforced everywhere, always)

---

## Decision

The following principles were adopted as the permanent architectural foundation of the FactoryERP platform. Every design decision documented in subsequent ADRs must be consistent with these principles.

### P-1: Strict Layer Ordering

Dependencies flow in exactly one direction:

```
Controllers → Use Cases → Services → Repositories → PrismaService
```

No layer may skip to a lower layer. No layer may depend on a higher layer. Repositories are the only layer that may touch PrismaService directly. This rule is enforced permanently and has no exceptions.

### P-2: Single Responsibility at Every Layer

Each class has exactly one reason to change. Use-cases implement a single business operation. Repositories manage data access for a single aggregate. Controllers handle HTTP translation only. Services provide reusable cross-cutting capability.

### P-3: Security by Default

Authorization is enforced by the framework, not by individual controllers. Global guards run on every request. Public routes must be explicitly opted in via `@Public()`. The default posture is deny.

### P-4: Audit Everything

Every state-changing operation against a business entity must produce an audit event. Audit logging uses a fire-and-forget pattern — audit failures must never prevent business operations from completing. Audit gaps are preferable to audit-induced data loss.

### P-5: Fail Fast at System Boundaries

All external input (HTTP requests, environment variables) is validated before it enters the application. Inside the application, trust internal code. Do not add defensive validation that duplicates framework guarantees.

### P-6: Configuration is Explicit

No code reads `process.env` directly except in designated configuration factories. All configuration is namespaced, validated at startup, and accessed via NestJS `ConfigService`. Missing required configuration terminates the process at startup rather than failing silently at runtime.

### P-7: BigInt for All Primary Keys

All primary keys are 64-bit integers (PostgreSQL `bigint`). This supports high-cardinality tables (audit events, inventory transactions, physical bag tracking) and eliminates the future need to migrate ID types.

### P-8: All Data Lives in the Factory Schema

All application tables are isolated within the PostgreSQL `factory` schema. This enables co-location of multiple schemas in one database instance and supports future multi-tenancy or schema-level migrations.

### P-9: Timestamps are Always Timezone-Aware

All `DateTime` columns use `@db.Timestamptz(6)` (microsecond-precision, timezone-aware). The ERP will operate across time zones (shifts, warehouses, suppliers in different locales). Timezone-naive timestamps are a permanent source of data corruption in manufacturing systems.

### P-10: Documentation is Architecture

ADRs are first-class deliverables, not optional afterthoughts. Every significant architectural decision must be recorded before the next sprint begins. The ADR collection is the primary orientation tool for new developers and AI sessions.

---

## Rationale

These principles were selected because:

- **P-1 (Layer Ordering)** prevents accidental coupling between concerns that should be independent. When a controller injects a repository directly, it becomes impossible to test business logic without a database.
- **P-2 (SRP)** keeps code navigable. In an ERP with 50+ business operations, fat services with mixed responsibilities become unmaintainable within months.
- **P-3 (Security Default)** was chosen over opt-in security because ERP systems contain sensitive business data. A missed `@UseGuards()` annotation is a security breach. A missed `@Public()` annotation is a minor usability issue.
- **P-4 (Audit Everything)** is a legal and operational requirement for manufacturing ERPs. Production quantities, quality decisions, approvals, and inventory movements must be reconstructable from audit logs.
- **P-5 (Fail Fast)** prevents malformed data from propagating deep into the system. Validation at system boundaries is far cheaper than defensive guards scattered throughout business logic.
- **P-6 (Explicit Config)** was chosen because `process.env` reads scattered through the codebase make it impossible to identify all configuration dependencies or validate them at startup.
- **P-7 (BigInt IDs)** was chosen over UUIDs to maintain sort order (manufacturing events are inherently sequential) and avoid UUID collision complexity in distributed inserts. Over `int4` to support the expected cardinality of audit events and inventory transactions.
- **P-8 (Schema Isolation)** future-proofs for multi-schema deployments and makes backup/restore of the ERP data independent of other potential schemas in the same database.
- **P-9 (Timezone Timestamps)** is non-negotiable for manufacturing. A shift that starts at 06:00 local time and ends at 14:00 local time must be recorded correctly regardless of the database server's locale.
- **P-10 (Docs as Architecture)** ensures that the reasoning behind decisions survives personnel changes and AI context resets.

---

## Consequences

**Positive:**
- New developers can orient themselves to the codebase by reading ADRs rather than reverse-engineering code
- Authorization violations are structurally prevented rather than caught in code review
- Database schema is self-documenting and consistent
- Configuration errors surface at startup rather than in production

**Negative:**
- Principle P-1 means more files per feature (use-case file, service file, repository file vs. one fat service)
- BigInt IDs require explicit JSON serialization handling everywhere IDs appear in responses
- The `factory` schema requires `previewFeatures = ["multiSchema"]` which may have Prisma-version-specific behavior

**Trade-offs:**
- Strictness vs. pragmatism: The principles occasionally require more boilerplate than a purely pragmatic approach. This is an intentional trade-off for long-term maintainability.

**Future Implications:**
- All future ERP modules must be evaluated against these principles before implementation begins
- Any principle violation requires an explicit ADR amendment with documented rationale

---

## Related Components

- All modules in `src/modules/`
- All core infrastructure in `src/core/`
- `prisma/schema.prisma`
- `src/app.module.ts`
- `CLAUDE.md`

---

## Alternatives Considered

### Informal Conventions Without Written Principles

Rejected. Informal conventions are not enforced, not teachable, and not preserved across team changes. An ERP is a multi-year project; informal conventions decay.

### Framework-Imposed Architecture (e.g., NestJS without additional layer rules)

Rejected. NestJS provides module structure but does not enforce the use-case layer, the repository pattern, or the direction of dependencies. Additional rules are required.

### Domain-Driven Design Tactical Patterns (Aggregates, Value Objects, Domain Events)

Partially adopted. The use-case layer is DDD-inspired but the full tactical patterns (aggregates, value objects, domain services) were not mandated at this phase. They are compatible with the current structure and may be introduced incrementally.

---

## Future Evolution

These principles are intended to be permanent and stable. They should not be revised lightly.

As the ERP grows to cover additional domains (production planning, logistics, HR), each new module must demonstrate compliance with these principles in its acceptance review.

The only expected evolution is additive: as new cross-cutting concerns are identified (e.g., soft-delete patterns, multi-tenancy rules), new principles may be added to this document without invalidating existing ones.

---

## References

- `CLAUDE.md` — Project architectural guidance
- `prisma/schema.prisma` — Schema implementation evidence for P-7, P-8, P-9
- `src/app.module.ts` — Guard pipeline evidence for P-3
- `src/core/config/env.validation.ts` — Evidence for P-6
- `src/core/audit/audit.service.ts` — Evidence for P-4
- Sprint 10.5 Acceptance Review — "GO WITH CONDITIONS" verdict and remediation criteria
