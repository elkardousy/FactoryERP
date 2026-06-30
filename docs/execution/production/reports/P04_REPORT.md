# P04 — WIP Inventory Management Engine: Completion Report

| Field | Value |
|---|---|
| **Feature** | P04 — WIP Inventory Management |
| **Status** | COMPLETE |
| **Commit** | cf3e521 |
| **Date** | 2026-06-30 |
| **Tests** | 360/360 PASS (14 new) |
| **Build** | PASS |
| **Lint** | PASS (0 errors) |
| **Prisma Validate** | PASS |

---

## Business Capabilities Delivered

| Capability | Implementation | Notes |
|---|---|---|
| Event-driven WIP update on stage completion | `ProcessStageCompletionWipUseCase` | Consumes `production.stage.completed` |
| WIP upsert with optimistic locking | `ProductionWipRepository.upsertAndRecordTransaction` | BR-W01/W03; 3-retry loop |
| Atomic WIP + inventory transaction | `executeInTransaction` in repository | BR-Inv03 |
| WIP balance per (order, part) | `wip_inventory` table | Unique on (order_id, part_id) |
| Get single WIP entry | `GetWipUseCase` | 404 on not found |
| List WIP entries (paginated, filterable) | `ListWipUseCase` | Filter by order_id or line_id; limit capped at 100 |
| WIP transaction history | `GetWipHistoryUseCase` | Derived from `inventory_transactions` WHERE txn_type=WIP_CONSUMPTION |
| Production progress snapshot | `GetProductionProgressUseCase` | Stage counts, progress %, current stage, WIP balances |

---

## Architecture

### Event Flow

```
RecordStageOutputUseCase
  → ProductionEventPublisher.emitStageCompleted(ProductionStageCompletedEvent)
      → ProductionEventListener.onStageCompleted (async, isolated try/catch)
          → ProcessStageCompletionWipUseCase.execute(event)
              → For each production_order_part:
                  ProductionWipRepository.upsertAndRecordTransaction(...)
                  ProductionEventPublisher.emitWipUpdated(ProductionWipUpdatedEvent)
                  AuditService.log(...)
              → ProductionEventListener.onWipUpdated (log only)
```

### Optimistic Lock Pattern (BR-W01/W03)

```
findFirst(order_id, part_id)
  → null:  executeInTransaction(create wip_inventory + create inventory_transactions)
  → found: executeInTransaction(updateMany WHERE version=currentVersion + create inventory_transactions)
            count=0 → retry (up to 3)
            count=1 → findFirst → return
```

### WIP History Derivation

No dedicated `wip_history` table exists in the schema. History is derived from `inventory_transactions` filtered by:
- `txn_type = WIP_CONSUMPTION`
- `from_location_type = 'PRODUCTION_ORDER'`
- `from_location_id = orderId`

This avoids raw string matching and uses indexed enum + bigint columns.

---

## REST Endpoints

| Method | Path | Use Case | Roles |
|---|---|---|---|
| GET | `/v1/production/wip` | `ListWipUseCase` | All authenticated |
| GET | `/v1/production/wip/history` | `GetWipHistoryUseCase` | All authenticated |
| GET | `/v1/production/wip/:id` | `GetWipUseCase` | All authenticated |
| GET | `/v1/production/progress` | `GetProductionProgressUseCase` | All authenticated |

Note: `/wip/history` is declared before `/wip/:id` in the controller to prevent NestJS routing conflict.

---

## Business Rules Enforced

| Rule | Where Enforced |
|---|---|
| BR-W01: Optimistic lock with 3-retry | `ProductionWipRepository.upsertAndRecordTransaction` |
| BR-W02: WIP cannot be negative (`Math.max(0, outputDozens)`) | `ProcessStageCompletionWipUseCase` |
| BR-W03: Create on first stage, update on subsequent | `ProductionWipRepository.upsertAndRecordTransaction` |
| BR-Inv03: WIP balance update + inventory_transaction atomic | `executeInTransaction` in repository |

---

## Files Created

| File | Purpose |
|---|---|
| `src/modules/production/repositories/production-wip.repository.ts` | WIP queries + optimistic lock upsert |
| `src/modules/production/dto/production-wip.dto.ts` | Query DTOs, response DTOs, mappers |
| `src/modules/production/use-cases/process-stage-completion-wip/process-stage-completion-wip.use-case.ts` | Event-driven WIP update engine |
| `src/modules/production/use-cases/get-wip/get-wip.use-case.ts` | Single WIP entry query |
| `src/modules/production/use-cases/list-wip/list-wip.use-case.ts` | Paginated WIP list |
| `src/modules/production/use-cases/get-wip-history/get-wip-history.use-case.ts` | WIP transaction history |
| `src/modules/production/use-cases/get-production-progress/get-production-progress.use-case.ts` | Stage progress + WIP balances |
| `src/modules/production/use-cases/production-wip.use-cases.spec.ts` | 14 unit tests across 5 suites |
| `src/modules/production/controllers/production-wip.controller.ts` | 4 GET endpoints |
| `docs/execution/production/ENGINEERING_DECISION_REPORT_P04.md` | 5 engineering decisions |

## Files Modified

| File | Change |
|---|---|
| `src/modules/production/events/production.events.ts` | Added `ProductionWipUpdatedEvent` |
| `src/modules/production/events/production-event.publisher.ts` | Added `emitWipUpdated` |
| `src/modules/production/events/production-event.listener.ts` | Made `onStageCompleted` async; added WIP use case call + failure isolation; added `onWipUpdated` |
| `src/modules/production/production.module.ts` | Added `ProductionWipRepository`, 5 use cases, `ProductionWipController` |

---

## Deferred Integration Points

| Integration | Target Phase | Trigger |
|---|---|---|
| REST command endpoints (POST /wip, PATCH /wip/:id/consume, etc.) | Schema extension required | No `wip_history`/`wip_transfer` schema tables exist |
| WIP → Finished Goods transition | P09 | `isLastStage=true` on `ProductionWipUpdatedEvent` |
| Quality hold on WIP (zero-out on quality failure) | P06 | P06 quality output processing |
| Packing draw-down of WIP | P08 | P08 packing execution |

---

## Engineering Decisions Summary

See `ENGINEERING_DECISION_REPORT_P04.md` for full reasoning. Key decisions:

1. **Command endpoints deferred** — `wip_inventory` is a balance-only table; no `wip_history` or `wip_transfer` schema tables exist to support POST/PATCH commands.
2. **WIP history via `inventory_transactions`** — filtered by `txn_type=WIP_CONSUMPTION AND from_location_type='PRODUCTION_ORDER'`; avoids a dedicated history table.
3. **Per (order_id, part_id) granularity** — matches the `@@unique` constraint on `wip_inventory`.
4. **Upsert with optimistic lock** — create on first stage completion, update with version check on subsequent stages; up to 3 retries before `ConflictException`.
5. **WIP failure isolation** — `onStageCompleted` wraps `ProcessStageCompletionWipUseCase.execute()` in `try/catch` so WIP failures never propagate to the stage completion response.
