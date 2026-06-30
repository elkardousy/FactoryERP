# Engineering Decision Report — P06 Quality Output
Version 1.0 | Date: 2026-06-30 | Author: Lead Backend Engineer

---

## ED-P06-001: Inspection lifecycle deferred — quality_output_boxes is a balance table

**Problem:** The P06 MEC specifies commands RecordInspection, ApproveInspection, RejectInspection, HoldInspection with a full inspection lifecycle. However, the only quality schema object is `quality_output_boxes`, which is a balance table containing `(order_id, color_id, size_id, dozens_available, version, last_updated)`.

**Constraint:** The table has:
- No `status` field (DRAFT / PENDING / APPROVED / REJECTED / HELD)
- No `inspector_id` / `recorded_by` field
- No `inspected_dozens`, `accepted_dozens`, `rejected_dozens`, `held_dozens`
- No inspection lifecycle workflow columns
- No audit columns on the table itself

Inventing these columns would require schema migrations that are prohibited without Chief Architect approval.

**Decision:** P06 implements `RecordQualityOutput` as a direct accumulation command (BR-Q02: upsert-add). There is no separate approval/rejection/hold workflow. The command records `dozens_passed` for a `(order, color, size)` combination directly into `dozens_available`. Inspector attribution is tracked via the `inventory_transactions.executed_by` field (QUALITY_OUTPUT transaction).

**Deferred:** RecordInspection→ApproveInspection lifecycle, RejectInspection, HoldInspection, ReleaseHeld. Pending schema extension with `status`, `inspector_id`, and quantity-breakdown fields.

---

## ED-P06-002: Rejected / Held quantities not schema-supported

**Problem:** The MEC requires tracking rejected and held quantities separately from accepted quantities. Business rule states "Rejected quantity cannot become Finished Goods; Held quantity cannot enter Packing."

**Constraint:** `quality_output_boxes` stores only `dozens_available` (a single accumulating balance). There are no `dozens_rejected` or `dozens_held` columns.

**Decision:** P06 records only accepted/passed dozens (`dozens_available`). Rejected and held quantity tracking is deferred pending schema extension. The constraint "Rejected quantity cannot become FG" is trivially satisfied because rejected quantities are never recorded into `quality_output_boxes.dozens_available`.

**Future Migration Required:** Add `dozens_rejected` and `dozens_held` columns to `quality_output_boxes` (or a separate `quality_inspection_records` table) to support full disposition tracking.

---

## ED-P06-003: BR-Q03 enforced as cumulative total per recording

**Problem:** BR-Q03 states "Total dozens_passed across all quality output recordings for an order must not exceed the final stage's output_dozens." The business rule has `[UNKNOWN]` on whether this is per-recording or total-only enforcement.

**Decision:** Enforce as cumulative check per recording:
```
SUM(quality_output_boxes.dozens_available WHERE order_id = X) + new_dozens_passed ≤ final_stage.output_dozens
```
This is the stricter interpretation and prevents exceeding the total at any point in time. "Per-recording" check is selected over "total-only" because it detects violations before they occur rather than after.

**Validation point:** Inside `RecordQualityOutputUseCase`, before the optimistic lock upsert.

---

## ED-P06-004: QO history derived from inventory_transactions

**Problem:** `quality_output_boxes` has no history. Each upsert-add overwrites the running balance. There is no audit trail on the table itself.

**Constraint:** No `quality_output_history` table exists. Raw SQL is prohibited.

**Decision:** QO history is derived from `inventory_transactions` filtered by:
- `txn_type = QUALITY_OUTPUT`
- `from_location_type = 'PRODUCTION_ORDER'`
- `from_location_id = orderId`

Each QO recording creates one `QUALITY_OUTPUT` inventory transaction carrying `color_id`, `size_id`, `dozens_qty`, `executed_by`, `executed_at`. This provides full per-recording history with inspector attribution.

---

## ED-P06-005: Valid order statuses for QO recording

**Problem:** The MEC says "Only completed stages may be inspected" and "Closed Production Orders cannot receive new inspections." BR-S06 says QO follows last stage completion. The order status at QO time must be determined.

**Decision:** `RecordQualityOutputUseCase` allows QO recording when order status is `IN_PRODUCTION` or `PRODUCTION_COMPLETE`. The final stage must have status `COMPLETE`. This allows QO to start during production (after the last stage completes but before the order status is explicitly moved to PRODUCTION_COMPLETE) and continue after PRODUCTION_COMPLETE. QO is blocked for CLOSED orders.

**Rationale:** Stage completion triggers QO eligibility (BR-S06). The order lifecycle transition to PRODUCTION_COMPLETE may happen independently. Requiring PRODUCTION_COMPLETE status before QO would block recording in race conditions.

---

## ED-P06-006: Color/size validation against model not enforced

**Problem:** `quality_output_boxes` references `color_id` and `size_id` via FK to the `colors` and `sizes` tables — not to `model_colors` or `model_sizes`. There is no explicit business rule requiring QO to only use colors/sizes valid for the model.

**Decision:** No model-color/size cross-validation is added. The FK constraints ensure the color and size exist. Adding model-scoped validation (via `model_colors`/`model_sizes`) would require an extra DB lookup and is not mandated by BR-Q01 through BR-Q04.

**Future:** If rejected in QA testing, add model-scoped validation without schema change.
