# ADR-026 — Inventory Architecture

**Date:** 2026-06-27
**Status:** Accepted
**Deciders:** Chief ERP Architect, Principal Software Engineer, Database Architect
**Context:** Phase 3 Sprint 0 — Inventory Architecture Readiness Review

---

## Context

The Inventory Engine is the first transactional domain of the ERP. It manages physical material from supplier receipt through production consumption. Unlike master data modules, inventory involves concurrent mutations to shared quantity records, requires atomic multi-table writes, and has a complex entity lifecycle. This ADR documents the key architectural decisions that govern the Inventory Engine and all future transactional modules.

---

## Decision 1 — Physical Bag vs. Inventory Bag Separation

**Decision:** Two distinct concepts are maintained: `physical_bags` (barcoded physical units) and `inventory_bags` (aggregate stock ledger records). These are never conflated.

**Rationale:**
- A physical bag is a traceable unit (barcode, movement history, content breakdown by color/size)
- An inventory bag is a running total at a location (`warehouse_id + model_id + part_id`)
- Multiple physical bags contribute to one inventory bag's `dozens_on_hand`
- This separation allows precise bag-level traceability AND efficient aggregate stock queries

**Consequences:**
- Every physical bag operation must update the corresponding inventory bag aggregate
- Both operations must be in the same database transaction (T1, T2, T3, etc.)
- Queries for "available stock" read `inventory_bags`; queries for "where is bag X" read `physical_bags`

---

## Decision 2 — Optimistic Locking for Stock Aggregates

**Decision:** `inventory_bags`, `wip_inventory`, and `quality_output_boxes` use optimistic locking via a `version BigInt` column. Updates include `WHERE version = $expected_version` and increment version on success.

**Rationale:**
- These are aggregate records updated infrequently relative to reads
- Pessimistic locking (SELECT FOR UPDATE) on aggregate records would create lock contention under concurrent receiving
- Optimistic locking allows concurrent reads with conflict detection only at write time
- The `version BigInt` column is already in the schema for all three tables

**Pattern:**
```typescript
// Inside executeInTransaction():
const result = await tx.inventory_bags.updateMany({
  where: { bag_id: id, version: expectedVersion, dozens_on_hand: { gte: delta } },
  data: { dozens_on_hand: { decrement: delta }, version: { increment: 1n } },
});
if (result.count === 0) throw new Error('OPTIMISTIC_LOCK_FAILURE');
```

**Retry policy:** Maximum 3 retries with exponential backoff (50ms, 100ms, 200ms). After 3 failures: `ConflictException`.

---

## Decision 3 — Pessimistic Locking for Physical Bag Status Changes

**Decision:** Physical bag status transitions use `SELECT ... FOR UPDATE` within the transaction.

**Rationale:**
- A bag's status can only transition in one direction at a time
- Two concurrent reservation requests for the same bag must serialize — only one succeeds
- The bag is a single row; FOR UPDATE lock is held for milliseconds (short transaction)
- This is simpler and safer than optimistic locking for a single-row state machine

**Pattern:**
```typescript
const [bag] = await tx.$queryRaw`
  SELECT * FROM factory.physical_bags WHERE bag_id = ${bagId} FOR UPDATE
`;
if (bag.status !== BagStatusEnum.AVAILABLE) throw new ConflictException('Bag not available');
```

**Lock ordering:** When multiple bags must be locked, always acquire in ascending `bag_id` order to prevent deadlocks.

---

## Decision 4 — Every Quantity Change Produces an Inventory Transaction Record

**Decision:** Every change to `inventory_bags.dozens_on_hand`, `wip_inventory.dozens_in_wip`, or `quality_output_boxes.dozens_available` must be accompanied by an `inventory_transactions` insert in the same database transaction.

**Rationale:**
- The `inventory_transactions` table is the authoritative ledger — it is the source of truth for "why did stock change"
- This enables full audit trail, discrepancy investigation, and future reporting
- Separating quantity change from transaction record creates an unrecoverable consistency gap

**Enforcement:** Only `RecordInventoryTransactionUseCase` writes to `inventory_transactions`. It is always called from within an `executeInTransaction()` block.

**Non-negotiable invariant:** If the transaction record cannot be written, the quantity change must also roll back.

---

## Decision 5 — Composite PK on `inventory_transactions` for Future Partitioning

**Decision:** `inventory_transactions` uses composite PK `[txn_id, executed_at]`.

**Rationale:**
- PostgreSQL range partitioning by timestamp requires the partition key in the PK
- `inventory_transactions` will grow to millions of rows; monthly partitioning is the long-term strategy
- The composite key is already in the schema — partitioning can be added without schema changes
- All queries must include `executed_at` in the WHERE clause (date range filter is mandatory)

**Consequence:** `ListInventoryTransactionsUseCase` must require `from` and `to` date parameters. Unbounded queries on this table are prohibited.

---

## Decision 6 — Non-Negative Stock Invariant Enforcement

**Decision:** Non-negativity of `dozens_on_hand` and `dozens_in_wip` is enforced at two levels:
1. Application-level pre-check before transaction starts
2. Database-level guard in the UPDATE WHERE clause: `AND dozens_on_hand >= $delta`

**Rationale:**
- Application-level check provides fast feedback to the caller
- Database-level guard is the final safety net against race conditions between the read and the write
- A `CHECK (dozens_on_hand >= 0)` PostgreSQL constraint is recommended as a third layer but requires a schema migration (deferred to Sprint 11)

---

## Decision 7 — `ReservationStatusEnum` Required

**Decision:** `physical_bag_reservations.status` must be migrated from `String @db.VarChar(20)` to a proper `ReservationStatusEnum` before Sprint 11 begins.

**Rationale:**
- Free-string status fields cannot be type-checked at compile time
- Invalid status transitions become silent data bugs
- The consistent pattern in this project is to use enums for all status fields (see `BagStatusEnum`, `OrderStatusEnum`, etc.)

**Required enum values:**
```prisma
enum ReservationStatusEnum {
  ACTIVE
  RELEASED    // consumed by production
  CANCELLED   // reservation cancelled before production
  @@map("reservation_status_enum")
  @@schema("factory")
}
```

---

## Decision 8 — `LocationTypeEnum` Required for Inventory Transactions

**Decision:** `inventory_transactions.from_location_type` and `to_location_type` should be typed as `LocationTypeEnum` rather than free strings.

**Rationale:**
- Location type is a fixed set of concepts: WAREHOUSE, PRODUCTION_ORDER, SUPPLIER, CUSTOMER
- Free strings allow invalid values like "warehouse" vs "WAREHOUSE" (case sensitivity bugs)
- Type safety at the ORM layer prevents silent data inconsistencies

**Required enum:**
```prisma
enum LocationTypeEnum {
  WAREHOUSE
  PRODUCTION_ORDER
  SUPPLIER
  CUSTOMER
  @@map("location_type_enum")
  @@schema("factory")
}
```

**Implementation:** This change is deferred to Sprint 11 (first commit) alongside the initial schema migration. It does not block Gate G-1 but must be done before InventoryTransactionsRepository is implemented.

---

## Alternatives Considered

### Alternative to optimistic locking: Database CHECK constraints
- Considered adding `CHECK (dozens_on_hand >= 0)` as sole protection
- Rejected: CHECK constraints cannot prevent race conditions; they provide no retry mechanism and no meaningful error message to the caller

### Alternative to pessimistic locking on physical bags: Unique constraint only
- Considered relying solely on `UNIQUE [bag_id, order_id]` on reservations
- Rejected: Unique constraint prevents duplicate reservations but does not prevent two concurrent reservation attempts from both reading status=AVAILABLE before either updates it

### Alternative to composite PK on inventory_transactions: `@updatedAt` only
- Considered a simple auto-increment PK
- Rejected: PostgreSQL declarative partitioning requires the partition key in the PK; changing this later requires a full table rebuild

---

## Consequences

1. The Inventory Engine requires 4 repositories, 9 use cases, 3 controllers as specified in `SPRINT11_CONTRACT.md`
2. All Sprint 11 implementation must follow the transaction boundaries in `TRANSACTION_BOUNDARIES.md`
3. All concurrent access patterns must follow `CONCURRENCY_STRATEGY.md`
4. `ReservationStatusEnum` and `LocationTypeEnum` must be added to the schema before Sprint 11 code is written
5. `ListInventoryTransactionsUseCase` must enforce mandatory date range on all calls
6. Future transactional modules (Production, Quality, Shipping) must follow the same transaction boundary and optimistic locking patterns established here
