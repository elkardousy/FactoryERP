# 06 — Prisma Governance

**Document:** FEOS-06  
**Category:** Database  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per Prisma version upgrade or schema change  
**Related FEOS:** FEOS-05 (Database Governance), FEOS-15 (Recovery Playbook)  
**Related KEB:** KEB-05 (Prisma Knowledge), KEB-04 (Database Knowledge)

---

## Purpose

This document governs all use of Prisma in FactoryERP: schema ownership, CLI usage, migration workflow, client generation, query patterns, type handling, and recovery from Prisma-specific failures. It establishes the rules that protect `prisma/schema.prisma` as the source of truth for the data model.

## Scope

`prisma/schema.prisma`, `prisma/migrations/`, `prisma/prisma.config.ts`, Prisma Client generated code, and all application code that uses Prisma.

## Audience

All engineers and AI agents that read, write, or execute any Prisma-related file or command.

---

## Prisma Configuration

### Schema Location

```
prisma/schema.prisma     ← Authoritative schema, 2229 lines at FEOS 1.0
prisma/prisma.config.ts  ← Disables .env loading; requires explicit DATABASE_URL
prisma/migrations/       ← Migration history
```

### prisma.config.ts Behavior

`prisma.config.ts` configures Prisma to **skip `.env` file loading**. This is an intentional project decision. As a consequence, every Prisma CLI command must receive `DATABASE_URL` as an explicit environment variable.

**Correct:**
```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
```

**Incorrect (will fail):**
```bash
npx prisma generate
```

This is not a workaround — it is the required invocation pattern for this project.

### Schema Configuration

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["factory"]
}
```

All models use `@@schema("factory")`. The `multiSchema` preview feature enables Prisma to work with a non-default PostgreSQL schema.

---

## CLI Command Reference

All CLI commands require the `DATABASE_URL` prefix. The commands are:

```bash
# Validate schema syntax
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma validate

# Generate Prisma Client (run after any schema change)
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate

# Check migration status
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate status

# Mark a migration as applied (after manual DDL execution)
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate resolve --applied "<migration-name>"

# Open Prisma Studio (browser-based DB viewer)
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma studio
```

---

## Schema Ownership

`prisma/schema.prisma` is owned by the Chief Software Architect. It is the **authoritative source of truth** for the FactoryERP data model.

### What `prisma/schema.prisma` Defines

- All 98 Prisma models.
- All 32 PostgreSQL enums (mapped to Prisma enums).
- All column types, defaults, and constraints.
- All relations between models.
- All `@@unique`, `@@index`, and `@@id` declarations.
- The `@@schema("factory")` designation for every model.

### What `prisma/schema.prisma` Does NOT Define

- GIN trigram indexes (those are defined in migration SQL, not Prisma).
- PostgreSQL functions and triggers (defined in migration SQL).
- `inet` column type (uses `Unsupported("inet")` placeholder in Prisma).

---

## Critical Schema Protections

### `ReservationStatusEnum`

This enum must remain defined in `prisma/schema.prisma` exactly as:

```prisma
enum ReservationStatusEnum {
  ACTIVE
  RELEASED
  CANCELLED
  @@schema("factory")
}
```

There is **no `EXPIRED` value**. The expire operation maps to `CANCELLED`. If a PR adds an `EXPIRED` value, it must be rejected.

### `@updatedAt` Directives

Prisma `@updatedAt` directives on relevant columns must not be removed. If `prisma db pull` is accidentally run, it will strip these directives, breaking automatic timestamp updates.

### Relation Names

Relations are named with specific Prisma relation names that match TypeScript code. If `prisma db pull` overwrites the schema, relation renames break TypeScript compilation (6+ type errors per CLAUDE.md documentation).

---

## Prohibited Operations

### `prisma db pull` — ABSOLUTELY PROHIBITED

`prisma db pull` overwrites `prisma/schema.prisma` from the live database. The consequences are:

1. `ReservationStatusEnum` and other custom enums become raw strings.
2. `@updatedAt` directives are stripped.
3. Relations are renamed (breaking TypeScript compilation).
4. Custom indexes added via schema directives are removed.
5. The committed schema (source of truth) is destroyed.

**This command requires explicit architect approval before execution.**

If accidentally run, immediate recovery is:

```bash
git checkout HEAD -- prisma/schema.prisma
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
npm run build
```

### `prisma migrate deploy` — PROHIBITED

`prisma migrate deploy` executes pending migrations using the application database user (`elkardousy`). Since `elkardousy` lacks DDL privileges, this command will fail with a PostgreSQL permission error. DDL must always be executed as the `postgres` superuser.

### `prisma migrate dev` — PROHIBITED

`prisma migrate dev` attempts to apply pending migrations and may modify `prisma/schema.prisma` automatically. It is not permitted in the FactoryERP workflow. All migrations use the documented manual workflow.

### `prisma migrate reset` — PROHIBITED WITHOUT APPROVAL

`prisma migrate reset` drops the entire database and re-runs all migrations. This is a destructive operation that destroys all data. It requires explicit architect approval.

---

## Query Patterns

### Standard Single-PK Query

```typescript
// Correct: standard single-PK model
const bag = await this.db.physical_bags.findUnique({
  where: { bag_id: BigInt(id) }
});
```

### Composite-PK Query

```typescript
// Correct: composite PK model (inventory_transactions, audit_events)
const txn = await this.db.inventory_transactions.findFirst({
  where: { txn_id: BigInt(txnId), executed_at: new Date(executedAt) }
});

// WRONG — throws at runtime:
// const txn = await this.db.inventory_transactions.findUnique(...)
```

### Transaction Pattern

```typescript
// Correct: atomic multi-record operation
const result = await this.executeInTransaction(async (tx: unknown) => {
  const prisma = tx as PrismaService;
  const record1 = await prisma.table_a.create({ data: { ... } });
  const record2 = await prisma.table_b.create({ data: { ... } });
  return { record1, record2 };
});
```

The transaction callback parameter must be typed as `(tx: unknown) => Promise<unknown>` in mock implementations (not `cb: any`) to pass ESLint.

### Aggregate Queries

```typescript
// Sum of reserved dozens for a bag
const result = await this.db.physical_bag_reservations.aggregate({
  where: {
    bag_id: bagId,
    status: ReservationStatusEnum.ACTIVE
  },
  _sum: { reserved_dozens: true }
});
const totalReserved = result._sum.reserved_dozens ?? new Prisma.Decimal(0);
```

---

## Type Handling

### BigInt

All primary keys and foreign keys are `BigInt` in Prisma. BigInt does not serialize natively with `JSON.stringify()`. The `ResponseInterceptor` applies `serializeBigInts()` which recursively converts all BigInt values to strings.

Rules:
- Accept IDs as `string` in DTOs.
- Convert to `BigInt` with `BigInt(id)` before Prisma queries.
- Never return raw BigInt from use cases — mappers must convert to string.
- Never use `parseInt()` or `Number()` for BigInt values (precision loss above 2^53).

### Prisma Decimal

Numeric fields with decimal precision (e.g., `dozens`, `smv`) are `Decimal` in Prisma. Prisma's `Decimal` implements `.toJSON()` returning a string. No manual conversion is needed. Do not cast Decimal to `number` — precision is lost.

### Prisma.Decimal in Arithmetic

Use Prisma's `Decimal` arithmetic methods for any computation involving Decimal values:

```typescript
import { Prisma } from '@prisma/client';

const total = new Prisma.Decimal(dozens).add(existingDecimal);
const available = current_dozens.sub(reserved_dozens);
```

---

## BaseRepository

All repositories must extend `BaseRepository`:

```typescript
// src/core/database/repositories/base/base.repository.ts
@Injectable()
export abstract class BaseRepository {
  protected readonly db: PrismaService;  // alias for this.prisma
  
  constructor(protected readonly prisma: PrismaService) {
    this.db = prisma;
  }
  
  protected async executeInTransaction<T>(
    callback: (tx: unknown) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback as any);
  }
}
```

Use `this.db` for all Prisma queries. Use `this.executeInTransaction()` for atomic multi-record operations.

---

## Migration Workflow (Summary)

The complete migration workflow is documented in FEOS-05. Summary:

1. Write SQL to `prisma/migrations/<timestamp>_<name>/migration.sql`.
2. Execute as `postgres` superuser via `psql`.
3. Mark applied: `prisma migrate resolve --applied "<name>"`.
4. Regenerate client: `prisma generate`.
5. Update `prisma/schema.prisma`.
6. Run `npm run build` to verify.

---

## Compliance Rules

### Rule P-001 — DATABASE_URL Prefix

**Classification:** MANDATORY  
**Statement:** All Prisma CLI invocations must include `DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp"` as a prefix. No exceptions.  
**Violation Impact:** CLI command fails to connect.  
**Risk:** Failed migrations, stale Prisma client.  
**Recovery:** Re-run with the correct prefix.  
**Approval Required:** None.

### Rule P-002 — prisma db pull Prohibition

**Classification:** MANDATORY  
**Statement:** `npx prisma db pull` must never be run without explicit architect approval. Its effect is destructive to the committed schema.  
**Violation Impact:** Schema file overwritten, TypeScript compilation broken, enum definitions lost.  
**Risk:** CRITICAL — may require full schema restoration and Prisma client regeneration.  
**Recovery:** `git checkout HEAD -- prisma/schema.prisma && npx prisma generate && npm run build`  
**Approval Required:** Chief Software Architect written approval required before execution.

### Rule P-003 — Schema as Source of Truth

**Classification:** MANDATORY  
**Statement:** `prisma/schema.prisma` is the authoritative data model. Any divergence between the schema file and the live database is a defect that must be resolved via the migration workflow.  
**Violation Impact:** Prisma client generates incorrect types; queries fail at runtime.  
**Risk:** Data model corruption.  
**Recovery:** Identify the divergence, write a migration, execute it as superuser, regenerate client.  
**Approval Required:** Chief Software Architect.

### Rule P-004 — findFirst for Composite PK Tables

**Classification:** MANDATORY  
**Statement:** `inventory_transactions` and `audit_events` must be queried with `findFirst()`. Using `findUnique()` on these tables is a runtime error.  
**Violation Impact:** HTTP 500 on all endpoints querying these tables.  
**Risk:** Data retrieval failure.  
**Recovery:** Replace `findUnique()` with `findFirst()`.  
**Approval Required:** None.

### Rule P-005 — BaseRepository Requirement

**Classification:** MANDATORY  
**Statement:** All repository classes must extend `BaseRepository`. No repository may inject `PrismaService` directly via constructor without extending `BaseRepository`.  
**Violation Impact:** Bypassed transaction management, untestable code.  
**Risk:** Data consistency issues, hard-to-test code.  
**Recovery:** Refactor to extend `BaseRepository`.  
**Approval Required:** None.
