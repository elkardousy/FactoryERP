# Engineering Decision Report — P07 Return to Warehouse

| Field | Value |
|---|---|
| **Feature** | P07 — Return to Warehouse |
| **Date** | 2026-06-30 |
| **Author** | Implementing Agent |
| **Status** | APPROVED — implementation proceeds under these decisions |

---

## Context

P07 implements the Return to Warehouse engine, which allows unused material (WIP) from production orders to be returned to a raw-material or WIP warehouse. The return schema is `return_transactions`, examined prior to implementation.

---

## ED-P07-001: No `bag_id` in `return_transactions` — Part-level validation only

**Decision:** Return validation is done at part/WIP level, not bag level.

**Finding:** `return_transactions` has fields: `return_id`, `order_id`, `destination_warehouse_id`, `part_id`, `dozens_returned`, `returned_by`, `returned_at`. There is no `bag_id` column.

**BR-Rt01** references bag-level return tracking. This cannot be implemented: the schema does not link a return to a specific physical bag.

**Resolution:**
- Available WIP is validated via `wip_inventory.dozens_in_wip` WHERE `(order_id, part_id)`
- The returned quantity cannot exceed current WIP in dozens for that part
- Bag-level tracking (which specific bags were returned) is deferred pending schema extension

**Deferred:** Bag-level return tracking requires `bag_id BigInt?` column on `return_transactions`.

---

## ED-P07-002: BR-Rt04 deferred — Bag status revert not implementable

**Decision:** Bag status revert (RELEASED → RECEIVED/AVAILABLE) is deferred.

**Finding:** BR-Rt04 states bags returned from production should have their `physical_bags.status` reverted. Since `return_transactions` has no `bag_id`, P07 cannot identify which bags were returned.

**Resolution:**
- P07 does not modify `physical_bags.status`
- Bag status revert is an Inventory concern; it requires `bag_id` on `return_transactions`
- Deferred pending schema extension

---

## ED-P07-003: `CompleteReturn` command deferred — no status lifecycle in schema

**Decision:** `CompleteReturn` command is not implemented. Every `return_transactions` row is a committed, completed return.

**Finding:** `return_transactions` has no `status` column. There is no state machine (PENDING → COMPLETE) in the schema.

**Resolution:**
- `CreateReturn` creates a committed return immediately
- No separate `CompleteReturn` step exists
- `CompleteReturn` and the associated `production.return.completed` event are deferred pending schema extension (`status VARCHAR`, `completed_at TIMESTAMPTZ`, `completed_by BIGINT`)

---

## ED-P07-004: No `notes` field — return reason not capturable

**Decision:** Return notes/reason are not stored.

**Finding:** `return_transactions` has no `notes` or `reason_code` column.

**Resolution:**
- `CreateReturnDto` does not expose a `notes` field
- Return reason is not recorded
- Deferred pending schema extension

---

## ED-P07-005: Valid order statuses for return — IN_PRODUCTION or PRODUCTION_COMPLETE

**Decision:** Returns are allowed when order status is `IN_PRODUCTION` or `PRODUCTION_COMPLETE`.

**Rationale:**
- `IN_PRODUCTION`: the most common case — returning unused material during production
- `PRODUCTION_COMPLETE`: returning leftover material after all stages finished but before order is closed
- `CLOSED`: order is finalized — returns disallowed

---

## ED-P07-006: BR-Rt05 implementation — part status set to RETURNED when WIP reaches zero

**Decision:** When a return causes `wip_inventory.dozens_in_wip` to reach 0 for a given `(order_id, part_id)`, the corresponding `production_order_parts.status` is set to `RETURNED` atomically in the same transaction.

**Rationale:**
- BR-Rt05 states part should be marked RETURNED when all WIP is returned
- "Zero" is defined as `new_wip ≤ 0` (to handle floating-point edge cases)
- `wip_inventory.dozens_in_wip` is clamped to 0 (never goes negative)

---

## ED-P07-007: WIP optimistic lock for concurrent return safety

**Decision:** WIP decrement uses optimistic locking with up to 3 retries, consistent with P04 and P06.

**Rationale:**
- Two concurrent returns for the same (order, part) could both read sufficient WIP and both proceed, causing WIP to go negative
- Optimistic lock (version field on `wip_inventory`) prevents this: the second writer sees `updateMany count=0` and retries
- On retry, available WIP is re-checked; if insufficient, `BadRequestException` is thrown

---

## Summary of Deferred Items

| Item | Blocker | Schema Extension Needed |
|---|---|---|
| Bag-level return tracking | No `bag_id` on `return_transactions` | `bag_id BigInt?` FK to `physical_bags` |
| Bag status revert (BR-Rt04) | Same as above | Same as above |
| CompleteReturn command | No `status` on `return_transactions` | `status`, `completed_at`, `completed_by` columns |
| `production.return.completed` event | CompleteReturn deferred | Same as above |
| Return notes/reason | No `notes` column | `notes TEXT?` column |
