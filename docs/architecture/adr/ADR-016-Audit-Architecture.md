# ADR-016 — Audit Architecture

## Title

Fire-and-Forget Audit Event System with PostgreSQL JSONB Payloads

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

An ERP system that manages production orders, inventory movements, and financial transactions has strict audit requirements:

1. **Legal compliance**: Every write to business entities must be attributable to a specific user at a specific time
2. **Operational accountability**: Who created/deactivated/approved a production order must be traceable
3. **Non-blocking**: Audit logging must never prevent a business operation from completing. If the audit database is temporarily unavailable, the business operation succeeds regardless.
4. **Queryable history**: Audit events must be stored in a queryable format — not flat text logs

The challenge is that audit logging, if implemented synchronously with business transactions, creates a failure coupling: an audit write failure would roll back a successful business operation. This is the wrong trade-off.

---

## Decision

A **fire-and-forget audit pattern** using a global `AuditService` that wraps audit writes in try-catch.

### AuditService

```typescript
@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(input: CreateAuditEventInput): Promise<void> {
    try {
      await this.auditRepository.create(input);
    } catch (error) {
      // Intentionally swallowed — audit failures must never propagate
      // Use console.error here since LoggerService injection would create
      // circular dependency risk
    }
  }
}
```

### CreateAuditEventInput

```typescript
interface CreateAuditEventInput {
  eventType: string;         // e.g., 'CUSTOMER_CREATED', 'AUTH_LOGIN'
  entityType: string;        // e.g., 'customers', 'users'
  entityId: string;          // String representation of BigInt PK
  userId: bigint;            // Actor who performed the operation
  payload?: Record<string, unknown>;  // Arbitrary event-specific context
}
```

### Call Pattern

All use-cases call `AuditService.log()` as a **fire-and-forget** operation using the `void` operator:

```typescript
// In CreateCustomerUseCase:
const customer = await this.repo.create(data);

void this.auditService.log({
  eventType: 'CUSTOMER_CREATED',
  entityType: 'customers',
  entityId: String(customer.customer_id),
  userId: actorId,
  payload: { customer_code: customer.customer_code },
});

return customer;
```

The `void` operator explicitly discards the Promise return value. The use-case returns immediately after creating the customer — it does not await the audit log.

### Audit Event Schema

```sql
-- audit_events table (Prisma model)
event_id      BigInt @id @default(autoincrement())
occurred_at   DateTime @default(now()) @db.Timestamptz(6)
event_type    String    -- e.g., 'CUSTOMER_CREATED'
entity_type   String    -- e.g., 'customers'
entity_id     String    -- String PK for cross-type compatibility
user_id       BigInt?   -- Nullable for system-initiated events
payload       Json?     -- JSONB in PostgreSQL
@@id([event_id, occurred_at])  -- Composite for partitioning
```

### JSONB Payloads

The `payload` field is PostgreSQL JSONB. This allows storing arbitrary event-specific context without schema migration for new event types. For example:

```json
{
  "eventType": "CUSTOMER_DEACTIVATED",
  "payload": {
    "customer_id": "42",
    "customer_code": "CUST-001",
    "deactivated_by": "99"
  }
}
```

### Global Module

`AuditModule` is marked `@Global()`, making `AuditService` available to all modules without explicit import.

### Event Type Convention

Event types follow the pattern: `{ENTITY}_{ACTION}`:
- `CUSTOMER_CREATED`, `CUSTOMER_UPDATED`, `CUSTOMER_DEACTIVATED`, `CUSTOMER_REACTIVATED`
- `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_FAILED`
- `WAREHOUSE_CREATED`, `PRODUCTION_LINE_DEACTIVATED`

---

## Rationale

**Why fire-and-forget instead of transactional audit?**

Transactional audit (writing audit events in the same database transaction as the business operation) couples the audit system to business operations. If the audit table is locked, the business transaction blocks. If the audit table runs out of space, business operations fail.

The design principle (ADR-000 P-4) states: "Audit failures are preferable to audit-induced data loss." A missed audit event is recoverable from other logs and is a compliance concern. Lost business data from an audit-caused rollback is not recoverable.

**Why `try-catch` in `AuditService.log()` instead of in use-cases?**

Putting try-catch in every use-case that calls `log()` would create repetitive error handling. Centralizing it in `AuditService` means the fire-and-forget contract is encapsulated in one place. Use-cases do not need to know that `log()` may fail.

**Why the `void` operator at call sites?**

`void auditService.log(...)` explicitly communicates developer intent: "I know this returns a Promise and I am intentionally not awaiting it." Without `void`, ESLint's `@typescript-eslint/no-floating-promises` rule would flag the unawaited Promise. Using `void` suppresses this lint warning correctly — it is not a shortcut around a bug.

**Why `entityId: string` instead of `BigInt`?**

Audit events may originate from multiple entity types with BigInt IDs, integer IDs, or UUID IDs (future). Using `string` for `entityId` makes `AuditRepository` compatible with all current and future entity types without schema changes.

**Why JSONB for `payload`?**

Different event types carry different metadata. A login event carries `device_id` and `device_platform`. A production order approval carries `previous_status` and `approved_quantity`. A single JSONB column accommodates all event types without requiring a separate audit table per entity type.

**Why composite primary key `[event_id, occurred_at]`?**

This composite key enables PostgreSQL table partitioning by `occurred_at` (time-range partitioning). Audit tables in production systems grow rapidly — millions of rows per year. Partitioning by month allows efficient pruning of old audit data without affecting recent event queries.

---

## Consequences

**Positive:**
- Business operations are never blocked or rolled back due to audit failures
- JSONB payloads accommodate new event types without schema migration
- Global `AuditService` is available everywhere without module imports
- Time-partitioned composite key supports future table partitioning

**Negative:**
- Audit events are not guaranteed to be written — a crash between business operation completion and audit write would create a gap
- JSONB payloads are not type-safe — callers can pass arbitrary data without compile-time validation
- There is no built-in mechanism to detect audit gaps (missing events between time windows)

**Trade-offs:**
- Fire-and-forget vs. exactly-once delivery: The current design prioritizes business reliability over audit completeness. For most ERP compliance requirements, this is the correct trade-off. Exact-once audit delivery would require a durable message queue.

**Future Implications:**
- **Durable audit queue**: A message broker (e.g., RabbitMQ, AWS SQS) between the application and the audit writer would provide exactly-once delivery guarantees
- **Audit partitioning**: The composite `[event_id, occurred_at]` key enables PostgreSQL declarative partitioning when audit volume justifies it
- **Audit search**: The JSONB `payload` field can be indexed with PostgreSQL GIN indexes for specific audit query patterns

---

## Related Components

- `src/core/audit/audit.service.ts`
- `src/core/audit/audit.repository.ts`
- `src/core/audit/audit.module.ts`
- `prisma/schema.prisma` — `audit_events` table
- All use-cases that call `void this.auditService.log(...)`

---

## Alternatives Considered

### Synchronous Transactional Audit

Rejected. See rationale above. Couples audit failures to business operation failures.

### Event Bus (NestJS EventEmitter)

Considered. An in-process event bus would decouple use-cases from the audit service. Rejected because:
- Adds infrastructure complexity (event registration, event type definitions)
- Events are still in-process; a crash loses unprocessed events just as fire-and-forget does
- Current directness (use-case calls `auditService.log()`) is simpler and explicit

### External Audit Service / SIEM

Relevant for enterprise deployments. Not adopted for the current phase because:
- Adds external dependency and network calls on every write
- Current on-premise deployment model does not require SIEM integration
- The JSONB payload design is forward-compatible with SIEM ingestion

### Audit Via Database Triggers

PostgreSQL triggers could capture all writes without application-level code. Rejected because:
- Triggers capture raw row data, not semantic event types (e.g., "CUSTOMER_DEACTIVATED" vs. a simple UPDATE)
- Application-level audit captures user context (`userId`) that triggers cannot access
- Trigger failures affect the originating transaction

---

## Future Evolution

- **Durable message queue**: Replace fire-and-forget with a durable message (Outbox Pattern) for guaranteed-delivery audit events
- **Audit dashboard**: A dedicated audit query service can expose the `audit_events` table with search, filter, and export capabilities
- **Compliance reports**: Pre-built audit report templates for common compliance queries (who accessed customer X, all operations by user Y in date range Z)

---

## References

- `src/core/audit/audit.service.ts`
- `src/core/audit/audit.repository.ts`
- `prisma/schema.prisma` — `audit_events` model
- ADR-000 (Architecture Principles) — P-4 (Audit Everything)
- ADR-002 (Clean Architecture) — how use-cases invoke audit
