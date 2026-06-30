# Engineering Decision Report — P02: Material Release

**Date:** 2026-06-30  
**Feature:** P02 — Material Release  
**Prepared by:** Lead Backend Engineer  
**Status:** RESOLVED — implemented with documented deviations

---

## Issue 1: Release Workflow Lifecycle vs. Schema

### Conflict

The P02 MEC proposes four distinct commands: `CreateMaterialRelease`, `ApproveMaterialRelease`, `ExecuteMaterialRelease`, `CancelMaterialRelease`. This implies a multi-step lifecycle with an intermediate status for releases pending approval.

**Schema reality:** `release_groups` has NO `status` column:

```
model release_groups {
  release_group_id BigInt @id
  order_id         BigInt
  group_number     Int
  released_by      BigInt
  released_at      DateTime
}
```

No status, no approval timestamp, no cancellation record.

### Analysis

The schema models material release as an **immediate, atomic event**. When a release group is created, the material is released. There is no pending state.

The Approve/Execute/Cancel commands from the MEC cannot be implemented without a schema extension adding:
- `release_groups.status ReleaseGroupStatusEnum`
- `release_groups.approved_by BigInt`
- `release_groups.approved_at DateTime`

### Resolution

Implement `CreateReleaseGroupUseCase` as an immediate, atomic, single-step operation. The "Approve" and "Cancel" commands are deferred pending schema migration approval.

**Deferred commands:**
- `ApproveMaterialRelease` — requires `release_groups.status` schema extension
- `CancelMaterialRelease` — requires `release_groups.status` schema extension

---

## Issue 2: Partial Bag Release Tracking

### Conflict

BR-R02 states: `dozens_to_release ≤ reserved_dozens`. BR-R03 states: "If partially released, bag status remains RESERVED."

This implies partial bag releases are supported — releasing, say, 3 of 5 reserved dozens initially and the remaining 2 later.

**Schema reality:** Neither `physical_bag_reservations` nor `release_group_lines` tracks remaining-per-bag balance:

- `physical_bag_reservations.reserved_dozens` = original reserved amount (not decremented on partial release)
- `release_group_lines` has NO `bag_id` column — lines reference `order_part_id`, not individual bags
- Without `bag_id` on `release_group_lines`, you cannot sum "how much has been released from bag X" across multiple release groups

### Analysis

To correctly enforce BR-R02 on a second partial release from the same bag, the system would need to sum `release_group_lines.dozens_released` filtered by bag. This is not possible without `bag_id` on `release_group_lines`.

Supporting partial releases requires at least one of:
- `bag_id` column on `release_group_lines`
- `released_dozens` column on `physical_bag_reservations`

### Resolution

**Implement full-bag release only**: `dozens_to_release` must exactly equal `reservation.reserved_dozens`. Attempting to release a partial amount is rejected with `BadRequestException`.

When a bag is released:
- `physical_bag_reservations.status` → RELEASED (immediately, atomically)
- `physical_bags.status` → RELEASED

**Deferred capability:**
- Partial bag releases require schema extension (bag_id on release_group_lines OR released_dozens on reservations)

---

## Issue 3: CMO Line `remaining_dozens` is DB-Generated

### Conflict

BR-R04 says to decrement `customer_manufacturing_order_lines.remaining_dozens` on release with optimistic lock.

**Schema reality:** `remaining_dozens` is `@default(dbgenerated())` — it's a computed column. Cannot be written directly.

The correct column to update is `released_dozens` (a regular Decimal column). `remaining_dozens` auto-recalculates as:
`ordered_dozens - released_dozens - produced_dozens - packed_dozens - delivered_dozens`

### Resolution

Implement BR-R04 as: **increment `released_dozens`** (not decrement `remaining_dozens`), with optimistic lock on `version BigInt @default(0)`. Retry up to 3 times on version conflict.

---

## SQL Required for Deferred Schema Extensions

```sql
-- Add status to release_groups (for Approve/Cancel workflow)
ALTER TYPE factory.release_group_status_enum ADD VALUE 'PENDING';  -- create first
ALTER TABLE factory.release_groups 
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN approved_by BIGINT REFERENCES factory.users(user_id),
  ADD COLUMN approved_at TIMESTAMPTZ;

-- Add bag_id to release_group_lines (for per-bag partial release tracking)
ALTER TABLE factory.release_group_lines
  ADD COLUMN bag_id BIGINT REFERENCES factory.physical_bags(bag_id);

-- Add released_dozens to physical_bag_reservations (alternative approach)
ALTER TABLE factory.physical_bag_reservations
  ADD COLUMN released_dozens DECIMAL(12,3) NOT NULL DEFAULT 0;
```

**Authorization required from:** Business Owner before any schema extension.
