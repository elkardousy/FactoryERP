# ADR-024 — Future Scalability

## Title

Scalability Provisions Built into the Business Foundation

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

The FactoryERP is built for a manufacturing company that expects to grow. Architectural decisions made in the Business Foundation phase must not create barriers to future scaling:

1. **Data volume**: Audit events and inventory transactions will generate millions of rows per year
2. **User concurrency**: Future deployments may run multiple application instances
3. **Domain expansion**: New ERP modules (production planning, logistics, HR, finance) must plug in without restructuring the core
4. **API evolution**: The frontend and potential third-party integrations require stable, versioned APIs

Several decisions in the Business Foundation phase were made specifically with future scalability in mind, even though the current deployment is single-instance and low-volume.

---

## Decision

The following architectural provisions support future scaling, documented here to explain non-obvious choices:

### Provision S-1: BigInt Primary Keys

All primary keys are `BigInt @id @default(autoincrement())`. This supports:
- Tables that will exceed 2^31 rows (audit events, inventory transactions, physical bag tracking)
- No future migration of ID columns from int4 to int8
- Consistent cross-table join types (no BigInt + Int mismatches)

### Provision S-2: Composite Primary Keys on Time-Series Tables

High-volume time-series tables use composite keys:

```prisma
model audit_events {
  event_id    BigInt   @id @default(autoincrement())
  occurred_at DateTime @default(now()) @db.Timestamptz(6)
  @@id([event_id, occurred_at])  // Composite for partitioning
}

model inventory_transactions {
  txn_id      BigInt   @id @default(autoincrement())
  executed_at DateTime @db.Timestamptz(6)
  @@id([txn_id, executed_at])  // Composite for partitioning
}
```

The `[id, timestamp]` composite key pattern enables **PostgreSQL declarative partitioning** by time range. When these tables reach hundreds of millions of rows, they can be partitioned by month without changing the application schema.

### Provision S-3: PostgreSQL Schema Isolation (`factory` Schema)

All tables are in the `factory` schema. This enables:
- **Multi-tenancy**: Future multi-tenant deployment can add a `factory_tenant2` schema with identical structure
- **Schema migration independence**: The `factory` schema can be backed up, migrated, and restored independently
- **Database sharing**: A second application (e.g., analytics) can share the same PostgreSQL instance with different schemas

### Provision S-4: Interface-Based Permission Cache

The `IPermissionCache` interface allows swapping from `MemoryPermissionCache` (single-instance) to `RedisPermissionCache` (multi-instance) with one provider change. See ADR-014.

### Provision S-5: URI Versioning for API Evolution

All routes are versioned (`/v1/`). Future breaking changes introduce new version (`/v2/`) without removing the old one. API consumers can migrate at their own pace.

### Provision S-6: Fire-and-Forget Audit with JSONB

The audit architecture (ADR-016) supports future volume increases:
- Fire-and-forget ensures audit writing never blocks business operations
- JSONB payloads accommodate new event types without schema migration
- Composite keys enable table partitioning when audit volume justifies it

### Provision S-7: Template-Based Document Numbering

Document number sequences are configurable without code changes. Adding a new document type (future: production orders, purchase orders) requires only inserting a row in `number_sequences` — no code deployment.

### Provision S-8: Module-Based Domain Separation

The ERP is organized into feature modules that are independently testable. Adding a new domain (production planning, HR, finance) requires:
- A new module directory
- Registration in `AppModule`
- No changes to existing modules

This is the monolith-first architecture that supports future microservice extraction if needed.

### Provision S-9: Decimal Precision for Quantities

Production quantities use `Decimal(12,3)`. This provides:
- Exact arithmetic for dozen/piece counts (no floating-point errors)
- Sufficient range (12 digits total, 3 decimal places) for all anticipated manufacturing volumes
- No future migration to higher-precision types for current use cases

### Provision S-10: Request Correlation IDs

`CorrelationIdMiddleware` assigns a unique ID to every request. When the architecture evolves to distributed services, these IDs can be propagated across service boundaries for distributed tracing.

---

## Rationale

**Why provision for scalability before it is needed?**

Some scalability provisions are cheap to add early and expensive to add later:
- BigInt PKs: Migration from int4 to int8 on a table with 100M rows is a painful, downtime-requiring operation. Choosing BigInt now costs nothing.
- Composite primary keys: Adding `occurred_at` to a primary key on an existing table requires rebuilding indexes. Defining it correctly on day one costs nothing.
- API versioning: Adding `/v1/` to URL paths from the start maintains client compatibility. Retrofitting versioning on an existing API is a breaking change.

Other provisions (Redis cache, partitioned tables) are not implemented yet but the design accommodates them:
- Interface-based cache: Costs one token and one provider declaration now; saves a complete refactor when Redis is needed.
- Composite keys for partitioning: No runtime cost; just additional index definition.

**Why not build everything now?**

Many scalability solutions are expensive in complexity, operational overhead, and development time when not yet needed:
- Distributed tracing: Only needed when there are multiple services to trace across
- Redis caching: Only needed when single-instance memory cache is insufficient
- Table partitioning: Only needed when table scans become slow

The current provisions are those that cost nothing to add now and are expensive to add later.

---

## Consequences

**Positive:**
- No future "scalability migration" projects for the listed provisions
- New ERP modules can be added without restructuring existing modules
- The API can evolve without breaking existing clients
- Infrastructure can be upgraded (cache, partitioning) without application code changes

**Negative:**
- BigInt IDs require JSON serialization handling (ADR-021)
- Composite keys on time-series tables add index size
- URI versioning adds 3 characters (`/v1`) to every URL

**Trade-offs:**
- These provisions add minor complexity now to avoid significant complexity later. The trade-offs are heavily weighted toward future benefit.

**Future Implications:**
- Each provision has a specific activation path documented in its relevant ADR
- Provisions S-4, S-6 (cache, audit partitioning) can be activated without application code changes
- Provisions S-1, S-2, S-3, S-9 are already implemented and cannot be deactivated

---

## Related Components

- `prisma/schema.prisma` — Provisions S-1, S-2, S-3, S-9
- `src/modules/authorization/cache/` — Provision S-4
- `src/main.ts` — Provision S-5
- `src/core/audit/` — Provision S-6
- `src/core/document-numbering/` — Provision S-7
- `src/app.module.ts` — Provision S-8
- `src/core/middleware/correlation-id.middleware.ts` — Provision S-10

---

## Alternatives Considered

### Microservices from Day One

Rejected. The ERP is a single monolith with strong transactional requirements. Premature microservice decomposition would introduce distributed transaction complexity (2PC or saga pattern) that is not justified by current scale.

### int4 Primary Keys with Migration Path

Rejected. The migration path from int4 to int8 is too disruptive. BigInt from day one eliminates this concern permanently.

### Synchronous Audit Logging

Rejected. See ADR-016. Synchronous audit creates a coupling that becomes a scalability blocker under load.

---

## Future Evolution

- **Horizontal scaling activation**: Replace `MemoryPermissionCache` with Redis; deploy multiple application instances
- **Audit table partitioning**: `CREATE TABLE audit_events PARTITION BY RANGE (occurred_at)` when audit volume justifies it
- **API V2**: When breaking API changes are required, add `/v2/` controllers alongside existing `/v1/` controllers
- **Microservice extraction**: When a specific domain (e.g., inventory) has performance requirements beyond what the monolith can provide, it can be extracted as a separate service consuming the same PostgreSQL schema

---

## References

- `prisma/schema.prisma`
- ADR-000 (Architecture Principles) — P-7, P-8, P-9
- ADR-004 (Prisma Integration) — schema design decisions
- ADR-014 (Permission Cache) — interface-based cache
- ADR-016 (Audit Architecture) — composite key rationale
- ADR-017 (Document Numbering) — extensible sequence design
