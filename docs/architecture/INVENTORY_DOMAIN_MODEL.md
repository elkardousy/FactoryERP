# Inventory Domain Model

**Status:** Architecture Design — Phase 3 Sprint 0
**Date:** 2026-06-27
**Authority:** Chief ERP Architect / Architecture Review Board
**Version:** 1.0.0

---

## Overview

The Inventory domain tracks physical material from supplier receipt through production consumption. It manages two distinct layers: **physical bags** (barcoded physical units) and **inventory bags** (aggregate stock ledger records). These are not the same concept and must never be conflated.

---

## Aggregate Definitions

### Aggregate 1 — PhysicalBag

**Root entity:** `physical_bags`

**Responsibility:** Represents one barcoded physical bag of material received from a supplier. It is the physical unit of inventory. Its lifecycle tracks the movement of one bag from receipt to final consumption or closure.

**Child entities within aggregate:**
- `physical_bag_contents` — per (color × size) piece breakdown inside the bag
- `physical_bag_movements` — ordered movement log (audit trail of every status change)
- `physical_bag_reservations` — active or historical reservations made on this bag
- `physical_bag_content_adjustments` — content corrections after initial audit

**Value Objects:**
- `BagCode` — globally unique barcode string (VarChar 30); immutable after creation
- `DozensQty` — `Decimal(12,3)` — the canonical unit of measure throughout the system
- `ReceivedDate` — `Date` — date the bag physically arrived (not the timestamp of DB insert)
- `BagStatus` — enum (`BagStatusEnum`): RECEIVED | AVAILABLE | RESERVED | RELEASED | IN_WIP | RETURNED | CLOSED

**Invariants:**
1. `current_dozens` ≤ `received_dozens` at all times
2. `current_dozens` ≥ 0 at all times
3. `bag_code` is globally unique — no two bags share a barcode
4. Status transitions must follow the valid lifecycle (see Bag Lifecycle below)
5. A bag in RELEASED, IN_WIP, or CLOSED status cannot be reserved
6. A bag in CLOSED status is immutable — no further mutations allowed
7. `customer_id`, `model_id`, `part_id` are immutable after creation

---

### Aggregate 2 — InventoryBag (Stock Ledger)

**Root entity:** `inventory_bags`

**Responsibility:** The logical aggregate stock record for a specific (warehouse × model × part) combination. This is NOT a physical bag — it is the running tally of dozens available at a location. Multiple physical bags contribute to one inventory bag record.

**Value Objects:**
- `LocationKey` — composite (`warehouse_id`, `model_id`, `part_id`) — uniquely identifies a stock position
- `DozensOnHand` — `Decimal(12,3)` — current available quantity at this location
- `Version` — `BigInt` — optimistic concurrency control token; incremented on every mutation

**Invariants:**
1. `dozens_on_hand` ≥ 0 at all times — negative stock is a system invariant violation
2. One record per (warehouse, model, part) — enforced by unique constraint
3. `version` must match the expected value in any UPDATE; mismatch = concurrent modification = retry
4. `dozens_on_hand` may only change via an atomic transaction that also writes an `inventory_transactions` record

---

### Aggregate 3 — WIPInventory

**Root entity:** `wip_inventory`

**Responsibility:** Tracks the quantity of material currently in-progress on a production order for a given part. It is the WIP layer between the raw material store and finished goods.

**Value Objects:**
- `WIPKey` — composite (`order_id`, `part_id`)
- `DozensInWIP` — `Decimal(12,3)` — quantity currently being processed
- `Version` — `BigInt` — optimistic locking

**Invariants:**
1. `dozens_in_wip` ≥ 0 at all times
2. One record per (order, part)
3. `version` must match in any UPDATE (same concurrency pattern as InventoryBag)
4. WIP increases when material is released from warehouse to production line
5. WIP decreases when material is consumed (production complete) or returned

---

### Aggregate 4 — InventoryTransaction (Ledger Entry)

**Root entity:** `inventory_transactions`

**Responsibility:** Immutable ledger record of every inventory movement. Every quantity change in `inventory_bags`, `wip_inventory`, or `quality_output_boxes` MUST have a corresponding transaction record. This is the authoritative audit trail.

**Composite PK:** `[txn_id, executed_at]` — designed for future monthly partitioning

**Value Objects:**
- `TxnReference` — VarChar(50) — links to the business document that caused this movement (e.g., release_group_id, return_id)
- `TxnType` — `TxnTypeEnum`: RECEIVING | RELEASE | WIP_CONSUMPTION | QUALITY_OUTPUT | PACKING | RETURN | ADJUSTMENT | SUPPLEMENTARY_RELEASE
- `LocationRef` — polymorphic reference: `{from_location_type, from_location_id}` and `{to_location_type, to_location_id}`
- `DozensQty` — always positive; direction implied by TxnType

**Invariants:**
1. Once created, a transaction record is immutable — no UPDATE or DELETE
2. Every inventory quantity mutation must be in the same database transaction as its InventoryTransaction insert
3. `txn_reference` links to the business document — must not be null for any non-ADJUSTMENT type

---

### Aggregate 5 — QualityOutputBox

**Root entity:** `quality_output_boxes`

**Responsibility:** Tracks the quantity of quality-approved finished pieces per (order × color × size). Feeds into the packing system. This aggregate lives on the boundary of Inventory and Quality domains.

**Value Objects:**
- `OutputKey` — composite (`order_id`, `color_id`, `size_id`)
- `DozensAvailable` — `Decimal(12,3)` — available for packing
- `Version` — `BigInt` — optimistic locking

**Invariants:**
1. `dozens_available` ≥ 0
2. One record per (order, color, size)
3. Increases on QUALITY_OUTPUT transaction
4. Decreases on PACKING transaction

---

## Business Rules

### Stock Level Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| BR-1 | Stock cannot go negative | Validate before UPDATE; throw UnprocessableEntityException |
| BR-2 | Every quantity change produces a transaction record | Transaction boundary — both in same `executeInTransaction()` |
| BR-3 | Optimistic lock must match | UPDATE WHERE version=$v; retry on mismatch |
| BR-4 | Reservation reduces available stock | ATP = dozens_on_hand − (sum of active reservation dozens) |
| BR-5 | A bag can only be reserved if AVAILABLE | Validate bag.status === AVAILABLE before reservation |
| BR-6 | Reservation quantity cannot exceed bag's current_dozens | Validate at reservation time |
| BR-7 | Released quantity cannot exceed reservation quantity | Validate at release time |

### Bag Lifecycle Rules

| Rule | Description |
|------|-------------|
| BR-8 | RECEIVED bags must be audited before becoming AVAILABLE |
| BR-9 | Only AVAILABLE bags can be RESERVED |
| BR-10 | Only RESERVED bags can be RELEASED to a production order |
| BR-11 | RELEASED bags become IN_WIP when entered into production |
| BR-12 | IN_WIP bags can be RETURNED to warehouse (creates return_transaction) |
| BR-13 | CLOSED bags are terminal — no further mutations |
| BR-14 | bag_code, customer_id, model_id, part_id are immutable after creation |

### Transaction Rules

| Rule | Description |
|------|-------------|
| BR-15 | RECEIVING: increases inventory_bags.dozens_on_hand |
| BR-16 | RELEASE: decreases inventory_bags.dozens_on_hand; increases wip_inventory.dozens_in_wip |
| BR-17 | WIP_CONSUMPTION: decreases wip_inventory.dozens_in_wip; increases quality_output_boxes.dozens_available |
| BR-18 | RETURN: decreases wip_inventory.dozens_in_wip; increases inventory_bags.dozens_on_hand |
| BR-19 | ADJUSTMENT: changes inventory_bags.dozens_on_hand directly; requires justification |
| BR-20 | PACKING: decreases quality_output_boxes.dozens_available |

---

## Bag Lifecycle

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                                                                 │
 │  [Receiving]         [Audit Pass]       [Reservation]          │
 │   RECEIVED  ──────►  AVAILABLE  ──────►   RESERVED             │
 │                                               │                │
 │                                     [Release to Production]    │
 │                                               ▼                │
 │                                           RELEASED             │
 │                                          ╱         ╲           │
 │                              [Production]           [Return]   │
 │                                  ▼                    ▼        │
 │                               IN_WIP             RETURNED      │
 │                                  │                    │        │
 │                            [Consumed]           [Re-Stock]     │
 │                                  ▼                    ▼        │
 │                               CLOSED             AVAILABLE     │
 │                                                               │
 └─────────────────────────────────────────────────────────────────┘

Valid transitions:
  RECEIVED   → AVAILABLE     (after receiving audit approval)
  AVAILABLE  → RESERVED      (CreateStockReservationUseCase)
  AVAILABLE  → CLOSED        (if bag is damaged/condemned)
  RESERVED   → AVAILABLE     (ReleaseStockReservationUseCase — cancellation)
  RESERVED   → RELEASED      (production release)
  RELEASED   → IN_WIP        (production consumption started)
  RELEASED   → RETURNED      (returned before WIP entry)
  IN_WIP     → RETURNED      (returned from production line)
  IN_WIP     → CLOSED        (fully consumed in production)
  RETURNED   → AVAILABLE     (returned material restocked)

Invalid transitions (must throw ConflictException):
  * → RECEIVED     (receipt is initial state only)
  CLOSED → *       (terminal state — no mutations)
  IN_WIP → RESERVED (bag is already in production)
```

---

## Stock Lifecycle

```
[Container Received]
      │
      ▼
physical_bags.status = RECEIVED
inventory_bags.dozens_on_hand += received_dozens  [RECEIVING txn]
      │
[Audit approved]
      ▼
physical_bags.status = AVAILABLE
      │
[Production order released]
      ▼
physical_bag_reservations (status = ACTIVE)
physical_bags.status = RESERVED
      │
[Issued to production line]
      ▼
inventory_bags.dozens_on_hand -= released_dozens  [RELEASE txn]
wip_inventory.dozens_in_wip += released_dozens
physical_bags.status = RELEASED/IN_WIP
      │
     ╱ ╲
    ╱   ╲
[Consumed]  [Returned]
    ▼           ▼
wip_inventory    wip_inventory
.dozens_in_wip   .dozens_in_wip
-= consumed      -= returned     [RETURN txn]
[WIP_CONSUMPTION  inventory_bags
   txn]          .dozens_on_hand
quality_output   += returned
_boxes
.dozens_available
+= approved
[QUALITY_OUTPUT]
    │
[Packing]
    ▼
quality_output_boxes.dozens_available -= packed  [PACKING txn]
```

---

## Reservation Lifecycle

```
[CreateStockReservation]
  ├── Validate bag.status = AVAILABLE
  ├── Validate reserved_dozens ≤ bag.current_dozens
  ├── INSERT physical_bag_reservations (status = ACTIVE)
  ├── UPDATE physical_bags (status = RESERVED)
  ├── INSERT physical_bag_movements
  └── INSERT inventory_transactions (type = RELEASE, docs reserved stock)

[ReleaseReservation — cancelled before production]
  ├── UPDATE physical_bag_reservations (status = CANCELLED, released_at = now())
  ├── UPDATE physical_bags (status = AVAILABLE)
  ├── INSERT physical_bag_movements
  └── INSERT inventory_transactions (reversal note)

[Consume Reservation — material issued to production]
  ├── UPDATE physical_bag_reservations (status = RELEASED, released_at = now())
  ├── UPDATE physical_bags (status = RELEASED, current_order_id = order_id)
  ├── UPDATE wip_inventory (dozens_in_wip += qty, version++)
  ├── UPDATE inventory_bags (dozens_on_hand -= qty, version++)
  ├── INSERT physical_bag_movements
  └── INSERT inventory_transactions (type = RELEASE)
```

---

## Missing Domain Concepts (Identified Gaps)

| Gap | Description | Priority | Recommendation |
|-----|-------------|----------|----------------|
| G-1 | No explicit ATP (Available-to-Promise) column | High | Add `dozens_reserved Decimal` to `inventory_bags` in future sprint for O(1) availability queries |
| G-2 | ReservationStatus is a free string "ACTIVE" | Critical | Add `ReservationStatusEnum` before Sprint 11 (see Required Changes) |
| G-3 | LocationType is a free string in `inventory_transactions` | High | Add `LocationTypeEnum` (WAREHOUSE, PRODUCTION_ORDER, SUPPLIER) |
| G-4 | No "lot" or "batch" tracking | Low | Out of scope; physical_bag provides sufficient traceability |
| G-5 | No "minimum stock threshold" or "reorder point" | Low | Out of scope for Sprint 11; defer to Sprint 19 (Dashboard) |
| G-6 | No "damaged goods" sub-status | Medium | Consider `is_damaged Boolean` on physical_bags in future sprint |
| G-7 | physical_bags.updated_at missing `@updatedAt` | High | Apply TD-2 (see Required Changes) |
