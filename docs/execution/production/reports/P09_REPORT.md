# P09 — Finished Goods Management Engine: Completion Report

| Field | Value |
|---|---|
| **Feature** | P09 — Finished Goods Management |
| **Status** | COMPLETE |
| **Commit** | 0a392bb |
| **Date** | 2026-06-30 |
| **Tests** | 436/436 PASS (17 new) |
| **Build** | PASS |
| **Lint** | PASS (0 errors) |
| **Prisma Validate** | PASS |

---

## Executive Summary

P09 implements the Finished Goods Management Engine. FG bags are created from POSTED packing orders via an explicit `CreateFinishedGoods` command (superseding BR-FG01, per P09 MEC). For FULL orders, `customer_id` is auto-derived via the CMO chain; for PARTIAL orders, the caller provides it (ED-P09-003). `warehouse_id` is always caller-provided (ED-P09-004). No additional inventory transaction is created — the PACKING transaction from P08 already represents the production-to-FG movement (ED-P09-005). The schema gap (`finished_goods_bags` has no `packing_order_id`) is documented in ED-P09-001.

---

## Business Value

- Closes the gap between POSTED packing orders and the FG inventory register
- `finished_goods_bags` is now populated as the authoritative FG inventory record
- Full query surface: by-ID, filtered list, paginated history, model summary, dashboard
- Event chain: `finished_goods.created` → `finished_goods.available` → `finished_goods.summary.updated`
- Full audit trail via AuditService

---

## Files Created

| File | Purpose |
|---|---|
| `docs/execution/production/ENGINEERING_DECISION_REPORT_P09.md` | 7 engineering decisions |
| `src/modules/production/dto/production-finished-goods.dto.ts` | Command/query DTOs, response types, mapper |
| `src/modules/production/repositories/production-finished-goods.repository.ts` | All FG DB operations incl. CMO chain traversal, dashboard aggregates |
| `src/modules/production/use-cases/create-finished-goods/create-finished-goods.use-case.ts` | CreateFinishedGoods (ED-P09-001 through 007) |
| `src/modules/production/use-cases/get-finished-goods/get-finished-goods.use-case.ts` | GetFinishedGoods by fg_bag_id |
| `src/modules/production/use-cases/list-finished-goods/list-finished-goods.use-case.ts` | ListFinishedGoods with model/customer/warehouse filters |
| `src/modules/production/use-cases/get-finished-goods-history/get-finished-goods-history.use-case.ts` | Paginated FG history (limit capped at 100) |
| `src/modules/production/use-cases/get-finished-goods-summary/get-finished-goods-summary.use-case.ts` | FG summary aggregated by model_id |
| `src/modules/production/use-cases/finished-goods-dashboard/finished-goods-dashboard.use-case.ts` | Dashboard: totals + by_model + by_customer |
| `src/modules/production/use-cases/production-finished-goods.use-cases.spec.ts` | 17 unit tests across 6 suites |
| `src/modules/production/controllers/production-finished-goods.controller.ts` | 6 REST endpoints |

## Files Modified

| File | Change |
|---|---|
| `src/modules/production/events/production.events.ts` | Added 3 FG events |
| `src/modules/production/events/production-event.publisher.ts` | Added 3 emit methods |
| `src/modules/production/events/production-event.listener.ts` | Added handlers PROD-017 through PROD-019 |
| `src/modules/production/production.module.ts` | Added `ProductionFinishedGoodsRepository`, 1 command use case, 5 query use cases, `ProductionFinishedGoodsController` |

---

## Commands

| Command | Endpoint | Roles | Business Rules |
|---|---|---|---|
| CreateFinishedGoods | `POST /v1/production/finished-goods` | SYSTEM_ADMIN, ADMIN, MANAGER, SUPERVISOR | ED-P09-001 through 007 |

## Queries

| Query | Endpoint | Roles |
|---|---|---|
| GetFinishedGoodsSummary | `GET /v1/production/finished-goods/summary?model_id=X` | All authenticated |
| GetFinishedGoodsHistory | `GET /v1/production/finished-goods/history` | All authenticated |
| FinishedGoodsDashboard | `GET /v1/production/finished-goods/dashboard` | All authenticated |
| ListFinishedGoods | `GET /v1/production/finished-goods` | All authenticated |
| GetFinishedGoods | `GET /v1/production/finished-goods/:id` | All authenticated |

---

## Business Rules Enforced

| Rule | Where Enforced |
|---|---|
| BR-FG01 superseded by P09 MEC | ED-P09-002 — standalone CreateFinishedGoods command |
| BR-FG02: customer_id from CMO chain for FULL orders | `CreateFinishedGoodsUseCase` via `findCMOCustomerId` |
| BR-FG02: caller provides customer_id for PARTIAL orders | `CreateFinishedGoodsUseCase` validation |
| BR-FG03: caller provides warehouse_id | `CreateFinishedGoodsUseCase` validates warehouse exists |
| Packing order must be POSTED | `CreateFinishedGoodsUseCase` validates status === POSTED |

---

## Finished Goods Flow

```
Packing Order POSTED (P08)
  → CreateFinishedGoods (P09)
      → Load packing order status — must be POSTED
      → Load packing order with production order (for model_id, cmo_line_id)
      → Resolve customer_id:
          FULL order (cmo_line_id present): CMO chain → customer_id (auto-derived)
          PARTIAL order (no cmo_line_id): caller provides customer_id (validated)
      → Validate warehouse exists (caller provides warehouse_id)
      → dozens_qty defaults to assembled_dozens (caller may override)
      → finished_goods_bags.create
      → Emit: production.finished_goods.created
          → Listener emits: production.finished_goods.available
      → Emit: production.finished_goods.summary.updated
      → AuditService.log
```

---

## Event Integration

| Event | Published When |
|---|---|
| `production.finished_goods.created` | After CreateFinishedGoods |
| `production.finished_goods.available` | From listener on `finished_goods.created` (PROD-017) |
| `production.finished_goods.summary.updated` | After CreateFinishedGoods |

---

## Tests Added (17 new — 6 suites)

| Suite | Tests | Coverage |
|---|---|---|
| `CreateFinishedGoodsUseCase` | 7 | Happy path PARTIAL, happy path FULL (CMO chain), not found, not POSTED, customer not found, warehouse not found, PARTIAL with no customer_id |
| `GetFinishedGoodsUseCase` | 2 | Happy path, not found |
| `ListFinishedGoodsUseCase` | 2 | Filtered list, empty result |
| `GetFinishedGoodsHistoryUseCase` | 2 | Paginated, limit capped at 100 |
| `GetFinishedGoodsSummaryUseCase` | 2 | Summary aggregated, zero totals |
| `FinishedGoodsDashboardUseCase` | 2 | With data, empty |

---

## Engineering Decisions Summary

| ID | Decision |
|---|---|
| ED-P09-001 | No `packing_order_id` on `finished_goods_bags` — no packing linkage stored; `cmo_line_id` used for FULL orders only |
| ED-P09-002 | BR-FG01 superseded by P09 MEC — standalone CreateFinishedGoods command implemented |
| ED-P09-003 | `customer_id` resolved from CMO chain for FULL orders; caller provides for PARTIAL |
| ED-P09-004 | `warehouse_id` always caller-provided — no schema source (BR-FG03 [UNKNOWN]) |
| ED-P09-005 | No inventory transaction created — PACKING txn from P08 covers the movement; `finished_goods_bags` IS the FG register |
| ED-P09-006 | `dozens_qty` defaults to `assembled_dozens`; no upper-bound enforcement (ED-P09-001 prevents cumulative tracking) |
| ED-P09-007 | `session_id` left null — purpose unknown; no sessions concept in current schema |

---

## Deferred Integration Points

| Integration | Target Phase | Trigger |
|---|---|---|
| FG-specific inventory TxnTypeEnum (e.g., `FG_RECEIPT`) | Schema migration | Add TxnTypeEnum value + migration |
| `packing_order_id` on `finished_goods_bags` | Schema migration | Add column + unique constraint |
| FG warehouse auto-derivation (BR-FG03) | Business clarification | Define FG warehouse designation mechanism |
| Four-eyes approval on CreateFinishedGoods | MEC revision | Add ApproveFG to CQRS contract if required |

---

## Risks

1. **No packing linkage**: Multiple FG bags can be created from the same packing order. Cumulative quantity exceeding `assembled_dozens` is not enforced (ED-P09-006).
2. **CMO customer auto-derive** only works when production order has `cmo_line_id` — PARTIAL orders require manual customer specification.
3. **Warehouse assignment** is unconstrained — any valid warehouse can be used; no FG-specific warehouse type enforcement.

---

## Final Decision

P09 COMPLETE
