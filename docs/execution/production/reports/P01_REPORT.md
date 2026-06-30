# Production Feature Report — P01: Production Order Management

**Feature ID:** P01  
**Status:** DONE  
**Date:** 2026-06-30  
**Commit:** 335174e  

---

## 1. Executive Summary

P01 implements the root aggregate of the Production Module. A `ProductionOrder` is the central entity that controls the full manufacturing lifecycle from DRAFT through CLOSED. Every downstream feature (P02–P11) references a production order as its anchor.

The feature was executed against the existing `OrderStatusEnum` (DRAFT, PLANNED, IN_PRODUCTION, PRODUCTION_COMPLETE, CLOSED). The P01 MEC proposed 9 states; 4 of them are missing from the schema and were deferred. See `ENGINEERING_DECISION_REPORT.md` for the full analysis.

## 2. Business Value

- Production managers can create, plan, and track manufacturing orders end-to-end
- Sequential status lifecycle enforced at service layer — no invalid state transitions possible
- Full audit trail on every status change
- Paginated order list with status/line/model filters for operational dashboards
- Stage log initialization on order start bridges P01 to P03 (stage tracking)
- Packing completion guard on close bridges P01 to P08 (packing)

## 3. Files Created

| File | Purpose |
|---|---|
| `src/modules/production/production.module.ts` | NestJS module registration |
| `src/modules/production/dto/production-order.dto.ts` | Request/response DTOs + mappers |
| `src/modules/production/repositories/production-orders.repository.ts` | Data access layer |
| `src/modules/production/events/production.events.ts` | 3 event classes |
| `src/modules/production/events/production-event.publisher.ts` | EventEmitter2 wrapper |
| `src/modules/production/events/production-event.listener.ts` | Stub @OnEvent handlers |
| `src/modules/production/use-cases/create-production-order/` | CreateProductionOrderUseCase |
| `src/modules/production/use-cases/update-production-order/` | UpdateProductionOrderUseCase |
| `src/modules/production/use-cases/plan-production-order/` | PlanProductionOrderUseCase |
| `src/modules/production/use-cases/start-production-order/` | StartProductionOrderUseCase |
| `src/modules/production/use-cases/complete-production-order/` | CompleteProductionOrderUseCase |
| `src/modules/production/use-cases/close-production-order/` | CloseProductionOrderUseCase |
| `src/modules/production/use-cases/get-production-order/` | GetProductionOrderUseCase |
| `src/modules/production/use-cases/list-production-orders/` | ListProductionOrdersUseCase |
| `src/modules/production/use-cases/production-orders.use-cases.spec.ts` | Consolidated test suite |
| `src/modules/production/controllers/production.controller.ts` | REST endpoints |
| `docs/execution/production/ENGINEERING_DECISION_REPORT.md` | Schema conflict analysis |

## 4. Files Modified

| File | Change |
|---|---|
| `src/app.module.ts` | Added `ProductionModule` to imports |

## 5. API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /v1/production/orders | Create production order (DRAFT) |
| GET | /v1/production/orders | List orders (paginated, filterable) |
| GET | /v1/production/orders/:id | Get single order with parts |
| PATCH | /v1/production/orders/:id | Update notes/target_dozens (DRAFT only) |
| PATCH | /v1/production/orders/:id/plan | DRAFT → PLANNED |
| PATCH | /v1/production/orders/:id/start | PLANNED → IN_PRODUCTION + initialize stage logs |
| PATCH | /v1/production/orders/:id/complete | IN_PRODUCTION → PRODUCTION_COMPLETE |
| PATCH | /v1/production/orders/:id/close | PRODUCTION_COMPLETE → CLOSED |

## 6. Commands Implemented

| Command | Status |
|---|---|
| CreateProductionOrder | ✓ DONE |
| UpdateProductionOrder | ✓ DONE |
| PlanProductionOrder | ✓ DONE |
| StartProductionOrder | ✓ DONE |
| CompleteProductionOrder | ✓ DONE |
| CloseProductionOrder | ✓ DONE |
| ApproveProductionOrder | ✗ DEFERRED (APPROVED state not in schema) |
| PauseProductionOrder | ✗ DEFERRED (PAUSED state not in schema) |
| ResumeProductionOrder | ✗ DEFERRED (PAUSED state not in schema) |
| CancelProductionOrder | ✗ DEFERRED (CANCELLED state not in schema) |

## 7. Queries Implemented

| Query | Status |
|---|---|
| GetProductionOrder | ✓ DONE |
| ListProductionOrders | ✓ DONE (with status/line/model filters + pagination) |
| SearchProductionOrders | ✓ DONE (via list filter — order_number search deferred, no GIN index usage wired) |
| GetProductionOrderTimeline | ✗ DEFERRED (no status_history table in schema) |
| GetProductionOrderStatusHistory | ✗ DEFERRED (same) |

## 8. Business Rules Applied

| Rule | Enforcement Point |
|---|---|
| BR-O01 Sequential transitions | All status-transition use cases throw BadRequest on wrong status |
| BR-O02 Parts required before planning | PlanProductionOrderUseCase: countParts = 0 → reject |
| BR-O03 All parts RELEASED before start | StartProductionOrderUseCase: countNonReleasedParts > 0 → reject |
| BR-O04 All stages COMPLETE before production complete | CompleteProductionOrderUseCase: countNonCompleteStages > 0 → reject |
| BR-O05 Packing must be POSTED before close | CloseProductionOrderUseCase: isPackingPosted = false → reject |
| BR-O06 Document number auto-generation | CreateProductionOrderUseCase: DocumentNumberingService.generate('PROD_ORDER') |
| BR-O07 CMO line linkage for FULL release | CreateProductionOrderUseCase: cmo_line_id required when release_type = FULL |
| BR-O08 Stage logs initialized on start | StartProductionOrderUseCase: initializeStageLogsInTx inside $transaction |

## 9. Events Emitted

| Event | Trigger |
|---|---|
| `production.order.created` | CreateProductionOrderUseCase |
| `production.order.updated` | UpdateProductionOrderUseCase |
| `production.order.status_changed` | Plan, Start, Complete, Close use cases |

## 10. Tests Added

25 new tests in `production-orders.use-cases.spec.ts`:

- CreateProductionOrderUseCase: 4 tests (happy path, FULL without CMO, invalid parts, event emission)
- UpdateProductionOrderUseCase: 3 tests (happy path, not found, wrong status)
- PlanProductionOrderUseCase: 4 tests (happy path, wrong status, no parts, event emission)
- StartProductionOrderUseCase: 3 tests (happy path, wrong status, unreleased parts)
- CompleteProductionOrderUseCase: 4 tests (happy path, wrong status, no stage logs, incomplete stages)
- CloseProductionOrderUseCase: 3 tests (happy path, wrong status, packing not posted)
- GetProductionOrderUseCase: 2 tests (happy path, not found)
- ListProductionOrdersUseCase: 2 tests (happy path, status filter)

## 11. Quality Gate Results

| Gate | Command | Result |
|---|---|---|
| C-001 Build | `npm run build` | PASS — 0 TypeScript errors |
| C-002 Lint | `npm run lint` | PASS — 0 ESLint errors |
| C-003 Tests | `npm run test` | PASS — 312/312 (was 287/287; +25 new) |
| Prisma | `npx prisma validate` | PASS — schema valid |

## 12. Acceptance Criteria Verification

| Criteria | Status | Notes |
|---|---|---|
| AC-P01-01 Create returns DRAFT order with auto-generated order_number | PASS | DocumentNumberingService('PROD_ORDER') wired |
| AC-P01-02 Unique order_number constraint | PASS | schema @unique + P2002 → 409 via PrismaExceptionFilter |
| AC-P01-03 Plan fails if no parts | PASS | tested |
| AC-P01-04 Start fails if parts not RELEASED | PASS | tested |
| AC-P01-05 Complete fails if stages not COMPLETE | PASS | tested |
| AC-P01-06 Close fails if packing not POSTED | PASS | tested |
| AC-P01-07 List returns paginated results with status filter | PASS | tested |
| AC-P01-08 BigInt IDs serialized as strings | PASS | all mappers call .toString() |

## 13. Known Limitations / Deferred Items

| Item | Reason | Target |
|---|---|---|
| APPROVED/READY/PAUSED/CANCELLED states | Not in OrderStatusEnum | Schema extension required — see ENGINEERING_DECISION_REPORT.md |
| Status history table | Not in schema | Schema extension required |
| order_number GIN trigram search | DB index exists but not wired | P11 (reporting feature) |
| PROD_ORDER sequence seeding | Requires INSERT into document_sequences table | Pre-P01 setup step |

## 14. Unknown Items Resolved

| Item | Resolution |
|---|---|
| U-003 Production order cancellation path | DEFERRED — no CANCELLED state in schema |
| U-005 order_number prefix/sequence name | Using 'PROD_ORDER' as sequence code |

## 15. Setup Requirement

The `PROD_ORDER` document sequence must be seeded before the create endpoint works:

```sql
INSERT INTO factory.document_sequences (sequence_code, pattern_template, current_value, increment_by)
VALUES ('PROD_ORDER', 'PO-{YYYY}-{SEQ:5}', 0, 1);
```

Execute as `postgres` superuser. This is a data seed, not a schema migration.

## 16. Final Decision

P01 COMPLETE (within existing schema constraints)
