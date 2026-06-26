# ADR-017 — Document Numbering

## Title

Template-Based Document Numbering with Atomic Sequence Increments

---

## Status

Accepted

---

## Date

2026-06-26

---

## Context

Manufacturing ERPs generate human-readable document numbers for:
- Production orders: `ORD-2026-06-000042`
- Customer Manufacturing Orders (CMOs): `CMO-2026-000015`
- Packaging lists: `PKG-2026-06-001`
- Receiving documents: `RCV-2026-001`

Requirements:

1. **Uniqueness**: No two documents of the same type can have the same number
2. **Human-readable format**: Numbers must be predictable and follow business conventions (year, month, sequence)
3. **Configurable per document type**: Different document types have different numbering templates
4. **Reset on period change**: Some counters reset monthly; others reset annually
5. **Concurrent safety**: Under concurrent load, no two requests can receive the same number
6. **No gap guarantee**: The current phase does NOT require gapless sequences (gaps from failed transactions are acceptable)

---

## Decision

A **template-based document numbering service** backed by an atomic database counter.

### Template System

Document number templates are stored in the `number_sequences` table:

```
Pattern:     ORD-{YYYY}-{MM}-{SEQ:6}
Result:      ORD-2026-06-000042
```

Supported template tokens:
- `{YYYY}` — 4-digit year
- `{YY}` — 2-digit year
- `{MM}` — 2-digit month
- `{DD}` — 2-digit day
- `{SEQ:N}` — Zero-padded sequence number with N digits

### DocumentNumberingService

```typescript
@Injectable()
export class DocumentNumberingService {
  constructor(private readonly repo: DocumentNumberingRepository) {}

  async generateNumber(sequenceCode: string): Promise<string> {
    const sequence = await this.repo.getAndIncrement(sequenceCode);
    if (!sequence) throw new NotFoundException(`Sequence '${sequenceCode}' not found.`);

    return this.buildNumber(sequence.pattern_template, sequence.current_value);
  }

  private buildNumber(template: string, seq: bigint): string {
    const now = new Date();
    return template
      .replace('{YYYY}', now.getFullYear().toString())
      .replace('{YY}', now.getFullYear().toString().slice(-2))
      .replace('{MM}', String(now.getMonth() + 1).padStart(2, '0'))
      .replace('{DD}', String(now.getDate()).padStart(2, '0'))
      .replace(/\{SEQ:(\d+)\}/, (_, digits) =>
        seq.toString().padStart(Number(digits), '0'),
      );
  }
}
```

### Atomic Increment in Repository

```typescript
async getAndIncrement(code: string) {
  return this.db.number_sequences.update({
    where: { sequence_code: code },
    data: { current_value: { increment: 1 } },
  });
}
```

Prisma's `{ increment: 1 }` translates to `UPDATE ... SET current_value = current_value + 1` — an atomic database operation. The `UPDATE` returns the new value after increment. Under concurrent load, PostgreSQL row-level locking ensures each increment is unique.

### Sequence Configuration

Each sequence is configured in the `number_sequences` table:

| sequence_code | pattern_template | reset_frequency | current_value |
|---------------|-----------------|-----------------|---------------|
| `PROD_ORDER` | `ORD-{YYYY}-{MM}-{SEQ:6}` | MONTHLY | 0 |
| `CMO` | `CMO-{YYYY}-{SEQ:5}` | YEARLY | 0 |
| `PACKAGING_LIST` | `PKG-{YYYY}-{MM}-{SEQ:4}` | MONTHLY | 0 |

### Global Module

`DocumentNumberingModule` is `@Global()`, making `DocumentNumberingService` available to all modules without explicit import.

---

## Rationale

**Why a database-backed counter instead of a UUID or application-generated sequential ID?**

Human-readable document numbers are a business requirement. ERP users communicate by quoting order numbers ("I need to check order ORD-2026-06-000042"). UUIDs (`550e8400-e29b-41d4-a716-446655440000`) are unacceptable for this purpose. Application-generated sequential IDs require a shared counter across application instances, which is provided by the database.

**Why Prisma's `{ increment: 1 }` instead of a SELECT then UPDATE?**

A `SELECT current_value; UPDATE current_value = current_value + 1` two-step operation has a race condition: two concurrent requests could SELECT the same value. Prisma's `{ increment: 1 }` generates a single `UPDATE ... RETURNING` statement that is atomic under PostgreSQL's row-level locking. No separate transaction is needed.

**Why `NotFoundException` when sequence code is not found?**

An unknown sequence code is a configuration error — a developer passed a code that is not in the database. Throwing `NotFoundException` ensures the error surfaces clearly rather than silently generating malformed document numbers.

**Why template strings instead of a programmatic API?**

Template strings (`{YYYY}-{MM}-{SEQ:6}`) are configurable without code changes. An ERP administrator can change a numbering scheme without deploying new code. This is a critical requirement for manufacturing ERPs where document format changes happen as business requirements evolve.

**Why `{SEQ:N}` padding instead of a fixed-width padding?**

Different document types need different sequence widths. Production orders may reach 999,999 sequences per month (6-digit padding). Supplier packing lists may only need 4 digits. The `N` parameter in `{SEQ:N}` gives each sequence type its own appropriate padding.

**Why is the service global?**

Document numbering is needed by all future production and logistics modules. Making it global avoids importing `DocumentNumberingModule` into every feature module.

---

## Consequences

**Positive:**
- Concurrent-safe: atomic database increment prevents duplicate numbers
- Configurable templates: numbering schemes can be changed in the database without code deployment
- Human-readable numbers: ERP users can reference documents by number in conversation
- Global availability: all modules can generate document numbers without additional imports

**Negative:**
- Sequences have gaps: if a transaction that generates a document number fails after the increment, the number is "used" without a corresponding document (gap in the sequence)
- Reset logic is database-managed: the `reset_frequency` column drives periodic reset, which requires a scheduled job or trigger — not yet implemented
- Database dependency: document number generation requires a healthy database connection; it cannot be done in-memory

**Trade-offs:**
- Gapless sequences vs. atomic simplicity: Gapless sequences require advisory locks and compensating logic. For most ERP use cases, gaps in document numbers are legally acceptable (tax authorities accept non-sequential numbers with appropriate explanation). The current design prioritizes simplicity.

**Future Implications:**
- **Sequence reset**: A scheduled job or database trigger can reset `current_value` to 0 on the appropriate period boundary (monthly or annually)
- **Multi-tenant numbering**: Adding a `tenant_id` dimension to `number_sequences` enables per-tenant document numbering without structural changes
- **Gapless sequences**: If legal requirements mandate gapless sequences, a distributed lock mechanism (Redis advisory lock, PostgreSQL advisory lock) can be added around the increment-and-return operation

---

## Related Components

- `src/core/document-numbering/document-numbering.service.ts`
- `src/core/document-numbering/document-numbering.repository.ts`
- `src/core/document-numbering/document-numbering.module.ts`
- `prisma/schema.prisma` — `number_sequences` table
- All future use-cases that generate production orders, CMOs, packaging lists

---

## Alternatives Considered

### UUID-Based Document Numbers

Rejected. UUIDs are not human-readable. ERP users cannot reference documents by UUID in verbal or written communication.

### Application-Generated Sequential IDs

Rejected. Application-generated sequences require either:
1. A shared in-memory counter (fails under horizontal scaling)
2. A distributed lock (adds complexity)

Database atomic increment is simpler and naturally distributed.

### Redis Atomic Counters

Considered. Redis `INCR` is an atomic operation suitable for sequence generation. Rejected because:
- Adds Redis as a required infrastructure dependency
- Database atomic increment provides the same guarantee without additional infrastructure
- Redis persistence requirements add operational complexity (ensuring the counter survives restarts)

### Custom PostgreSQL Sequences

PostgreSQL native sequences (`CREATE SEQUENCE`) provide atomic increments. Not used because:
- Prisma does not provide first-class management of custom sequences
- Template substitution still requires application code
- Managing one Prisma-controlled `number_sequences` table is simpler than multiple database objects

---

## Future Evolution

- **Automated sequence reset**: A PostgreSQL function or scheduled application job can reset `current_value` at period boundaries
- **Sequence preview**: A `previewNumber(code)` endpoint (without incrementing) for display before confirmation
- **Per-facility numbering**: Adding `facility_id` to sequence codes (e.g., `PROD_ORDER_FACILITY_1`) enables facility-specific numbering for multi-site deployments

---

## References

- `src/core/document-numbering/document-numbering.service.ts`
- `src/core/document-numbering/document-numbering.repository.ts`
- `prisma/schema.prisma` — `number_sequences` table
- ADR-004 (Prisma Integration) — Prisma atomic operations
