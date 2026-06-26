# Sprint 13 — Production Orders

**Version target:** v0.6.0-production-foundation
**Prerequisite:** Sprint 12 (CMO) complete

---

## Objectives

Implement the production order system. Production orders are work orders created from CMO line items. Each production order is assigned to a production line, tracks stage-by-stage progress, and drives inventory consumption.

---

## Scope

### New Domain Module: `src/modules/production/`

**Schema entities:**
- `production_orders` — work orders linked to CMO line items
- `production_order_stages` — stage-level status per production order
- `production_tracking` — time-based stage completion records

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `CreateProductionOrderUseCase` | Create production order from CMO line item |
| `GetProductionOrderUseCase` | Retrieve order with all stage statuses |
| `ListProductionOrdersUseCase` | Paginated, filterable by line/status/date |
| `AssignToProductionLineUseCase` | Assign order to a production line |
| `AdvanceStageUseCase` | Mark current stage complete, advance to next |
| `CompleteProductionOrderUseCase` | Mark order fully complete; trigger inventory consumption |
| `CancelProductionOrderUseCase` | Cancel order; release any stock reservations |
| `GetProductionLineCapacityUseCase` | Query current WIP per production line |

---

## Architecture Constraints

- `CompleteProductionOrderUseCase` must atomically: mark order complete + consume reserved inventory (via InventoryModule service) + emit audit events
- Stage advancement must validate that the previous stage is complete before advancing
- A production order cannot be created for a cancelled CMO line item
- `AdvanceStageUseCase` must check that the production line is active
- All endpoints require `@Roles(UserRole.system_admin, UserRole.production_manager)`
- Cross-module: `ProductionModule` imports `InventoryModule` to call `InventoryService.consumeReservation()`

---

## Testing Requirements

- All 8 use cases must have test suites
- `CompleteProductionOrderUseCase` tests: success, insufficient reservation, cancelled order rejection
- Stage advancement tests: valid advancement, out-of-order rejection, already-complete rejection
- Minimum new tests: 40
- All existing tests must continue passing

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0
- [ ] `npm run build` succeeds
- [ ] `npm run test` shows 0 failures
- [ ] Production order completion atomically consumes inventory
- [ ] Stage order is enforced — cannot skip stages
- [ ] Cancelled orders cannot be advanced
- [ ] ADR-028 written (Production Order Architecture)

---

## Exit Criteria

Sprint 13 complete when all acceptance criteria checked, quality gates pass, `v0.6.0-production-foundation` released.
