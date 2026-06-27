# Concurrency Strategy

**Status:** Architecture Design — Phase 3 Sprint 0
**Date:** 2026-06-27
**Authority:** Chief ERP Architect / Database Architect
**Version:** 1.0.0

---

## Overview

The Inventory Engine operates in a concurrent warehouse environment where multiple operators scan bags, record transactions, and update stock simultaneously. Without explicit concurrency controls, two operators could simultaneously reserve the same bag, or two processes could simultaneously reduce stock below zero. This document defines the mandatory concurrency strategy.

---

## Concurrency Controls in the Schema

The schema already provides three layers of concurrency control:

| Table | Control | Column | Type |
|-------|---------|--------|------|
| `inventory_bags` | Optimistic locking | `version` | `BigInt @default(0)` |
| `wip_inventory` | Optimistic locking | `version` | `BigInt @default(0)` |
| `quality_output_boxes` | Optimistic locking | `version` | `BigInt @default(0)` |
| `customer_manufacturing_order_lines` | Optimistic locking | `version` | `BigInt @default(0)` |
| `physical_bags` | Pessimistic locking | `FOR UPDATE` | Row-level |
| `physical_bag_reservations` | Unique constraint | `[bag_id, order_id]` | Constraint |

---

## Strategy 1 — Optimistic Locking (Primary Strategy)

**Used for:** `inventory_bags`, `wip_inventory`, `quality_output_boxes`

**When to use:** Quantity records that are frequently read but written in short bursts (multiple writes to the same stock record are uncommon within a 100ms window).

**Pattern:**

```typescript
// Step 1: Read current state with version
const record = await repo.findByKey(warehouseId, modelId, partId);
// record = { bag_id: 1n, dozens_on_hand: 100.000, version: 42n }

// Step 2: Compute new value
const newQty = record.dozens_on_hand - delta;
if (newQty < 0) throw new UnprocessableEntityException('Insufficient stock');

// Step 3: Update WITH version check (inside transaction)
const result = await tx.inventory_bags.updateMany({
  where: {
    bag_id: record.bag_id,
    version: record.version,           // Optimistic lock assertion
    dozens_on_hand: { gte: delta },    // Non-negative guard
  },
  data: {
    dozens_on_hand: newQty,
    version: record.version + 1n,
    last_updated: new Date(),
  },
});

// Step 4: Check if update landed
if (result.count === 0) {
  // Concurrent modification detected
  throw new ConflictException('OPTIMISTIC_LOCK_FAILURE');
}
```

**Retry policy:**
- On `OPTIMISTIC_LOCK_FAILURE`: re-read the record and retry the entire transaction
- Maximum 3 retries with exponential backoff: 50ms, 100ms, 200ms
- After 3 failures: throw `ConflictException('Stock record is under heavy contention. Please retry.')` to the caller
- Do NOT retry indefinitely — surface the error after 3 attempts

```typescript
async function withOptimisticRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (e.message === 'OPTIMISTIC_LOCK_FAILURE' && attempt < maxRetries) {
        await sleep(50 * attempt);
        continue;
      }
      throw e;
    }
  }
}
```

---

## Strategy 2 — Pessimistic Locking (SELECT FOR UPDATE)

**Used for:** `physical_bags` status transitions

**When to use:** When a single row must be locked exclusively for the duration of a short transaction to prevent another session from reading stale state and making the same status change.

**When NOT to use:** For high-read, low-write aggregates like `inventory_bags` — use optimistic locking instead to avoid lock contention.

**Pattern:**
```typescript
// Use $queryRaw for SELECT FOR UPDATE (Prisma does not support FOR UPDATE natively)
const [bag] = await tx.$queryRaw<physical_bags[]>`
  SELECT * FROM factory.physical_bags
  WHERE bag_id = ${bagId}
  FOR UPDATE
`;

if (bag.status !== BagStatusEnum.AVAILABLE) {
  throw new ConflictException(`Bag ${bag.bag_code} is not available (current status: ${bag.status})`);
}
// ... proceed with status update
```

**Lock ordering rule:** When multiple physical bags must be locked in the same transaction (e.g., batch reservation), always acquire locks in ascending `bag_id` order. This prevents deadlocks when two concurrent transactions try to lock the same bags in different orders.

```typescript
// Sort bag IDs ascending before acquiring locks
const sortedBagIds = bagIds.sort((a, b) => (a < b ? -1 : 1));
for (const bagId of sortedBagIds) {
  await tx.$queryRaw`SELECT 1 FROM factory.physical_bags WHERE bag_id = ${bagId} FOR UPDATE`;
}
```

---

## Strategy 3 — Unique Constraint Prevention

**Used for:** Duplicate reservation prevention, duplicate bag barcode prevention

**When to use:** For "exactly once" insertion scenarios where two concurrent requests might try to insert the same logical record.

**Scenarios:**
1. `physical_bag_reservations`: unique constraint `[bag_id, order_id]` — prevents double-reservation of same bag for same order
2. `physical_bags.bag_code`: globally unique — prevents two bags with the same barcode
3. `inventory_bags`: unique `[warehouse_id, model_id, part_id]` — prevents duplicate stock records

**Application handling:**
- Catch Prisma `P2002` (unique constraint violation)
- Re-throw as `ConflictException` with a descriptive message
- Do NOT retry on P2002 — it indicates a logical conflict, not a timing issue

---

## Concurrency Scenario Analysis

### Scenario 1: Double Reservation of the Same Bag

```
Thread A: SELECT physical_bags WHERE bag_id=1 → status=AVAILABLE ✓
Thread B: SELECT physical_bags WHERE bag_id=1 → status=AVAILABLE ✓
Thread A: BEGIN; SELECT ... FOR UPDATE bag_id=1 → gets lock ✓
Thread B: BEGIN; SELECT ... FOR UPDATE bag_id=1 → BLOCKED (waits)
Thread A: UPDATE physical_bags SET status=RESERVED; INSERT reservation; COMMIT
Thread B: (unblocks) → re-reads bag → status=RESERVED → ConflictException 409
```

**Result:** Only Thread A succeeds. Thread B receives a 409. ✅

---

### Scenario 2: Concurrent Stock Decrement (Race Condition)

```
Thread A: Read inventory_bags → dozens_on_hand=100, version=5
Thread B: Read inventory_bags → dozens_on_hand=100, version=5
Thread A: BEGIN; UPDATE ... WHERE version=5 SET version=6, qty=90; → 1 row affected ✓ COMMIT
Thread B: BEGIN; UPDATE ... WHERE version=5 SET version=6, qty=80; → 0 rows affected (version now 6)
         → OPTIMISTIC_LOCK_FAILURE → retry
Thread B: (retry) Read → dozens_on_hand=90, version=6 → update to 80 → version=7 ✓ COMMIT
```

**Result:** Both operations succeed sequentially. No lost updates. ✅

---

### Scenario 3: Stock Goes Negative

```
Thread A: Read → dozens_on_hand=5, version=3
Thread A: Request 5 dozens → new_qty = 0
Thread B: Read → dozens_on_hand=5, version=3
Thread B: Request 5 dozens → new_qty = 0
Thread A: UPDATE WHERE version=3 AND dozens_on_hand >= 5 → succeeds, version=4, qty=0
Thread B: UPDATE WHERE version=3 AND dozens_on_hand >= 5 → 0 rows (version changed)
         → retry → read → qty=0, version=4
Thread B: Request 5 dozens → 0 < 5 → UnprocessableEntityException 422
```

**Result:** Stock cannot go below zero. ✅

---

### Scenario 4: Deadlock Prevention (Multi-Bag Reservation)

```
Thread A wants to lock bags [1, 3] → locks in order: 1, then 3
Thread B wants to lock bags [3, 1] → locks in order: 1 (ascending), then 3

Both threads lock bag 1 first (one succeeds, one waits).
No deadlock because both use the same ordering.
```

**Result:** No deadlock. ✅ Only guaranteed if all code paths sort by bag_id ascending before acquiring FOR UPDATE locks.

---

### Scenario 5: Supplementary Release Contention (Deadlock Risk — IDENTIFIED)

**Pattern:** Multiple supplementary releases updating `wip_inventory` for the same order simultaneously.

**Risk:** If Thread A holds wip_inventory lock for (order=1, part=A) and waits for inventory_bags lock, while Thread B holds inventory_bags lock and waits for wip_inventory lock → **deadlock**.

**Mitigation:** Establish a canonical lock acquisition order:
1. Always acquire `inventory_bags` lock FIRST
2. Then acquire `wip_inventory` lock SECOND

This ordering must be enforced in `executeInTransaction` wrappers for T3, T6, T8.

---

## Transaction Isolation Level

PostgreSQL default: **READ COMMITTED**

This is correct for the Inventory Engine because:
- `SELECT FOR UPDATE` provides row-level locking within a transaction
- Optimistic locking provides conflict detection without holding locks between read and write
- READ COMMITTED prevents dirty reads without the overhead of SERIALIZABLE

Do NOT use SERIALIZABLE isolation — it creates serialization anomalies under concurrent load that are not needed with the explicit locking strategy above.

---

## Retry Logic Implementation

Retry logic must be implemented at the **Use Case layer**, not in repositories or controllers.

```typescript
// Example: ReceivePhysicalBagUseCase
async execute(dto: ReceivePhysicalBagDto, actorId: bigint): Promise<PhysicalBag> {
  return withOptimisticRetry(async () => {
    return this.executeInTransaction(async (tx) => {
      const invBag = await this.inventoryBagsRepository.findByKeyOrCreate(tx, dto);
      // ... all T1 steps
    });
  });
}
```

---

## Concurrency Requirements NOT Addressed by Current Schema

| Gap | Description | Severity | Mitigation |
|-----|-------------|----------|-----------|
| C-1 | `physical_bag_reservations.status` is a free string — no DB-level constraint | High | Add `ReservationStatusEnum` (Required Change R2) |
| C-2 | No index on `physical_bag_reservations.bag_id + status` | High | Unique scan in reservation conflict check is unbounded (Required Change R3) |
| C-3 | `physical_bags.updated_at` missing `@updatedAt` — stale timestamps possible | Medium | Apply TD-2 (Required Change R4) |
| C-4 | No advisory locks for multi-bag batch operations | Low | Sort-based lock ordering (described above) is sufficient for current scale |
| C-5 | No connection pool monitoring | Low | Add pool monitoring in Sprint 20 (Production Readiness) |
