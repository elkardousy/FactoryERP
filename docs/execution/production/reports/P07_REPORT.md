# P07 — Return to Warehouse Engine: Completion Report

| Field | Value |
|---|---|
| **Feature** | P07 — Return to Warehouse |
| **Status** | COMPLETE |
| **Commit** | e066a53 |
| **Date** | 2026-06-30 |
| **Tests** | 392/392 PASS (16 new) |
| **Build** | PASS |
| **Lint** | PASS (0 errors) |
| **Prisma Validate** | PASS |

---

## Executive Summary

P07 implements the Return to Warehouse engine, allowing unused production material (WIP) to be returned from a production order back to a destination warehouse. Returns are committed atomically: the `wip_inventory` balance is decremented, a `return_transactions` record is created, and a `RETURN` inventory transaction is recorded in a single optimistic-locked database transaction. When WIP reaches zero for a part, its `production_order_parts.status` is set to `RETURNED`.

The schema supports part-level returns only (no `bag_id` on `return_transactions`). Bag-level tracking and the `CompleteReturn` lifecycle are deferred pending schema extensions.

---

## Business Value

- Enables return of unused material without corrupting inventory counts
- Enforces WIP availability check before allowing returns (no over-return)
- Automatically marks parts as RETURNED when all WIP is cleared (BR-Rt05)
- Full RETURN audit trail via `inventory_transactions` (BR-Rt03)
- Events published for downstream integration

---

## Files Created

| File | Purpose |
|---|---|
| `src/modules/production/repositories/production-returns.repository.ts` | Atomic return + WIP decrement with optimistic lock |
| `src/modules/production/dto/production-returns.dto.ts` | Command/query DTOs, response DTOs, mappers |
| `src/modules/production/use-cases/create-return/create-return.use-case.ts` | CreateReturn command (BR-Rt03, BR-Rt05) |
| `src/modules/production/use-cases/get-return/get-return.use-case.ts` | Single return query |
| `src/modules/production/use-cases/list-returns/list-returns.use-case.ts` | Filtered list query |
| `src/modules/production/use-cases/get-return-history/get-return-history.use-case.ts` | Paginated history query |
| `src/modules/production/use-cases/get-return-summary/get-return-summary.use-case.ts` | Summary aggregated by part |
| `src/modules/production/use-cases/production-returns.use-cases.spec.ts` | 16 unit tests across 5 suites |
| `src/modules/production/controllers/production-returns.controller.ts` | 5 REST endpoints |
| `docs/execution/production/ENGINEERING_DECISION_REPORT_P07.md` | 7 engineering decisions |

## Files Modified

| File | Change |
|---|---|
| `src/modules/production/events/production.events.ts` | Added `ProductionMaterialReturnedEvent`, `ProductionReturnSummaryUpdatedEvent` |
| `src/modules/production/events/production-event.publisher.ts` | Added `emitMaterialReturned`, `emitReturnSummaryUpdated` |
| `src/modules/production/events/production-event.listener.ts` | Added `onMaterialReturned` (PROD-011), `onReturnSummaryUpdated` (PROD-012) |
| `src/modules/production/production.module.ts` | Added `ProductionReturnsRepository`, `CreateReturnUseCase`, 4 query use cases, `ProductionReturnsController` |

---

## Commands

| Command | Endpoint | Roles | Business Rules |
|---|---|---|---|
| CreateReturn | `POST /v1/production/returns` | ADMIN, MGR, SUPER, SUPERVISOR | BR-Rt03, BR-Rt05, ED-P07-005, ED-P07-007 |

## Queries

| Query | Endpoint | Roles |
|---|---|---|
| ListReturns | `GET /v1/production/returns` | All authenticated |
| GetReturnSummary | `GET /v1/production/returns/summary?order_id=X` | All authenticated |
| GetReturnHistory | `GET /v1/production/returns/history?order_id=X` | All authenticated |
| GetReturn | `GET /v1/production/returns/:id` | All authenticated |

---

## Business Rules Enforced

| Rule | Where Enforced |
|---|---|
| Order must be IN_PRODUCTION or PRODUCTION_COMPLETE (ED-P07-005) | `CreateReturnUseCase` |
| Part must belong to order (ED-P07-001) | `CreateReturnUseCase` |
| Part must be in RELEASED status | `CreateReturnUseCase` |
| WIP must be sufficient (dozens_returned ≤ wip_inventory.dozens_in_wip) | `ProductionReturnsRepository.createReturnAndRecord` |
| BR-Rt03: RETURN inventory transaction created atomically | `ProductionReturnsRepository.createReturnAndRecord` |
| BR-Rt05: Part status → RETURNED when WIP zeroed | `ProductionReturnsRepository.createReturnAndRecord` |
| ED-P07-007: Optimistic lock, 3 retries | `ProductionReturnsRepository.createReturnAndRecord` |

---

## Return Flow

```
(Order IN_PRODUCTION or PRODUCTION_COMPLETE)
  → Part belongs to order and is RELEASED
  → Repository (optimistic lock loop, up to 3 retries):
      → Read wip_inventory WHERE (order_id, part_id)
      → Validate: dozens_in_wip ≥ dozens_returned
      → Transaction:
          → wip_inventory.updateMany WHERE wip_id + version (optimistic lock)
          → If count=0: retry (version conflict)
          → return_transactions.create
          → inventory_transactions.create (txn_type=RETURN, txn_reference=RTN-{orderId}-P{partId}-R{returnId})
          → If newWip ≤ 0: production_order_parts.updateMany status=RETURNED (BR-Rt05)
  → emitMaterialReturned + emitReturnSummaryUpdated
  → AuditService.log
```

---

## Event Integration

| Event | Published When |
|---|---|
| `production.material.returned` | After each successful return |
| `production.return.summary.updated` | After each successful return |
| Consumed: `production.quality.recorded` | Existing handler (PROD-009) |
| Consumed: `production.quality.summary.updated` | Existing handler (PROD-010) |

---

## Tests Added

16 tests across 5 suites:
- `CreateReturnUseCase` (8): happy path, order not found, CLOSED order, part not in order, part PENDING, insufficient WIP (from repo), WIP zeroed → part RETURNED, PRODUCTION_COMPLETE allowed
- `GetReturnUseCase` (2): happy path, not found
- `ListReturnsUseCase` (2): happy path, empty result
- `GetReturnHistoryUseCase` (2): happy path, limit capped at 100
- `GetReturnSummaryUseCase` (2): aggregation by part, order not found

---

## Engineering Decisions Summary

| ID | Decision |
|---|---|
| ED-P07-001 | No `bag_id` — part-level validation only via `wip_inventory` |
| ED-P07-002 | BR-Rt04 (bag status revert) deferred — no `bag_id` linkage |
| ED-P07-003 | CompleteReturn deferred — no status lifecycle in `return_transactions` |
| ED-P07-004 | No `notes` field — return reason not capturable |
| ED-P07-005 | Valid statuses: IN_PRODUCTION or PRODUCTION_COMPLETE |
| ED-P07-006 | BR-Rt05: part status → RETURNED when WIP reaches 0 |
| ED-P07-007 | Optimistic lock on `wip_inventory.version` with 3-retry pattern |

---

## Deferred Integration Points

| Integration | Target Phase | Trigger |
|---|---|---|
| Bag-level return tracking | Schema extension | Need `bag_id` on `return_transactions` |
| Bag status revert (BR-Rt04) | Schema extension | Same as above |
| CompleteReturn lifecycle | Schema extension | Need `status`, `completed_at`, `completed_by` on `return_transactions` |
| `production.return.completed` event | Schema extension | Same as above |

---

## Risks

1. **No bag-level attribution**: Returned bags cannot be identified until schema extends. Physical bag status will not automatically revert.
2. **Over-return race condition**: Two concurrent returns could both pass the WIP check before either commits. Mitigated by optimistic lock: the losing writer sees `updateMany count=0` and retries; on retry it re-reads WIP and may throw `BadRequestException` if now insufficient.

---

## Final Decision

P07 COMPLETE
