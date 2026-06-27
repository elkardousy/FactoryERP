# Transaction Boundaries

**Status:** Architecture Design — Phase 3 Sprint 0
**Date:** 2026-06-27
**Authority:** Chief ERP Architect / Database Architect
**Version:** 1.0.0

---

## Governing Rule

Every inventory quantity mutation is **atomic**. All of the following must succeed or all must roll back:
1. The quantity update (on `inventory_bags`, `wip_inventory`, or `quality_output_boxes`)
2. The `inventory_transactions` ledger record
3. The `physical_bags` status change (if applicable)
4. The `physical_bag_movements` log entry

Implementation: all transaction boundaries use `BaseRepository.executeInTransaction<T>()`.

---

## T1 — Receive Physical Bag

**Trigger:** `ReceivePhysicalBagUseCase.execute()`
**Business event:** Goods received from supplier container

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① INSERT physical_bags
       (status = RECEIVED, received_dozens = $qty, current_dozens = $qty)
  ② INSERT physical_bag_contents[] (one row per color × size)
  ③ UPSERT inventory_bags
       SET dozens_on_hand = dozens_on_hand + $qty,
           version = version + 1,
           last_updated = now()
       WHERE warehouse_id = $wh AND model_id = $m AND part_id = $p
         AND version = $expected_version    ← optimistic lock
  ④ INSERT inventory_transactions
       (txn_type = RECEIVING, dozens_qty = $qty, txn_reference = $container_id)
  ⑤ INSERT physical_bag_movements
       (from_status = NULL, to_status = RECEIVED)
COMMIT
```

**Failure modes:**
- `bag_code` duplicate → P2002 → 409 ConflictException before transaction starts
- Optimistic lock failure on step ③ → retry up to 3 times with fresh `inventory_bags` read
- Any step fails → full rollback; `physical_bags` row NOT created

**Post-conditions:**
- `inventory_bags.dozens_on_hand` increased by received_dozens
- `inventory_bags.version` incremented by 1
- Audit event fired (fire-and-forget, OUTSIDE the transaction)

---

## T2 — Create Stock Reservation

**Trigger:** `CreateStockReservationUseCase.execute()`
**Business event:** Production order reserves material bags

**Pre-conditions (validated before transaction):**
- `physical_bags.status` = AVAILABLE
- `physical_bags.current_dozens` ≥ requested_dozens
- No active reservation already exists for this (bag, order) pair

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① SELECT physical_bags FOR UPDATE WHERE bag_id = $id
       ← Pessimistic lock prevents concurrent reservation of same bag
  ② Re-validate: status still AVAILABLE, current_dozens still sufficient
  ③ UPDATE physical_bags
       SET status = RESERVED
  ④ INSERT physical_bag_reservations
       (status = ACTIVE, reserved_dozens = $qty)
  ⑤ INSERT physical_bag_movements
       (from_status = AVAILABLE, to_status = RESERVED)
  ⑥ INSERT inventory_transactions
       (txn_type = RELEASE, txn_reference = $reservation_id,
        note: "Reservation created — stock earmarked")
COMMIT
```

**Failure modes:**
- status ≠ AVAILABLE after FOR UPDATE → 409 ConflictException
- current_dozens < requested → 422 UnprocessableEntityException
- Unique constraint on [bag_id, order_id] → P2002 → 409

**Notes:**
- This does NOT yet decrement `inventory_bags.dozens_on_hand` — only earmarks the physical bag
- `inventory_bags` is decremented at T3 (actual release to WIP)

---

## T3 — Release Reserved Material to Production Line

**Trigger:** `ReleaseToProductionUseCase.execute()` (Sprint 13 — Production)
**Business event:** Reserved physical bags issued to production line

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① SELECT physical_bags FOR UPDATE WHERE bag_id = $id
  ② UPDATE physical_bags
       SET status = RELEASED, current_order_id = $order_id
  ③ UPDATE physical_bag_reservations
       SET status = RELEASED, released_at = now()
       WHERE reservation_id = $res_id AND status = ACTIVE
  ④ UPDATE inventory_bags
       SET dozens_on_hand = dozens_on_hand - $qty,
           version = version + 1
       WHERE warehouse_id = $wh AND model_id = $m AND part_id = $p
         AND version = $expected_version    ← optimistic lock
         AND dozens_on_hand >= $qty         ← non-negative guard
  ⑤ UPSERT wip_inventory
       SET dozens_in_wip = dozens_in_wip + $qty,
           version = version + 1
       WHERE order_id = $order AND part_id = $p
         AND version = $wip_expected_version
  ⑥ INSERT inventory_transactions
       (txn_type = RELEASE, from_location: WAREHOUSE/$wh,
        to_location: PRODUCTION_ORDER/$order_id)
  ⑦ INSERT physical_bag_movements
       (from_status = RELEASED, to_status = RELEASED,
        from_warehouse_id = $wh, to_order_id = $order_id)
COMMIT
```

**Failure modes:**
- inventory_bags optimistic lock failure → retry (T3)
- wip_inventory optimistic lock failure → retry (T5 in wip_inventory)
- Non-negative guard on inventory_bags → 422

---

## T4 — Cancel Reservation (Release Without Consumption)

**Trigger:** `ReleaseStockReservationUseCase.execute()`
**Business event:** Reservation cancelled — bag returns to AVAILABLE

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① SELECT physical_bags FOR UPDATE WHERE bag_id = $id
  ② Validate: reservation status = ACTIVE
  ③ UPDATE physical_bags SET status = AVAILABLE, current_order_id = NULL
  ④ UPDATE physical_bag_reservations
       SET status = CANCELLED, released_at = now()
  ⑤ INSERT physical_bag_movements
       (from_status = RESERVED, to_status = AVAILABLE)
  ⑥ INSERT inventory_transactions
       (txn_type = ADJUSTMENT, note: "Reservation cancelled — bag returned to available pool")
COMMIT
```

---

## T5 — WIP Consumption (Production Complete)

**Trigger:** `ConsumeWIPUseCase.execute()` (Sprint 13 — Production)
**Business event:** Material consumed during production; quality output recorded

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① UPDATE wip_inventory
       SET dozens_in_wip = dozens_in_wip - $consumed,
           version = version + 1
       WHERE order_id = $order AND part_id = $p
         AND version = $expected_version
         AND dozens_in_wip >= $consumed    ← non-negative guard
  ② UPSERT quality_output_boxes
       SET dozens_available = dozens_available + $approved,
           version = version + 1
       WHERE order_id = $order AND color_id = $c AND size_id = $s
         AND version = $qob_version
  ③ INSERT inventory_transactions (type = WIP_CONSUMPTION)
  ④ INSERT inventory_transactions (type = QUALITY_OUTPUT)
  ⑤ UPDATE physical_bags SET status = CLOSED (if fully consumed)
       OR         status = IN_WIP (if partially remaining)
COMMIT
```

---

## T6 — Return Material from Production

**Trigger:** `ReturnMaterialUseCase.execute()` (Sprint 13 — Production)
**Business event:** Unused material returned from production line to warehouse

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① UPDATE wip_inventory
       SET dozens_in_wip = dozens_in_wip - $returned,
           version = version + 1
       WHERE version = $expected_version
         AND dozens_in_wip >= $returned
  ② UPDATE inventory_bags
       SET dozens_on_hand = dozens_on_hand + $returned,
           version = version + 1
       WHERE warehouse_id = $dest_wh AND model_id = $m AND part_id = $p
         AND version = $inv_version
  ③ UPDATE physical_bags SET status = RETURNED, current_order_id = NULL
  ④ INSERT return_transactions
  ⑤ INSERT inventory_transactions (type = RETURN)
  ⑥ INSERT physical_bag_movements (to_status = RETURNED)
COMMIT
```

---

## T7 — Inventory Adjustment

**Trigger:** `AdjustInventoryUseCase.execute()` (Sprint 11 — requires manager role + justification)
**Business event:** Physical count variance correction

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① SELECT inventory_bags FOR UPDATE WHERE bag_id = $id
  ② UPDATE inventory_bags
       SET dozens_on_hand = $new_qty,
           version = version + 1
       WHERE bag_id = $id AND version = $expected_version
  ③ INSERT inventory_transactions
       (type = ADJUSTMENT, dozens_qty = |new - old|, notes = $justification)
  ④ If |variance| > threshold: INSERT inventory_investigations
COMMIT
```

---

## T8 — Supplementary Material Release

**Trigger:** `TransferSupplementaryMaterialUseCase.execute()` (Sprint 13 — Production)
**Business event:** Extra material approved and transferred to production line

**Atomic boundary:**
```
BEGIN TRANSACTION
  ① UPDATE supplementary_material_requests SET status = TRANSFERRED
  ② For each supplementary_request_line:
       UPDATE inventory_bags SET dozens_on_hand -= transferred_dozens, version++
       UPSERT wip_inventory SET dozens_in_wip += transferred_dozens, version++
       INSERT inventory_transactions (type = SUPPLEMENTARY_RELEASE)
COMMIT
```

---

## Boundary Summary Table

| Transaction | Tables Written | Optimistic Lock | Pessimistic Lock | Sprint |
|-------------|---------------|-----------------|-----------------|--------|
| T1 Receive | physical_bags, physical_bag_contents, inventory_bags, inventory_transactions, physical_bag_movements | inventory_bags.version | — | 11 |
| T2 Reserve | physical_bags, physical_bag_reservations, physical_bag_movements, inventory_transactions | — | physical_bags FOR UPDATE | 11 |
| T3 Release to WIP | physical_bags, physical_bag_reservations, inventory_bags, wip_inventory, inventory_transactions, physical_bag_movements | inventory_bags.version + wip_inventory.version | physical_bags FOR UPDATE | 13 |
| T4 Cancel Reservation | physical_bags, physical_bag_reservations, physical_bag_movements, inventory_transactions | — | physical_bags FOR UPDATE | 11 |
| T5 WIP Consumption | wip_inventory, quality_output_boxes, physical_bags, inventory_transactions | wip_inventory.version + quality_output_boxes.version | — | 13 |
| T6 Return | wip_inventory, inventory_bags, physical_bags, return_transactions, inventory_transactions, physical_bag_movements | wip_inventory.version + inventory_bags.version | — | 13 |
| T7 Adjustment | inventory_bags, inventory_transactions, inventory_investigations? | — | inventory_bags FOR UPDATE | 11 |
| T8 Supplementary | supplementary_material_requests, inventory_bags, wip_inventory, inventory_transactions | inventory_bags.version + wip_inventory.version | — | 13 |

---

## Non-Negative Guards

All quantity decrements must include a PostgreSQL-level check in the WHERE clause:

```sql
UPDATE factory.inventory_bags
SET dozens_on_hand = dozens_on_hand - $delta,
    version = version + 1
WHERE bag_id = $id
  AND version = $expected_version
  AND dozens_on_hand >= $delta;    -- Non-negative guard
```

If the UPDATE returns 0 rows modified, the application must determine why:
- If version mismatch → retry with fresh read (optimistic lock conflict)
- If quantity insufficient → throw `UnprocessableEntityException` (stock insufficient)

Recommend using `$queryRaw` with `RETURNING` for reliable row-count checking:
```sql
UPDATE factory.inventory_bags SET ... RETURNING bag_id
-- If result is empty → check version and quantity separately
```

---

## What Is NOT a Transaction Boundary

These operations are read-only and must NOT open a write transaction:

- `GetStockLevelUseCase` — `SELECT` only
- `ListInventoryBagsUseCase` — `SELECT` only  
- `ListInventoryTransactionsUseCase` — `SELECT` only
- `GetPhysicalBagUseCase` — `SELECT` only
- Stock level availability calculations — `SELECT` with aggregation

Read operations must never hold locks. Use read-committed isolation (PostgreSQL default).
