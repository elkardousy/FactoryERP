# P02 — Material Release Engine: Feature Report

| Field | Value |
|---|---|
| **Feature** | P02 — Material Release Engine |
| **Status** | COMPLETE |
| **Date** | 2026-06-30 |
| **Tests** | 326/326 (14 new) |
| **Build** | PASS |
| **Lint** | PASS (0 errors) |

---

## What Was Built

Three HTTP endpoints for releasing physical bags into production:

| Method | Path | Role Gate | Description |
|---|---|---|---|
| POST | `/v1/production/orders/:id/release-groups` | ADMIN/MANAGER/SUPERVISOR | Create release group (atomic) |
| GET | `/v1/production/orders/:id/release-groups` | All authenticated | List release groups for order |
| GET | `/v1/production/release-groups/:groupId` | All authenticated | Get release group detail |

---

## Files Produced

### New
- `src/modules/production/dto/material-release.dto.ts` — DTOs and mappers
- `src/modules/production/repositories/material-release.repository.ts` — DB access + CMO optimistic lock
- `src/modules/production/use-cases/create-release-group/create-release-group.use-case.ts` — Core atomic release
- `src/modules/production/use-cases/get-release-group/get-release-group.use-case.ts`
- `src/modules/production/use-cases/list-release-groups/list-release-groups.use-case.ts`
- `src/modules/production/use-cases/material-release.use-cases.spec.ts` — 14 tests
- `src/modules/production/controllers/material-release.controller.ts`
- `docs/execution/production/ENGINEERING_DECISION_REPORT_P02.md`

### Modified
- `src/modules/production/production.module.ts` — Added `InventoryModule` import + 5 new providers
- `src/modules/production/repositories/production-orders.repository.ts` — Added `findOrderPartId`
- `src/modules/production/events/production.events.ts` — Added `MaterialReleaseCreatedEvent`
- `src/modules/production/events/production-event.publisher.ts` — Added `emitMaterialReleased`
- `src/modules/production/events/production-event.listener.ts` — Added `onMaterialReleased` stub

---

## Architecture Decisions

### Schema Conflict: No Release Lifecycle (Approve/Cancel/Execute)

`release_groups` has no `status` column. The MEC proposed a multi-step workflow (Create → Approve → Execute). This was impossible without a schema migration.

**Resolution:** `CreateReleaseGroupUseCase` performs an immediate atomic release in a single transaction. Approve/Cancel/Execute lifecycle deferred — SQL extensions documented in `ENGINEERING_DECISION_REPORT_P02.md`.

### Schema Conflict: Full Bag Release Only

`release_group_lines` has no `bag_id` column and `physical_bag_reservations` has no `released_dozens` field. Per-bag partial release tracking is impossible without schema extension.

**Resolution:** `dozens_to_release` must exactly equal `reservation.reserved_dozens`. Enforced at validation time. Partial release capability documented as a schema extension requirement.

### CMO Line Decrement: Optimistic Lock

`customer_manufacturing_order_lines.remaining_dozens` is DB-generated. Writing directly to it is prohibited. Instead, `released_dozens` is incremented via `updateMany WHERE version = currentVersion`. Up to 3 retries; throws `ConflictException` on exhaustion.

---

## Transaction Scope

`CreateReleaseGroupUseCase` wraps all writes in a single `executeInTransaction` call:

1. Aggregate `MAX(group_number)` → compute next sequential group number
2. `release_groups.create`
3. For each bag: `release_group_lines.create`
4. For each bag: `physical_bag_reservations.update` → RELEASED
5. For each bag: `physical_bags.update` → RELEASED (custody to order)
6. For each bag: `physical_bag_movements.create` (audit trail)
7. For each bag: `inventory_bags.updateMany` (decrement `dozens_on_hand`)
8. For each bag: `inventory_transactions.create` (RELEASE type)
9. BR-R07: For each distinct part: count remaining ACTIVE reservations; if 0 → `production_order_parts.update` → RELEASED

Post-transaction (not in tx to avoid deadlock):
- CMO line `released_dozens` increment with optimistic lock retry
- `MaterialReleaseCreatedEvent` publish
- Audit log (never breaks caller)

---

## Validation Rules Enforced

| Rule | Error |
|---|---|
| Order must be PLANNED | 400 |
| No duplicate bag_ids in request | 400 |
| Bag must exist | 404 |
| Bag must be RESERVED | 400 |
| Bag must have a current warehouse | 400 |
| `source_warehouse_id` must match `bag.current_warehouse_id` | 400 |
| Active reservation must exist for bag+order | 404 |
| Reservation must be ACTIVE | 400 |
| `dozens_to_release` must equal `reserved_dozens` | 400 |
| Part must be assigned to the order | 404 |

---

## Tests

14 unit tests in `material-release.use-cases.spec.ts`:

| Suite | Count | Covers |
|---|---|---|
| CreateReleaseGroupUseCase | 9 | Happy path, order not found, not PLANNED, duplicate bags, bag not found, not RESERVED, warehouse mismatch, reservation not found, dozens mismatch, CMO conflict exhaustion |
| GetReleaseGroupUseCase | 2 | Found, not found |
| ListReleaseGroupsUseCase | 2 | Returns summaries, empty list |

All 326 tests pass (14 new + 312 existing).

---

## What Is NOT Implemented (Deferred)

These capabilities from the original MEC spec are deferred pending schema extension:

- **Approve release group** — requires `status` column on `release_groups`
- **Cancel release group** — same
- **Execute release group** (two-phase create/execute) — same
- **Partial bag release** — requires `bag_id` on `release_group_lines` and `released_dozens` on `physical_bag_reservations`
- **Release history query** — can be added as a simple repository method when needed

SQL migration stubs for all deferred schema extensions are in `ENGINEERING_DECISION_REPORT_P02.md`.
