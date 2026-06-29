# Phase 4 Feature Log

---

## Feature 01 — Inventory Availability Engine

**Status:** DONE  
**Commit:** c937069  
**Date:** 2026-06-29  
**Tests Added:** 7 (204 total → from 197)  
**Suites Added:** 1

### Files Created
- `src/modules/inventory/dto/bag-availability.dto.ts`
- `src/modules/inventory/dto/ledger-availability.dto.ts`
- `src/modules/inventory/services/inventory-availability.service.ts`
- `src/modules/inventory/use-cases/get-bag-availability/queries/get-bag-availability.query.ts`
- `src/modules/inventory/use-cases/get-bag-availability/get-bag-availability.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-availability/queries/get-warehouse-availability.query.ts`
- `src/modules/inventory/use-cases/get-warehouse-availability/get-warehouse-availability.use-case.ts`
- `src/modules/inventory/use-cases/get-model-availability/queries/get-model-availability.query.ts`
- `src/modules/inventory/use-cases/get-model-availability/get-model-availability.use-case.ts`
- `src/modules/inventory/use-cases/availability.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### Endpoints Added
- `GET /v1/inventory/availability/bags/:bagId`
- `GET /v1/inventory/availability/warehouse/:warehouseId`
- `GET /v1/inventory/availability/model/:modelId`

### Quality Gates
Build: PASS | Lint: PASS | Tests: 204/204 PASS | Prisma: PASS

---

## Feature 02 — Inventory Balance Engine

**Status:** DONE  
**Commit:** bc6f56a  
**Date:** 2026-06-29  
**Tests Added:** 6 (210 total)  
**Suites Added:** 1

### Files Created
- `src/modules/inventory/dto/warehouse-balance-summary.dto.ts`
- `src/modules/inventory/dto/model-balance-summary.dto.ts`
- `src/modules/inventory/dto/balance-snapshot.dto.ts`
- `src/modules/inventory/services/inventory-balance.service.ts`
- `src/modules/inventory/use-cases/get-warehouse-balance-summary/queries/get-warehouse-balance-summary.query.ts`
- `src/modules/inventory/use-cases/get-warehouse-balance-summary/get-warehouse-balance-summary.use-case.ts`
- `src/modules/inventory/use-cases/get-model-balance-summary/queries/get-model-balance-summary.query.ts`
- `src/modules/inventory/use-cases/get-model-balance-summary/get-model-balance-summary.use-case.ts`
- `src/modules/inventory/use-cases/get-balance-snapshot/queries/get-balance-snapshot.query.ts`
- `src/modules/inventory/use-cases/get-balance-snapshot/get-balance-snapshot.use-case.ts`
- `src/modules/inventory/use-cases/balance.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### Endpoints Added
- `GET /v1/inventory/balance/warehouse/:warehouseId`
- `GET /v1/inventory/balance/model/:modelId`
- `GET /v1/inventory/balance/snapshot`

### Quality Gates
Build: PASS | Lint: PASS | Tests: 210/210 PASS | Prisma: PASS

---

## Feature 03 — Physical Bag Movement

**Status:** DONE  
**Commit:** 0600f54  
**Date:** 2026-06-29  
**Tests Added:** 10 (218 total)  
**Suites Added:** 1

### Files Created
- `src/modules/inventory/dto/transfer-to-warehouse.dto.ts`
- `src/modules/inventory/dto/assign-to-order.dto.ts`
- `src/modules/inventory/dto/return-from-order.dto.ts`
- `src/modules/inventory/services/physical-bag-movement.validator.ts`
- `src/modules/inventory/services/physical-bag-movement.service.ts`
- `src/modules/inventory/use-cases/transfer-bag-to-warehouse/commands/transfer-bag-to-warehouse.command.ts`
- `src/modules/inventory/use-cases/transfer-bag-to-warehouse/transfer-bag-to-warehouse.use-case.ts`
- `src/modules/inventory/use-cases/assign-bag-to-order/commands/assign-bag-to-order.command.ts`
- `src/modules/inventory/use-cases/assign-bag-to-order/assign-bag-to-order.use-case.ts`
- `src/modules/inventory/use-cases/return-bag-from-order/commands/return-bag-from-order.command.ts`
- `src/modules/inventory/use-cases/return-bag-from-order/return-bag-from-order.use-case.ts`
- `src/modules/inventory/use-cases/movement.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/repositories/physical-bags.repository.ts` — added createMovementInTx, updateBagLocationInTx
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints
- `src/modules/inventory/inventory.module.ts` — 5 new providers

### Endpoints Added
- `POST /v1/inventory/bags/:bagId/transfer-warehouse`
- `POST /v1/inventory/bags/:bagId/assign-order`
- `POST /v1/inventory/bags/:bagId/return`

### Status Transitions
- transfer-warehouse: AVAILABLE | RECEIVED | RESERVED → AVAILABLE
- assign-order: AVAILABLE → IN_WIP
- return: IN_WIP → RETURNED

### Quality Gates
Build: PASS | Lint: PASS | Tests: 218/218 PASS | Prisma: PASS

---

## Feature 04 — Inventory Adjustment

**Status:** DONE  
**Commit:** 499dc8d  
**Date:** 2026-06-29  
**Tests Added:** 10 (228 total)  
**Suites Added:** 1

### Design Decision
Sprint 11.2's `AdjustInventoryUseCase` only wrote `inventory_transactions` — it never updated `inventory_bags.dozens_on_hand`. Feature 04 closes this gap by atomically writing both the transaction record and updating the ledger via `upsertOnHandInTx()`. The new endpoint requires `part_id` (NOT NULL constraint on `inventory_bags`), unlike the legacy adjust endpoint.

### Files Created
- `src/modules/inventory/dto/apply-adjustment.dto.ts` — `ApplyAdjustmentDto`, `AdjustmentReasonEnum`
- `src/modules/inventory/use-cases/apply-inventory-adjustment/commands/apply-inventory-adjustment.command.ts`
- `src/modules/inventory/use-cases/apply-inventory-adjustment/apply-inventory-adjustment.use-case.ts`
- `src/modules/inventory/services/inventory-adjustment.service.ts`
- `src/modules/inventory/use-cases/adjustment.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/repositories/inventory-bags.repository.ts` — added `upsertOnHandInTx()`
- `src/modules/inventory/controllers/inventory.controller.ts` — 1 new endpoint
- `src/modules/inventory/inventory.module.ts` — 2 new providers

### Endpoints Added
- `POST /v1/inventory/adjustments`

### Business Rules
- `AdjustmentReasonEnum`: POSITIVE_CORRECTION | NEGATIVE_CORRECTION | DAMAGE | LOSS | AUDIT_VARIANCE
- DAMAGE and LOSS must have negative delta; POSITIVE_CORRECTION must have positive delta
- Delta cannot be zero
- Notes prefixed with `[REASON]` automatically

### Quality Gates
Build: PASS | Lint: PASS | Tests: 228/228 PASS | Prisma: PASS

---

## Feature 05 — Cycle Count Engine

**Status:** DONE  
**Commit:** 5474570  
**Date:** 2026-06-29  
**Tests Added:** 9 (237 total)  
**Suites Added:** 1

### Design Decision
No dedicated cycle-count tables in schema. Mapped to `inventory_investigations` with `investigation_type = INVENTORY_VARIANCE`. All repository queries are scoped to this type, fully isolating cycle count operations. If actual_dozens equals system_dozens, no investigation is created and `has_variance: false` is returned.

### Files Created
- `src/modules/inventory/repositories/cycle-count.repository.ts`
- `src/modules/inventory/dto/cycle-count.dto.ts`
- `src/modules/inventory/dto/open-cycle-count.dto.ts`
- `src/modules/inventory/dto/add-cycle-count-action.dto.ts`
- `src/modules/inventory/dto/close-cycle-count.dto.ts`
- `src/modules/inventory/dto/cycle-count-filter.dto.ts`
- `src/modules/inventory/services/cycle-count.service.ts`
- `src/modules/inventory/use-cases/open-cycle-count/open-cycle-count.use-case.ts`
- `src/modules/inventory/use-cases/list-cycle-counts/list-cycle-counts.use-case.ts`
- `src/modules/inventory/use-cases/get-cycle-count/get-cycle-count.use-case.ts`
- `src/modules/inventory/use-cases/add-cycle-count-action/add-cycle-count-action.use-case.ts`
- `src/modules/inventory/use-cases/close-cycle-count/close-cycle-count.use-case.ts`
- `src/modules/inventory/use-cases/cycle-count.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 5 new endpoints
- `src/modules/inventory/inventory.module.ts` — 7 new providers

### Endpoints Added
- `POST /v1/inventory/cycle-counts`
- `GET /v1/inventory/cycle-counts`
- `GET /v1/inventory/cycle-counts/:investigationId`
- `POST /v1/inventory/cycle-counts/:investigationId/actions`
- `PATCH /v1/inventory/cycle-counts/:investigationId/close`

### Quality Gates
Build: PASS | Lint: PASS | Tests: 237/237 PASS | Prisma: PASS

---

## Feature 06 — Warehouse Location Engine

**Status:** BLOCKED  
**Date:** 2026-06-29

**Reason:** No zone/rack/shelf/bin tables in `prisma/schema.prisma`. The `warehouses` model has only (warehouse_id, name, type, address, active, created_at). Implementing location hierarchy requires new schema tables — PROHIBITED by Phase 4 contract.

---

## Feature 07 — Inventory Event Integration

**Status:** BLOCKED  
**Date:** 2026-06-29

**Reason:** No event bus infrastructure in the repository. Full codebase glob for `src/**/*event*`, `src/**/*bus*`, `src/**/*emitter*` returned empty. Creating an event bus would be redesigning architecture — PROHIBITED by Phase 4 contract.

---

## Feature 08 — Inventory Performance

**Status:** DONE  
**Commit:** a399864  
**Date:** 2026-06-29  
**Tests Added:** 6 (243 total)  
**Suites Added:** 1

### Files Created
- `src/modules/inventory/dto/inventory-performance.dto.ts` — TransactionActivityDto, BagStatusDistributionDto, StockHealthDto, CycleCountMetricsDto, InventoryPerformanceSummaryDto
- `src/modules/inventory/repositories/inventory-performance.repository.ts`
- `src/modules/inventory/services/inventory-performance.service.ts`
- `src/modules/inventory/use-cases/get-inventory-performance-summary/get-inventory-performance-summary.use-case.ts`
- `src/modules/inventory/use-cases/get-bag-status-distribution/get-bag-status-distribution.use-case.ts`
- `src/modules/inventory/use-cases/performance.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 2 new endpoints
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### Endpoints Added
- `GET /v1/inventory/performance/summary`
- `GET /v1/inventory/performance/bag-status`

### KPIs Surfaced
- Stock health: total SKUs, zero-stock SKUs, zero-stock percentage
- Cycle count metrics: total, open, in-review, closed, resolution rate
- Transaction activity: count by txn_type over last 30 days

### Quality Gates
Build: PASS | Lint: PASS | Tests: 243/243 PASS | Prisma: PASS

---

## Feature 10 — Inventory Integration

**Status:** DONE  
**Commit:** bdc4d3a  
**Date:** 2026-06-29  
**Tests Added:** 6 (255 total)  
**Suites Added:** 1

### Design Decision
No event bus or zone/rack tables. Integration was implemented as read-only cross-module bridge endpoints using two existing schema connections: `physical_bags.current_order_id` (links bags to production orders) and the `wip_inventory` table (tracks dozens in WIP per order+part). Both queries are pure reads from existing tables — no schema changes.

### Files Created
- `src/modules/inventory/dto/inventory-integration.dto.ts` — OrderBagSummaryDto, WipPositionDto, OrderInventoryContextDto, WipPositionsQueryDto
- `src/modules/inventory/repositories/inventory-integration.repository.ts`
- `src/modules/inventory/services/inventory-integration.service.ts`
- `src/modules/inventory/use-cases/get-order-inventory-context/get-order-inventory-context.use-case.ts`
- `src/modules/inventory/use-cases/list-wip-positions/list-wip-positions.use-case.ts`
- `src/modules/inventory/use-cases/integration.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 2 new endpoints
- `src/modules/inventory/inventory.module.ts` — 4 new providers

### Endpoints Added
- `GET /v1/inventory/integration/orders/:orderId` — physical bags (IN_WIP) + WIP balance for a production order
- `GET /v1/inventory/integration/wip` — all WIP positions, optional order_id filter

### Quality Gates
Build: PASS | Lint: PASS | Tests: 255/255 PASS | Prisma: PASS

---

## Feature 09 — Inventory Reporting

**Status:** DONE  
**Commit:** ced83d3  
**Date:** 2026-06-29  
**Tests Added:** 6 (249 total)  
**Suites Added:** 1

### Files Created
- `src/modules/inventory/dto/inventory-report.dto.ts` — all report and query DTOs
- `src/modules/inventory/repositories/inventory-reporting.repository.ts`
- `src/modules/inventory/services/inventory-reporting.service.ts`
- `src/modules/inventory/use-cases/get-transaction-volume-report/get-transaction-volume-report.use-case.ts`
- `src/modules/inventory/use-cases/get-stock-position-report/get-stock-position-report.use-case.ts`
- `src/modules/inventory/use-cases/get-variance-report/get-variance-report.use-case.ts`
- `src/modules/inventory/use-cases/reporting.use-cases.spec.ts`

### Files Modified
- `src/modules/inventory/controllers/inventory.controller.ts` — 3 new endpoints
- `src/modules/inventory/inventory.module.ts` — 5 new providers

### Endpoints Added
- `GET /v1/inventory/reports/transaction-volume` — grouped by txn_type, configurable date range (default: last 30 days)
- `GET /v1/inventory/reports/stock-position` — all SKU positions, optional warehouse_id filter, sums total dozens
- `GET /v1/inventory/reports/variances` — INVENTORY_VARIANCE investigations, optional closure_status filter

### Quality Gates
Build: PASS | Lint: PASS | Tests: 249/249 PASS | Prisma: PASS

---
