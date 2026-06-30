# Engineering Decision Report — P03 Production Stage Tracking

| Field | Value |
|---|---|
| **Feature** | P03 — Production Stage Tracking |
| **Author** | Lead Backend Engineer |
| **Date** | 2026-06-30 |
| **Status** | ACCEPTED — implementation proceeds |
| **Supersedes** | None |

---

## Issue 1 — PAUSE/RESUME Not Supported by Schema

### Conflict

The P03 MEC lists `Pause Stage` and `Resume Stage` as business capabilities if supported by current schema.

`StageStatusEnum` values: `PENDING`, `IN_PROGRESS`, `COMPLETE`.

There is no `PAUSED` status in the enum or any `paused_at`/`resumed_at` column on `production_stage_logs`.

### Resolution

**DEFERRED.** Pause/Resume cannot be implemented without a schema extension.

Required schema extension:
```sql
ALTER TYPE factory."StageStatusEnum" ADD VALUE 'PAUSED';
ALTER TABLE factory.production_stage_logs
  ADD COLUMN paused_at TIMESTAMPTZ,
  ADD COLUMN paused_by BIGINT REFERENCES factory.users(user_id),
  ADD COLUMN resumed_at TIMESTAMPTZ,
  ADD COLUMN resumed_by BIGINT REFERENCES factory.users(user_id);
```

P03 implements: `PENDING → IN_PROGRESS → COMPLETE` only.

---

## Issue 2 — WIP Update (BR-S05) Deferred to P04

### Conflict

BR-S05: "On a stage completing (status → COMPLETE), a `WIP_CONSUMPTION` inventory transaction must be recorded, and `wip_inventory` must be updated."

P03 is responsible for stage lifecycle. P04 (`WIP Inventory Management`) owns `wip_inventory` and `WIP_CONSUMPTION` transactions.

### Resolution

**DEFERRED to P04 via event.** P03 emits `production.stage.completed` with `isLastStage` flag and full quantity data. P04's event listener (`onStageCompleted`) will handle `wip_inventory` update and `WIP_CONSUMPTION` inventory transaction.

P03 does NOT write to `wip_inventory` or `inventory_transactions`. This satisfies BR-Inv01 and keeps P03/P04 boundaries clean.

---

## Issue 3 — Quality Output Trigger (BR-S06) Deferred to P06

### Conflict

BR-S06: "When the final stage completes, the output is available for quality inspection."

P03 does not own `quality_output_boxes`. P06 owns it.

### Resolution

**DEFERRED to P06 via event.** P03 sets `isLastStage: true` in `ProductionStageCompletedEvent`. P06's event listener will create the quality inspection context when it sees `isLastStage = true`. P06 is not implemented yet; the stub listener in P03 logs the event.

---

## Issue 4 — MEC Commands vs. API Specification Discrepancy

### Conflict

The P03 MEC lists 5 commands: `StartProductionStage`, `CompleteProductionStage`, `RecordStageOutput`, `RecordStageWaste`, `RecordStageReturn`.

The authoritative API specification (`04_PRODUCTION_API_SPECIFICATION.md`) lists 2 command endpoints:
- `PATCH /v1/production/orders/:id/stages/:stageId/start`
- `POST /v1/production/orders/:id/stages/:stageId/output`

The feature queue (`02_PRODUCTION_FEATURE_QUEUE.md`) lists 2 use cases: `StartStageUseCase`, `RecordStageOutputUseCase`.

### Resolution

**API specification and feature queue are authoritative.**

`RecordStageOutput` is the completion operation. It atomically:
1. Receives output_dozens, scrap_records[], incomplete_records[]
2. Validates conservation law (BR-S02)
3. Creates `scrap_records` detail entries (BR-S07)
4. Creates `incomplete_item_records` detail entries (BR-S08)
5. Sets `status = COMPLETE`

`RecordStageWaste` and `RecordStageReturn` as standalone commands are not exposed as separate HTTP endpoints. They are bundled into the single `POST /output` atomic operation (same pattern as how `release_group_lines` creation is bundled into `CreateReleaseGroupUseCase`).

`CompleteProductionStage` as a separate command is also merged into `RecordStageOutput` — recording output IS the completion.

---

## Issue 5 — `input_dozens` Computed Automatically on Start

### Design Decision

The API spec defines `PATCH .../start` with no request body. `input_dozens` is computed by the use case:

- **First stage** (lowest `sequence_order`): `input_dozens` = SUM(`release_group_lines.dozens_released`) for this order [BR-S03]
- **Subsequent stages**: `input_dozens` = previous stage's `output_dozens` [BR-S04]

"First stage" is defined as the `production_stage_logs` record whose associated `production_stages.sequence_order` is the minimum across all logs for this order.

### Implementation

`ProductionStagesRepository.sumReleasedDozensForOrder(orderId)` queries `release_group_lines` through the `release_groups` relation (cross-table query within the same database — permitted at repository layer).

`ProductionStagesRepository.findPreviousStageLog(orderId, currentSequenceOrder)` finds the stage log for the stage with the highest `sequence_order` < `currentSequenceOrder`.

---

## Issue 6 — `stageId` URL Parameter Semantics

### Design Decision

URL pattern: `GET /v1/production/orders/:id/stages/:stageId`

`:stageId` = `stage_id` from `production_stages` (NOT `log_id` from `production_stage_logs`).

Rationale: the URL exposes the business concept of "which stage" within an order's context, not the internal log record ID. Stage logs are looked up by `(order_id, stage_id)` using `findFirst()`.

---

## Summary Table

| Issue | Action | Deferred To |
|---|---|---|
| PAUSE/RESUME | Schema extension required | Undefined future sprint |
| WIP_CONSUMPTION (BR-S05) | Event → P04 listener | P04 |
| Quality output trigger (BR-S06) | Event → P06 listener | P06 |
| RecordStageWaste/Return as standalone commands | Merged into RecordStageOutput | N/A |
| input_dozens computed at start | Repository query | N/A |
