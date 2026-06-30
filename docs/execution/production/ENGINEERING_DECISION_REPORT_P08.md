# P08 Engineering Decision Report — Packing Execution Engine

| Field | Value |
|---|---|
| **Phase** | P08 — Packing Execution Engine |
| **Date** | 2026-06-30 |
| **Author** | Engineering |

---

## ED-P08-001: packing_order_no Generation

**Business Rule**: Each packing order requires a unique sequential number.

**Schema**: `packing_orders.packing_order_no String @db.VarChar(30)`

**Decision**: Use `DocumentNumberingService.generate('PACKING_ORDER')` — the same pattern used for production order numbers (`PROD_ORDER` sequence). This requires a `number_sequences` row with `sequence_code = 'PACKING_ORDER'` to be seeded in the database.

**Risk**: If the sequence row does not exist, `DocumentNumberingService` throws `NotFoundException` at runtime, blocking `CreatePackingOrder`.

**Mitigation**: Document as a deployment prerequisite. Seed script must include `PACKING_ORDER` sequence before this feature is released.

---

## ED-P08-002: BR-P01 — "Active" Packing Pattern

**Business Rule**: BR-P01 states "An active packing_patterns record must exist for the model."

**Schema**: `packing_patterns.is_active Boolean @default(true)` — exists.

**Decision**: Filter `packing_patterns WHERE model_id = :model_id AND is_active = true`. If no active pattern exists for the model, `CreatePackingOrder` throws `BadRequestException("No active packing pattern found for this model")`.

**Rationale**: `is_active` is available and semantically correct. Multiple patterns may exist; the most recently created active pattern (highest `pattern_id`) is used.

---

## ED-P08-003: BR-P04 — Four-Eyes Verification (Combined Submit+Approve)

**Business Rule**: BR-P04 requires a supervisor to "approve" verification separately from submission.

**Schema**: `packing_verifications.variance_accepted Boolean @default(false)` — the approval flag.

**MEC Constraint**: The MEC CQRS section lists only `VerifyPacking` (no separate `ApprovePacking`). The controller section lists only `PATCH /packing/:id/verify`.

**Decision**: `VerifyPacking` combines submission and approval in one step, setting `variance_accepted = true` atomically. The four-eyes control is enforced by requiring SUPERVISOR or higher role on the verify endpoint. A separate approve endpoint is deferred pending MEC revision.

**Deferred**: `PATCH /packing/:id/approve` — pending MEC revision to add an explicit ApprovePacking command.

---

## ED-P08-004: BR-FG02/FG03 — FG Bag customer_id and warehouse_id Unknown

**Business Rule**:
- BR-FG02: `finished_goods_bags.customer_id` must be set on PostPacking.
- BR-FG03: `finished_goods_bags.warehouse_id` (FG warehouse) must be set on PostPacking.

**Schema**:
- `finished_goods_bags.customer_id BigInt` — NOT NULL, required.
- `finished_goods_bags.warehouse_id BigInt` — NOT NULL, required.

**Gap**:
- For FULL orders with `cmo_line_id`: customer could be resolved via `production_orders.cmo_line_id → customer_manufacturing_order_lines.cmo_id → customer_manufacturing_orders.customer_id`. This chain requires additional join traversal not currently modelled in the production module.
- For PARTIAL orders: no CMO linkage exists; `customer_id` is completely unknown.
- `warehouse_id` (FG warehouse): no field on `production_orders`, `packing_orders`, or any related table in the packing flow indicates which FG warehouse to use.

**Decision**: `PostPackingOrderUseCase` transitions `packing_orders.status → POSTED` and creates the `PACKING` inventory transaction (BR-Inv02). FG bag creation via `finished_goods_bags` is **deferred** — implementing it would require inventing behavior not supported by the current schema.

**Impact**: `finished_goods_bags` table is not populated by P08. P09 (Finished Goods) must own FG bag creation once the schema provides the required linkages.

**Deferred**: FG bag creation — blocked by BR-FG02/FG03 unknowns.

---

## ED-P08-005: BR-P03 — DB-Generated Columns

**Business Rule**: BR-P03 states:
- `dozen_assembly_lines.dozens_consumed = pieces_consumed / 12` — DB-generated.
- `packing_verifications.variance_dozens = physical_count_dozens - system_dozens` — DB-generated.

**Schema**:
- `dozen_assembly_lines.dozens_consumed Decimal? @default(dbgenerated())`
- `packing_verifications.variance_dozens Decimal? @default(dbgenerated())`

**Decision**:
1. Never write `dozens_consumed` or `variance_dozens` in any Prisma create/update call.
2. `dozen_assemblies.dozens_assembled` is NOT DB-generated and IS written by the application. It is computed as `sum(pieces_consumed for all lines) / 12.0` before the transaction.
3. `packing_verifications.variance_dozens` is computed by PostgreSQL and is returned in query results — read it directly after create.

---

## ED-P08-006: AddAssembly — Scope Within P08

**MEC CQRS Commands**: Lists `CreatePackingOrder`, `VerifyPacking`, `PostPacking` — no `AddAssembly`.

**MEC Core Responsibility**: Explicitly lists "Packing Lines" as P08-owned.

**Decision**: Implement `AddAssembly` as an additional command with endpoint `POST /v1/production/packing/:id/assemblies`. Without assembly recording, `packing_orders.assembled_dozens` remains 0, making `VerifyPacking` and `PostPacking` meaningless. The "Packing Lines" ownership in the MEC implies assembly recording is in scope.

**Status Auto-Transition**: On the first `AddAssembly`, if `packing_orders.status = DRAFT`, the status auto-transitions to `IN_PROCESS` (sets `started_by`, `started_at`). No separate `StartPackingOrder` endpoint is exposed.

---

## ED-P08-007: PostPacking PACKING Inventory Transaction

**Business Rule**: BR-Inv02 — PostPacking must create a `PACKING` inventory transaction.

**Decision**: The PACKING transaction is created atomically with the `POSTED` status transition:
- `txn_reference`: `PKG-{packingOrderId}`
- `txn_type`: `TxnTypeEnum.PACKING`
- `model_id`: from `production_orders.model_id` (join via `production_order_id`)
- `from_location_type`: `'PRODUCTION_ORDER'`
- `from_location_id`: `production_order_id`
- `to_location_type`: `null` (FG warehouse unknown — ED-P08-004)
- `to_location_id`: `null`
- `dozens_qty`: `packing_orders.assembled_dozens`
- `notes`: `'Packing posted — FG bag creation deferred (ED-P08-004)'`

---

## ED-P08-008: QO Box Optimistic Lock in AddAssembly

**Business Rule**: BR-P02 — Each `dozen_assembly_lines` creation must decrement `quality_output_boxes.dozens_available`.

**Schema**: `quality_output_boxes.version BigInt @default(0)` — optimistic lock field.

**Decision**: Same retry-loop pattern as P07 (WIP optimistic lock). The repository retries up to 3 times. On each attempt, QO boxes are re-read. If any `updateMany WHERE (box_id, version)` returns `count = 0`, the transaction is rolled back (via an internal signal throw) and retried. After 3 failures, `ConflictException` is thrown.

---

## Summary Table

| ID | Decision | Status |
|---|---|---|
| ED-P08-001 | packing_order_no via DocumentNumberingService('PACKING_ORDER') | IMPLEMENTED |
| ED-P08-002 | Active pattern = is_active = true, use most recent | IMPLEMENTED |
| ED-P08-003 | VerifyPacking combines submit+approve (supervisor role required) | IMPLEMENTED |
| ED-P08-004 | FG bag creation deferred — customer_id/warehouse_id unknown | DEFERRED |
| ED-P08-005 | Never write dozens_consumed or variance_dozens | IMPLEMENTED |
| ED-P08-006 | AddAssembly added as P08 command (POST /packing/:id/assemblies) | IMPLEMENTED |
| ED-P08-007 | PACKING inventory txn created on PostPacking, to_location null | IMPLEMENTED |
| ED-P08-008 | QO box optimistic lock with 3-retry in AddAssembly | IMPLEMENTED |
