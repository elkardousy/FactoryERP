# 05 — Prisma Knowledge

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Schema Facts

| Property | Value |
|----------|-------|
| Schema file | `prisma/schema.prisma` (2229 lines) |
| Prisma version | `^6.16.2` |
| Preview features | `multiSchema` |
| Database schema | `factory` |
| Migration directory | `prisma/migrations/` |
| Config file | `prisma/prisma.config.ts` |

---

## prisma.config.ts (Critical)

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
});
```

**Impact:** The Prisma CLI does NOT read `.env` automatically when `prisma.config.ts` is present. Every Prisma CLI command MUST be prefixed with:

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma <command>
```

---

## Common Prisma Commands

```bash
# Validate schema (no DB needed)
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma validate

# Generate client
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate

# Check migration status
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate status

# Open Prisma Studio (data browser)
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma studio

# Mark a migration as applied (without running it)
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate resolve --applied "<migration-name>"
```

---

## PrismaService

```typescript
// src/core/database/prisma/prisma.service.ts
// Extends PrismaClient
// Registered via @Global() PrismaModule
// Provides enableShutdownHooks(app) for graceful shutdown
```

Injected via constructor:
```typescript
constructor(private readonly prisma: PrismaService) {}
```

Only repositories may inject `PrismaService` directly.

---

## PrismaModule

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Imported once in `AppModule`. Never import in feature modules.

---

## BaseRepository (Prisma Access Pattern)

```typescript
abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaService) {}
  
  protected get db(): PrismaService {
    return this.prisma;
  }
  
  async executeInTransaction<T>(
    callback: (tx: PrismaService) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback(tx as PrismaService);
    });
  }
}
```

The `tx as PrismaService` cast allows type-safe repository method calls inside transactions. Treat the callback argument as `Prisma.TransactionClient` semantically.

---

## Critical Prisma Query Patterns

### Composite PK Tables

**inventory_transactions** has `@@id([txn_id, executed_at])`:

```typescript
// WRONG — will throw (findUnique requires all PK fields)
await this.db.inventory_transactions.findUnique({ where: { txn_id } });

// CORRECT
await this.db.inventory_transactions.findFirst({ where: { txn_id } });
```

**audit_events** has `@@id([event_id, occurred_at])`:
- Same pattern applies — use `findFirst` when filtering by `event_id` alone.

### BigInt Handling

All PKs are `BigInt`. Prisma returns them as JavaScript `BigInt`.

```typescript
// Converting incoming string from HTTP to BigInt
const id = BigInt(param);  // param from URL is always string

// Converting BigInt to string for response
dto.txn_id = record.txn_id.toString();

// In InventoryTransactionMapper:
dto.txn_id = txn.txn_id.toString();
dto.model_id = txn.model_id.toString();
dto.executed_by = txn.executed_by.toString();
```

### Decimal Handling

Quantities use `Prisma.Decimal` type (mapped from PostgreSQL `Decimal(12,3)`).

```typescript
// Prisma Decimal implements .toJSON() returning string
// It serializes naturally through ResponseInterceptor
dto.dozens_qty = txn.dozens_qty.toString();  // explicit conversion in mapper
```

### Aggregate Queries (for available quantity)

```typescript
// Sum active reserved dozens for a bag
const result = await this.db.physical_bag_reservations.aggregate({
  where: { bag_id, status: ReservationStatusEnum.ACTIVE },
  _sum: { reserved_dozens: true },
});
const totalReserved = result._sum.reserved_dozens ?? new Decimal(0);
```

---

## Schema Conventions

### Naming

- Table names: `snake_case` (e.g., `physical_bag_reservations`)
- All models in `@@schema("factory")`
- Relation names follow pattern: `table__fk_column__referenced_table`
  - Example: `"physical_bags__bag_id__physical_bags"`

### Primary Keys

```prisma
// Simple PK
bag_id BigInt @id @default(autoincrement())

// Composite PK
@@id([txn_id, executed_at])
```

### Timestamps

```prisma
created_at DateTime @db.Timestamptz(6) @default(now())
updated_at DateTime @updatedAt @db.Timestamptz(6) @default(now())
```

`@updatedAt` is a Prisma directive that auto-updates on write.  
**CRITICAL:** `prisma db pull` strips `@updatedAt` — never run it.

### Soft Delete Pattern

Most master data tables use:
```prisma
is_active Boolean @default(true)
```

Soft deletes set `is_active = false`. Hard deletes are used only for junction tables.

---

## ReservationStatusEnum in Prisma

```prisma
enum ReservationStatusEnum {
  ACTIVE
  RELEASED
  CANCELLED
  @@map("reservation_status_enum")
  @@schema("factory")
}
```

**Important:** There is NO `EXPIRED` value. The `/expire` API endpoint maps to `CANCELLED` in the database. This was a deliberate design decision (see Sprint 11.3 context).

---

## Prisma Exception Filter Mapping

From `src/core/exceptions/filters/prisma-exception.filter.ts`:

| Prisma Error | HTTP Status | Description |
|--------------|-------------|-------------|
| `P2002` | 409 Conflict | Unique constraint violation |
| `P2025` | 404 Not Found | Record not found |
| `P2003` | 400 Bad Request | Foreign key constraint |
| `P2014` | 409 Conflict | Relation violation |

---

## What prisma db pull Destroys (PROHIBITED)

Running `prisma db pull` overwrites `schema.prisma` from live database and:

1. **Removes `ReservationStatusEnum`** — becomes raw string
2. **Strips all `@updatedAt` directives** — timestamps won't auto-update
3. **Renames relations** — breaks TypeScript compilation (6+ type errors)
4. **Removes custom indexes** added via PSL directives
5. **Destroys GIN index comments** for trigram indexes

Recovery:
```bash
git checkout HEAD -- prisma/schema.prisma
DATABASE_URL="..." npx prisma generate
npm run build
```

---

## multiSchema Preview Feature

The `previewFeatures = ["multiSchema"]` allows Prisma to:
- Work with multiple PostgreSQL schemas in one `datasource`
- All models are in `@@schema("factory")`
- The `schemas = ["factory"]` in the datasource restricts Prisma to this schema only

**Note:** `multiSchema` is still a preview feature as of Prisma 6. This is tracked as technical debt.

---

## Prisma Client Types (Key)

From `@prisma/client`:

```typescript
import type { inventory_transactions } from '@prisma/client';
import type { physical_bag_reservations } from '@prisma/client';
import type { physical_bags } from '@prisma/client';
import { TxnTypeEnum } from '@prisma/client';
import { ReservationStatusEnum } from '@prisma/client';
import { BagStatusEnum } from '@prisma/client';
```

Enums are imported as values (not `import type`) since they are used at runtime.

---

## Transaction Patterns in Use

### Single Record Create

```typescript
await this.db.inventory_transactions.create({ data });
```

### Two-Record Atomic Create (TRANSFER)

```typescript
await this.executeInTransaction(async (tx) => {
  await this.createInTx(tx, releaseData);
  await this.createInTx(tx, receivingData);
});
```

### Status Update

```typescript
await this.db.physical_bag_reservations.update({
  where: { reservation_id },
  data: { status: ReservationStatusEnum.RELEASED, released_at: new Date() },
});
```

### Paginated List

```typescript
const [items, total] = await Promise.all([
  this.db.inventory_transactions.findMany({
    where,
    orderBy: { executed_at: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  }),
  this.db.inventory_transactions.count({ where }),
]);
```
