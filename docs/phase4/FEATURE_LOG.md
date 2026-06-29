# Phase 4 Feature Log

**Phase:** 4 — Inventory Module Completion
**Baseline:** 5a5e3d6 | Sprint 11.3 | 197 tests
**Closed:** 2026-06-29 | 255 tests

---

## Feature 01 — Inventory Availability Engine

**Objective:** Expose per-bag, per-warehouse, and per-model availability queries that compute `free_dozens = current_dozens - reserved_dozens` using active reservation aggregation.
**Status:** DONE
**Commit:** c937069
**Date:** 2026-06-29
**Tests Added:** 7 (197 → 204)

### Files Created
- `src/modules/inventory/dto/bag-availability.dto.ts`
- `src/modules/inventory/dto/ledger-availability.dto.ts`
- `src/modules/inventory/services/inventory-availability.service.ts`
- `src/modules/inventory/use-cases/get-bag-availability/get-bag-availability.use-case.ts`
- `src/modules/inventory/use-cases/get-bag-availability/queries/get-bag-availability.query.ts`
- `src/modules/inventory/use-cases/get-warehouse-availability/get-warehouse-availability.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-availability/queries/get-warehouse-availability.query.ts`
- `src/modules/inventory/use-cases/get-model-availability/get-model-availability.use-case.ts`
- `src/modules/inventory/use-cases/get-model-availability/queries/get-model-availability.query.ts`
- `src/modules/inventory/use-cases/availability.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints + imports
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### APIs Added
- `GET /v1/inventory/availability/bags/:bagId`
- `GET /v1/inventory/availability/warehouse/:warehouseId`
- `GET /v1/inventory/availability/model/:modelId`

### Quality Gates
Build: PASS | Lint: PASS | Tests: 204/204 PASS | Prisma: PASS

---

## Feature 02 — Inventory Balance Engine

**Objective:** Expose aggregated balance summaries at warehouse and model level, plus exact ledger snapshots per SKU (warehouse + model + part triple).
**Status:** DONE
**Commit:** bc6f56a
**Date:** 2026-06-29
**Tests Added:** 6 (204 → 210)

### Files Created
- `src/modules/inventory/dto/warehouse-balance-summary.dto.ts`
- `src/modules/inventory/dto/model-balance-summary.dto.ts`
- `src/modules/inventory/dto/balance-snapshot.dto.ts`
- `src/modules/inventory/services/inventory-balance.service.ts`
- `src/modules/inventory/use-cases/get-warehouse-balance-summary/get-warehouse-balance-summary.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-balance-summary/queries/get-warehouse-balance-summary.query.ts`
- `src/modules/inventory/use-cases/get-model-balance-summary/get-model-balance-summary.use-case.ts`
- `src/modules/inventory/use-cases/get-model-balance-summary/queries/get-model-balance-summary.query.ts`
- `src/modules/inventory/use-cases/get-balance-snapshot/get-balance-snapshot.use-case.ts`
- `src/modules/inventory/use-cases/get-balance-snapshot/queries/get-balance-snapshot.query.ts`
- `src/modules/inventory/use-cases/balance.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints + imports
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### APIs Added
- `GET /v1/inventory/balance/warehouse/:warehouseId`
- `GET /v1/inventory/balance/model/:modelId`
- `GET /v1/inventory/balance/snapshot?warehouse_id=&model_id=&part_id=`

### Quality Gates
Build: PASS | Lint: PASS | Tests: 210/210 PASS | Prisma: PASS

---

## Feature 03 — Physical Bag Movement

**Objective:** Implement atomic physical bag movement operations (warehouse transfer, order assignment, order return) with status-transition validation and full audit trail via `physical_bag_movements`.
**Status:** DONE
**Commit:** 0600f54
**Date:** 2026-06-29
**Tests Added:** 10 (210 → 218) — 3 happy-path + 3 guard (invalid state) + 4 missing entity

### Files Created
- `src/modules/inventory/dto/transfer-to-warehouse.dto.ts`
- `src/modules/inventory/dto/assign-to-order.dto.ts`
- `src/modules/inventory/dto/return-from-order.dto.ts`
- `src/modules/inventory/services/physical-bag-movement.validator.ts`
- `src/modules/inventory/services/physical-bag-movement.service.ts`
- `src/modules/inventory/use-cases/transfer-bag-to-warehouse/transfer-bag-to-warehouse.use-case.ts`
- `src/modules/inventory/use-cases/transfer-bag-to-warehouse/commands/transfer-bag-to-warehouse.command.ts`
- `src/modules/inventory/use-cases/assign-bag-to-order/assign-bag-to-order.use-case.ts`
- `src/modules/inventory/use-cases/assign-bag-to-order/commands/assign-bag-to-order.command.ts`
- `src/modules/inventory/use-cases/return-bag-from-order/return-bag-from-order.use-case.ts`
- `src/modules/inventory/use-cases/return-bag-from-order/commands/return-bag-from-order.command.ts`
- `src/modules/inventory/use-cases/movement.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/repositories/physical-bags.repository.ts` — added `createMovementInTx()`, `updateBagLocationInTx()`
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints + imports
- `src/modules/inventory/inventory.module.ts` — 5 new providers

### APIs Added
- `POST /v1/inventory/bags/:bagId/transfer-warehouse`
- `POST /v1/inventory/bags/:bagId/assign-order`
- `POST /v1/inventory/bags/:bagId/return`

### Status Transitions Enforced
- transfer-warehouse: `AVAILABLE | RECEIVED | RESERVED → AVAILABLE`
- assign-order: `AVAILABLE → IN_WIP`
- return: `IN_WIP → RETURNED`

### Quality Gates
Build: PASS | Lint: PASS | Tests: 218/218 PASS | Prisma: PASS

---

## Feature 04 — Inventory Adjustment

**Objective:** Close the ledger gap left by Sprint 11.2 — atomically update both `inventory_transactions` and `inventory_bags.dozens_on_hand` in a single DB transaction. Add typed `AdjustmentReasonEnum` with sign-validation business rules.
**Status:** DONE
**Commit:** 499dc8d
**Date:** 2026-06-29
**Tests Added:** 10 (218 → 228)

### Design Decision
Sprint 11.2's generic `AdjustInventoryUseCase` only inserted an `inventory_transactions` record; `inventory_bags.dozens_on_hand` was never updated. Feature 04 closes this gap via `upsertOnHandInTx()` — a Prisma upsert with `{ increment: delta }` executed inside `executeInTransaction`. The new endpoint requires `part_id` because `inventory_bags.part_id` is NOT NULL.

`AdjustmentReasonEnum` is an **application-layer enum only** — not a DB enum. Values: `POSITIVE_CORRECTION | NEGATIVE_CORRECTION | DAMAGE | LOSS | AUDIT_VARIANCE`. Stored as a note prefix `[REASON]` on the transaction record.

### Files Created
- `src/modules/inventory/dto/apply-adjustment.dto.ts`
- `src/modules/inventory/services/inventory-adjustment.service.ts`
- `src/modules/inventory/use-cases/apply-inventory-adjustment/apply-inventory-adjustment.use-case.ts`
- `src/modules/inventory/use-cases/apply-inventory-adjustment/commands/apply-inventory-adjustment.command.ts`
- `src/modules/inventory/use-cases/adjustment.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/repositories/inventory-bags.repository.ts` — added `upsertOnHandInTx()`
- `src/modules/inventory/controllers/inventory.controller.ts` — 1 new endpoint + imports
- `src/modules/inventory/inventory.module.ts` — 2 new providers

### APIs Added
- `POST /v1/inventory/adjustments`

### Business Rules
- `DAMAGE` and `LOSS` must have a negative `dozens_delta`
- `POSITIVE_CORRECTION` must have a positive `dozens_delta`
- `dozens_delta` cannot be zero

### Quality Gates
Build: PASS | Lint: PASS | Tests: 228/228 PASS | Prisma: PASS

---

## Feature 05 — Cycle Count Engine

**Objective:** Implement the full cycle count workflow — open, list, get, add action, close — mapped to `inventory_investigations` with `investigation_type = INVENTORY_VARIANCE`.
**Status:** DONE
**Commit:** 5474570
**Date:** 2026-06-29
**Tests Added:** 9 (228 → 237)

### Design Decision
No dedicated cycle-count table exists in the schema. Feature 05 maps cycle counts to `inventory_investigations` scoped to `InvestigationTypeEnum.INVENTORY_VARIANCE`. All repository queries enforce this type filter, fully isolating cycle-count operations from other investigation types. When actual dozens equals system dozens, no investigation is created and `has_variance: false` is returned.

### Files Created
- `src/modules/inventory/repositories/cycle-count.repository.ts`
- `src/modules/inventory/dto/cycle-count.dto.ts`
- `src/modules/inventory/dto/open-cycle-count.dto.ts`
- `src/modules/inventory/dto/add-cycle-count-action.dto.ts`
- `src/modules/inventory/dto/close-cycle-count.dto.ts`
- `src/modules/inventory/dto/cycle-count-filter.dto.ts`
- `src/modules/inventory/services/cycle-count.service.ts`
- `src/modules/inventory/use-cases/open-cycle-count/open-cycle-count.use-case.ts`
- `src/modules/inventory/use-cases/open-cycle-count/commands/open-cycle-count.command.ts`
- `src/modules/inventory/use-cases/list-cycle-counts/list-cycle-counts.use-case.ts`
- `src/modules/inventory/use-cases/list-cycle-counts/queries/list-cycle-counts.query.ts`
- `src/modules/inventory/use-cases/get-cycle-count/get-cycle-count.use-case.ts`
- `src/modules/inventory/use-cases/get-cycle-count/queries/get-cycle-count.query.ts`
- `src/modules/inventory/use-cases/add-cycle-count-action/add-cycle-count-action.use-case.ts`
- `src/modules/inventory/use-cases/add-cycle-count-action/commands/add-cycle-count-action.command.ts`
- `src/modules/inventory/use-cases/close-cycle-count/close-cycle-count.use-case.ts`
- `src/modules/inventory/use-cases/close-cycle-count/commands/close-cycle-count.command.ts`
- `src/modules/inventory/use-cases/cycle-count.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 5 new endpoints + `Patch` import
- `src/modules/inventory/inventory.module.ts` — 7 new providers

### APIs Added
- `POST /v1/inventory/cycle-counts`
- `GET /v1/inventory/cycle-counts`
- `GET /v1/inventory/cycle-counts/:investigationId`
- `POST /v1/inventory/cycle-counts/:investigationId/actions`
- `PATCH /v1/inventory/cycle-counts/:investigationId/close`

### Quality Gates
Build: PASS | Lint: PASS | Tests: 237/237 PASS | Prisma: PASS

---

## Feature 06 — Warehouse Location Engine

**Objective:** Implement fine-grained warehouse location hierarchy (zone → rack → shelf → bin) for physical bag placement.
**Status:** BLOCKED — no schema tables
**Commit:** —
**Date:** —

**Block reason:** The `warehouses` model in `prisma/schema.prisma` contains only `warehouse_id`, `warehouse_code`, `warehouse_name`, `warehouse_type`, `is_active`. No `warehouse_zones`, `racks`, `shelves`, or `bins` tables exist. `physical_bags.current_warehouse_id` points directly to `warehouses` with no sub-location FK. Adding tables is prohibited under Phase 4 contract (no schema changes, no new migrations).

**Phase 5 resolution:** Add `warehouse_locations` table with hierarchy columns and FK from `physical_bags.location_id`. Migration via superuser.

---

## Feature 07 — Inventory Event Integration

**Objective:** Emit domain events (`InventoryAdjustedEvent`, `BagMovedEvent`, `CycleCountOpenedEvent`) for cross-module reactivity.
**Status:** BLOCKED — no event bus infrastructure
**Commit:** —
**Date:** —

**Block reason:** No event bus, event emitter, or message queue exists in the repository. Codebase search for `event`, `bus`, `emitter`, `queue` across `src/` returned zero matches. `@nestjs/event-emitter` is not a declared dependency. Creating event infrastructure would introduce a new architectural layer — prohibited under Phase 4 contract.

**Phase 5 resolution:** Install `@nestjs/event-emitter`, define event DTOs, emit from `InventoryAdjustmentService` and `PhysicalBagMovementService`.

---

## Feature 08 — Inventory Performance

**Objective:** Expose KPI dashboard endpoints — stock health metrics, cycle count resolution rates, 30-day transaction activity, and physical bag status distribution — using Prisma `groupBy` and `count` aggregate queries on existing tables.
**Status:** DONE
**Commit:** a399864
**Date:** 2026-06-29
**Tests Added:** 6 (237 → 243)

### Files Created
- `src/modules/inventory/dto/inventory-performance.dto.ts`
- `src/modules/inventory/repositories/inventory-performance.repository.ts`
- `src/modules/inventory/services/inventory-performance.service.ts`
- `src/modules/inventory/use-cases/get-inventory-performance-summary/get-inventory-performance-summary.use-case.ts`
- `src/modules/inventory/use-cases/get-bag-status-distribution/get-bag-status-distribution.use-case.ts`
- `src/modules/inventory/use-cases/performance.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 2 new endpoints + imports
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### APIs Added
- `GET /v1/inventory/performance/summary`
- `GET /v1/inventory/performance/bag-status`

### Metrics Surfaced
| Metric Group | Fields |
|---|---|
| Stock health | total_skus, zero_stock_skus, zero_stock_pct |
| Cycle count | total, open, in_review, closed, resolution_rate_pct |
| Transaction activity | count by txn_type over last 30 days |
| Bag status | count per BagStatusEnum value |

### Quality Gates
Build: PASS | Lint: PASS | Tests: 243/243 PASS | Prisma: PASS

---

## Feature 09 — Inventory Reporting

**Objective:** Provide three read-only operational reports — transaction volume by type over a date range, full stock position export per SKU, and variance summary report — for management and warehouse operations use.
**Status:** DONE
**Commit:** ced83d3
**Date:** 2026-06-29
**Tests Added:** 6 (243 → 249)

### Files Created
- `src/modules/inventory/dto/inventory-report.dto.ts`
- `src/modules/inventory/repositories/inventory-reporting.repository.ts`
- `src/modules/inventory/services/inventory-reporting.service.ts`
- `src/modules/inventory/use-cases/get-transaction-volume-report/get-transaction-volume-report.use-case.ts`
- `src/modules/inventory/use-cases/get-stock-position-report/get-stock-position-report.use-case.ts`
- `src/modules/inventory/use-cases/get-variance-report/get-variance-report.use-case.ts`
- `src/modules/inventory/use-cases/reporting.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints + imports
- `src/modules/inventory/inventory.module.ts` — 5 new providers

### APIs Added
- `GET /v1/inventory/reports/transaction-volume` — grouped by `txn_type`, configurable date range (default: last 30 days)
- `GET /v1/inventory/reports/stock-position` — all `inventory_bags` records, optional `warehouse_id` filter, sums total dozens
- `GET /v1/inventory/reports/variances` — all `INVENTORY_VARIANCE` investigations, optional `closure_status` filter

### Quality Gates
Build: PASS | Lint: PASS | Tests: 249/249 PASS | Prisma: PASS

---

## Feature 10 — Inventory Integration

**Objective:** Bridge inventory data with production order context using two existing schema links: `physical_bags.current_order_id` and the `wip_inventory` table. Enables cross-module visibility without schema changes or event bus.
**Status:** DONE
**Commit:** bdc4d3a
**Date:** 2026-06-29
**Tests Added:** 6 (249 → 255)

### Design Decision
Feature 07 (event bus) is permanently blocked. Feature 10 delivers a viable alternative: read-only integration endpoints that surface both physical bag state and WIP ledger balance per production order. Uses two existing FK paths — `physical_bags.current_order_id → production_orders` and `wip_inventory.order_id → production_orders` — entirely within the existing schema.

### Files Created
- `src/modules/inventory/dto/inventory-integration.dto.ts`
- `src/modules/inventory/repositories/inventory-integration.repository.ts`
- `src/modules/inventory/services/inventory-integration.service.ts`
- `src/modules/inventory/use-cases/get-order-inventory-context/get-order-inventory-context.use-case.ts`
- `src/modules/inventory/use-cases/list-wip-positions/list-wip-positions.use-case.ts`
- `src/modules/inventory/use-cases/integration.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 2 new endpoints + imports
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### APIs Added
- `GET /v1/inventory/integration/orders/:orderId` — physical bags (IN_WIP) + WIP balance per part for a production order; includes `total_bags_in_wip` and `total_dozens_in_wip` aggregates
- `GET /v1/inventory/integration/wip` — all `wip_inventory` positions, optional `order_id` filter

### Quality Gates
Build: PASS | Lint: PASS | Tests: 255/255 PASS | Prisma: PASS
