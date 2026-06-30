# P06 — Quality Output Engine: Completion Report

| Field | Value |
|---|---|
| **Feature** | P06 — Quality Output |
| **Status** | COMPLETE |
| **Commit** | 0b06e55 |
| **Date** | 2026-06-30 |
| **Tests** | 376/376 PASS (16 new) |
| **Build** | PASS |
| **Lint** | PASS (0 errors) |
| **Prisma Validate** | PASS |

---

## Executive Summary

P06 implements the Quality Output Engine on top of the `quality_output_boxes` table — a balance-only schema object with optimistic locking. The engine records passed dozens per `(order, color, size)` combination with a full conservation check against the final stage output, emits quality events, and provides query endpoints for individual boxes, summaries, and history derived from `inventory_transactions`.

The inspection lifecycle (RecordInspection → ApproveInspection → RejectInspection → HoldInspection) cannot be implemented without schema extensions (see Engineering Decisions). P06 is therefore a record-and-query engine: it records what passed and makes it available for packing (P08, BR-Q04).

---

## Business Value

- Prevents packing from starting before quality output is recorded (BR-Q04 gatekeeper)
- Enforces that QO cannot exceed stage output (BR-Q03)
- Provides per-(color, size) QO breakdown for packing quantity planning
- Full QO history via `QUALITY_OUTPUT` inventory transactions
- Integrates with event bus: signals QO eligibility when last stage completes

---

## Files Created

| File | Purpose |
|---|---|
| `src/modules/production/repositories/production-quality.repository.ts` | QO queries + optimistic lock upsert-add |
| `src/modules/production/dto/production-quality.dto.ts` | Command/query DTOs, response DTOs, mappers |
| `src/modules/production/use-cases/record-quality-output/record-quality-output.use-case.ts` | Record QO command (BR-Q01/Q02/Q03) |
| `src/modules/production/use-cases/get-quality-box/get-quality-box.use-case.ts` | Single box query |
| `src/modules/production/use-cases/list-quality-boxes/list-quality-boxes.use-case.ts` | Filtered list query |
| `src/modules/production/use-cases/get-quality-summary/get-quality-summary.use-case.ts` | Order QO summary |
| `src/modules/production/use-cases/get-quality-history/get-quality-history.use-case.ts` | QO transaction history |
| `src/modules/production/use-cases/production-quality.use-cases.spec.ts` | 16 unit tests across 5 suites |
| `src/modules/production/controllers/production-quality.controller.ts` | 5 REST endpoints |
| `docs/execution/production/ENGINEERING_DECISION_REPORT_P06.md` | 6 engineering decisions |

## Files Modified

| File | Change |
|---|---|
| `src/modules/production/events/production.events.ts` | Added `ProductionQualityRecordedEvent`, `ProductionQualitySummaryUpdatedEvent` |
| `src/modules/production/events/production-event.publisher.ts` | Added `emitQualityRecorded`, `emitQualitySummaryUpdated` |
| `src/modules/production/events/production-event.listener.ts` | Added `onStageCompletedQuality` (last-stage signal), `onQualityRecorded`, `onQualitySummaryUpdated` |
| `src/modules/production/production.module.ts` | Added `ProductionQualityRepository`, 5 use cases, `ProductionQualityController` |

---

## Commands

| Command | Endpoint | Roles | Business Rules |
|---|---|---|---|
| RecordQualityOutput | `POST /v1/production/quality` | ADMIN, MGR, SUPER | BR-Q01, BR-Q02, BR-Q03, BR-Q04 (ED-P06-005) |

## Queries

| Query | Endpoint | Roles |
|---|---|---|
| ListQualityBoxes | `GET /v1/production/quality` | All authenticated |
| GetQualitySummary | `GET /v1/production/quality/summary?order_id=X` | All authenticated |
| GetQualityHistory | `GET /v1/production/quality/history?order_id=X` | All authenticated |
| GetQualityBox | `GET /v1/production/quality/:id` | All authenticated |

---

## Business Rules Enforced

| Rule | Where Enforced |
|---|---|
| BR-Q01: Optimistic locking with 3-retry | `ProductionQualityRepository.upsertAndRecordTransaction` |
| BR-Q02: Accumulation (upsert-add) | `ProductionQualityRepository.upsertAndRecordTransaction` |
| BR-Q03: Total QO ≤ final stage output | `RecordQualityOutputUseCase` (cumulative check per recording, ED-P06-003) |
| BR-Q04: Final stage must be COMPLETE | `RecordQualityOutputUseCase` |
| Order must not be CLOSED | `RecordQualityOutputUseCase` (ED-P06-005) |

---

## Inspection Flow

```
(Order IN_PRODUCTION or PRODUCTION_COMPLETE)
  → Final stage log must be COMPLETE
  → BR-Q03: SUM(quality_output_boxes.dozens_available) + new ≤ final_stage.output_dozens
  → upsertAndRecordTransaction (optimistic lock, 3 retries)
      → if new (order, color, size): create quality_output_boxes + QUALITY_OUTPUT inventory_transaction
      → if existing: updateMany WHERE version=current (add dozens) + QUALITY_OUTPUT inventory_transaction
  → emitQualityRecorded + emitQualitySummaryUpdated
  → AuditService.log
```

---

## Event Integration

| Event | Published When |
|---|---|
| `production.quality.recorded` | After each successful QO recording |
| `production.quality.summary.updated` | After each QO recording; also when last stage completes |
| Consumed: `production.stage.completed` | `onStageCompletedQuality` emits summary update signal if `isLastStage=true` |

---

## Tests Added

16 tests across 5 suites:
- `RecordQualityOutputUseCase` (6): happy path, order not found, CLOSED order, no stage logs, stage not COMPLETE, BR-Q03 exceeded, PRODUCTION_COMPLETE allowed
- `GetQualityBoxUseCase` (2): happy path, not found
- `ListQualityBoxesUseCase` (2): happy path, empty result
- `GetQualitySummaryUseCase` (3): happy path, order not found, empty boxes
- `GetQualityHistoryUseCase` (2): happy path, limit capped at 100

---

## Engineering Decisions Summary

| ID | Decision |
|---|---|
| ED-P06-001 | Inspection lifecycle deferred — `quality_output_boxes` is a balance table with no status/inspector fields |
| ED-P06-002 | Rejected/Held quantities deferred — no `dozens_rejected`/`dozens_held` schema columns |
| ED-P06-003 | BR-Q03 enforced as cumulative total per recording (stricter interpretation) |
| ED-P06-004 | QO history derived from `inventory_transactions WHERE txn_type=QUALITY_OUTPUT` |
| ED-P06-005 | Valid QO statuses: IN_PRODUCTION or PRODUCTION_COMPLETE (not CLOSED) |
| ED-P06-006 | Color/size-model cross-validation not enforced (no explicit BR; FK constraints sufficient) |

---

## Deferred Integration Points

| Integration | Target Phase | Trigger |
|---|---|---|
| Inspection lifecycle (Approve/Reject/Hold) | Schema extension required | Need `status`, `inspector_id`, `dozens_rejected`, `dozens_held` columns |
| Packing draw-down of QO (`dozens_available` decrement) | P08 | BR-P02 assembly line creation |
| Finished Goods (accepted output → FG bags) | P09 | BR-FG01 via packing post |
| QO → Quantity cap enforcement in P08 | P08 | BR-Q04 gatekeeper |

---

## Risks

1. **No rejection tracking**: Rejected material cannot be quantitatively tracked until schema extends. Manual reconciliation required.
2. **BR-Q03 race condition**: Two concurrent QO recordings for the same order could both pass the cumulative check before either commits. Low risk in practice (single active inspector per order), but possible under high concurrency. Mitigated by optimistic lock which prevents double-writing the same box.

---

## Lessons Learned

- `quality_output_boxes` is structurally identical to `wip_inventory` (balance + version). The same optimistic lock upsert pattern applies cleanly.
- `model_name` is nullable in the schema (`String? @db.VarChar(200)`). Response DTO must allow `string | null`.
- Deriving history from `inventory_transactions` (as done in P04 for WIP) works reliably — `txn_type + from_location_type + from_location_id` provides a unique filter without string pattern matching.

---

## Final Decision

P06 COMPLETE
