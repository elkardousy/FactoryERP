# 02 — Production Feature Queue

| Field | Value |
|---|---|
| **Purpose** | Ordered implementation queue for all Production Module features |
| **Scope** | P01–P11 feature specifications |
| **Audience** | Implementing agents |
| **Status** | ACTIVE |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Per-sprint |
| **Version** | 1.0 |

**Dependencies:** `00_PRODUCTION_MASTER_EXECUTION_CONTRACT.md`, `01_PRODUCTION_DOMAIN_MODEL.md`  
**Related FEOS:** FEOS-04 (Implementation Governance), FEOS-11 (Module Governance)  
**Related KEB:** KEB-03 (Business Knowledge), KEB-04 (Database Knowledge)  

---

## Execution Order

Features MUST be implemented in this order. No feature may begin until its listed dependencies are DONE.

| # | Feature | Depends On | Estimated Complexity |
|---|---|---|---|
| P01 | Production Order Management | Platform complete | High |
| P02 | Material Release | P01 | High |
| P03 | Production Stage Tracking | P02 | High |
| P04 | WIP Inventory Management | P03 | Medium |
| P05 | Scrap & Incomplete Recording | P03 | Medium |
| P06 | Quality Output | P04, P05 | Medium |
| P07 | Return to Warehouse | P02 | Medium |
| P08 | Packing Execution | P06 | Very High |
| P09 | Finished Goods Management | P08 | Medium |
| P10 | Supplementary Material Requests | P02 | High |
| P11 | Production Reporting & Dashboard | P01–P09 | High |

---

## P01 — Production Order Management

**Objective:** Create and manage production orders from DRAFT through CLOSED.

**Business Value:** Foundation of the production domain. Every other feature depends on a production order existing.

**Tables:**
- `production_orders` (primary)
- `production_order_parts` (linked parts)

**Use Cases:**
- `CreateProductionOrderUseCase` — create order in DRAFT, assign parts, auto-generate `order_number`
- `PlanProductionOrderUseCase` — transition DRAFT → PLANNED (validates parts are set)
- `StartProductionUseCase` — transition PLANNED → IN_PRODUCTION (validates all parts RELEASED)
- `CompleteProductionUseCase` — transition IN_PRODUCTION → PRODUCTION_COMPLETE (validates all stages COMPLETE)
- `CloseProductionOrderUseCase` — transition PRODUCTION_COMPLETE → CLOSED (validates packing POSTED)
- `GetProductionOrderUseCase` — fetch order with parts
- `ListProductionOrdersUseCase` — paginated list with status filter

**Commands:**
- `CreateProductionOrderCommand { model_id, line_id, release_type, cmo_line_id?, part_ids[], target_dozens }`
- `PlanProductionOrderCommand { order_id }`
- `StartProductionCommand { order_id }`
- `CompleteProductionCommand { order_id }`
- `CloseProductionOrderCommand { order_id }`

**Queries:**
- `GetProductionOrderQuery { order_id }`
- `ListProductionOrdersQuery { status?, line_id?, model_id?, page, limit }`

**DTOs:**
- `CreateProductionOrderDto`
- `ProductionOrderResponseDto`
- `ProductionOrderPartResponseDto`

**Repository:** `ProductionOrdersRepository`
- `create(cmd) → production_orders`
- `findById(id) → production_orders & parts`
- `findMany(filter, page, limit) → PaginatedResult<production_orders>`
- `updateStatus(id, status) → production_orders`
- `updatePartStatus(order_part_id, status) → production_order_parts`

**Events Emitted:**
- `ProductionOrderCreatedEvent`
- `ProductionOrderStatusChangedEvent`

**API Endpoints:**
- `POST /v1/production/orders` — create
- `GET /v1/production/orders` — list (paginated)
- `GET /v1/production/orders/:id` — get one
- `PATCH /v1/production/orders/:id/plan` — plan
- `PATCH /v1/production/orders/:id/start` — start production
- `PATCH /v1/production/orders/:id/complete` — complete
- `PATCH /v1/production/orders/:id/close` — close

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P01

---

## P02 — Material Release

**Objective:** Release reserved inventory bags into production, creating release groups, updating bag status, and recording inventory transactions.

**Business Value:** Transfers material custody from inventory to production. Critical path for all downstream features.

**Tables:**
- `release_groups`
- `release_group_lines`
- `inventory_bags` (updated)
- `inventory_transactions` (RELEASE type written)
- `production_order_parts` (status → RELEASED)
- `customer_manufacturing_order_lines` (remaining_dozens decremented, optimistic lock)

**Use Cases:**
- `CreateReleaseGroupUseCase` — create release group and lines, trigger RELEASE transactions
- `GetReleaseGroupUseCase` — fetch group with lines
- `ListReleaseGroupsUseCase` — list all release groups for an order

**Commands:**
- `CreateReleaseGroupCommand { order_id, lines: [{ bag_id, dozens_to_release, source_warehouse_id }] }`

**Business Rules Applied:**
- BR-R01: Cannot release from a bag that is not RESERVED for this order
- BR-R02: `dozens_to_release` ≤ `inventory_bags.reserved_dozens` for this order
- BR-R03: After release, if `reserved_dozens = 0` on bag → bag status → RELEASED
- BR-R04: CMO line `remaining_dozens` decremented; optimistic lock required
- BR-R05: All release lines in a group are atomic (transaction-wrapped)

**Repository:** `MaterialReleaseRepository`
- `createReleaseGroup(cmd) → release_groups`
- `createReleaseGroupLine(line) → release_group_lines`
- `findReleaseGroupsByOrder(order_id) → release_groups[]`
- `findReleaseGroupWithLines(group_id) → release_groups & lines`

**Inventory Integration:**
- Must call `InventoryTransactionService.record()` with type `RELEASE` for each line
- Must update `inventory_bags.dozens_available` and `dozens_reserved`
- Must update `physical_bags.status` → RELEASED when bag fully consumed

**API Endpoints:**
- `POST /v1/production/orders/:id/release-groups` — create release group
- `GET /v1/production/orders/:id/release-groups` — list release groups
- `GET /v1/production/release-groups/:groupId` — get one group with lines

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P02

---

## P03 — Production Stage Tracking

**Objective:** Record and manage stage-by-stage production progress (input → output → scrap → incomplete).

**Business Value:** Core manufacturing execution tracking. Enables WIP visibility and stage-gate control.

**Tables:**
- `production_stage_logs`
- `scrap_records`
- `incomplete_item_records`

**Use Cases:**
- `InitializeStageLogsUseCase` — create PENDING stage log records for all stages on order creation or start
- `StartStageUseCase` — transition stage PENDING → IN_PROGRESS
- `RecordStageOutputUseCase` — record output, scrap, incomplete dozens; transition stage → COMPLETE
- `GetStageLogUseCase` — fetch stage log with scrap and incomplete records
- `ListStageLogsUseCase` — list all stages for an order

**Commands:**
- `StartStageCommand { order_id, stage_id }`
- `RecordStageOutputCommand { log_id, output_dozens, scrap_records: [...], incomplete_records: [...] }`

**Business Rules Applied:**
- BR-S01: Stages are sequential; a stage cannot start until the previous stage is COMPLETE
- BR-S02: `output_dozens + scrap_dozens + incomplete_dozens = input_dozens` (conservation)
- BR-S03: First stage `input_dozens` = total released dozens for this order
- BR-S04: Subsequent stage `input_dozens` = previous stage `output_dozens`
- BR-S05: Stage COMPLETE triggers WIP_CONSUMPTION transaction

**Repository:** `ProductionStagesRepository`
- `initializeStages(order_id, stage_ids[]) → production_stage_logs[]`
- `findByOrderAndStage(order_id, stage_id) → production_stage_logs`
- `findByOrder(order_id) → production_stage_logs[]`
- `updateStageStatus(log_id, status) → production_stage_logs`
- `recordOutput(log_id, output, scrapRecords[], incompleteRecords[]) → production_stage_logs`
- `createScrapRecord(record) → scrap_records`
- `createIncompleteRecord(record) → incomplete_item_records`

**API Endpoints:**
- `GET /v1/production/orders/:id/stages` — list all stage logs
- `GET /v1/production/orders/:id/stages/:stageId` — get one stage log
- `PATCH /v1/production/orders/:id/stages/:stageId/start` — start stage
- `POST /v1/production/orders/:id/stages/:stageId/output` — record output

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P03

---

## P04 — WIP Inventory Management

**Objective:** Maintain live WIP balance per order+part. Updated on every stage completion.

**Business Value:** Real-time WIP visibility for production supervisors and planning.

**Tables:**
- `wip_inventory` (primary, optimistic lock)
- `inventory_transactions` (WIP_CONSUMPTION type written)

**Use Cases:**
- `UpdateWipOnStageCompleteUseCase` — called internally when a stage completes; updates wip_inventory
- `GetWipPositionUseCase` — return current WIP for an order
- `ListWipPositionsUseCase` — list all WIP across orders (with filters)

**Commands:**
- `UpdateWipCommand { order_id, part_id, dozens_delta }` (internal — triggered by stage completion)

**Business Rules Applied:**
- BR-W01: `wip_inventory` uses optimistic lock (version field) — concurrent stage completions must not corrupt balance
- BR-W02: On first stage completion for an order+part, create the `wip_inventory` record
- BR-W03: On subsequent completions, upsert with `version` check
- BR-W04: `dozens_in_wip >= 0` enforced at service layer

**Repository:** `WipInventoryRepository`
- `upsertWip(order_id, part_id, dozens_delta, version?) → wip_inventory`
- `findByOrder(order_id) → wip_inventory[]`
- `findByOrderAndPart(order_id, part_id) → wip_inventory`

**API Endpoints:**
- `GET /v1/production/orders/:id/wip` — get WIP positions for order

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P04

---

## P05 — Scrap & Incomplete Recording

**Objective:** Detailed tracking of scrap and incomplete items within each production stage.

**Business Value:** Quality analytics and root cause analysis for production defects.

**Tables:**
- `scrap_records`
- `incomplete_item_records`

**Note:** These records are created as part of `RecordStageOutputUseCase` (P03). P05 adds:
- Standalone query endpoints for scrap/incomplete analytics
- Aggregate reporting per order, per stage, per scrap type

**Use Cases:**
- `GetScrapSummaryUseCase` — aggregate scrap by type for an order
- `GetIncompleteSummaryUseCase` — aggregate incomplete by reason for an order

**API Endpoints:**
- `GET /v1/production/orders/:id/scrap` — scrap summary for order
- `GET /v1/production/orders/:id/incomplete` — incomplete summary for order

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P05

---

## P06 — Quality Output

**Objective:** Record finished dozens per color/size after quality inspection, feeding the packing stage.

**Business Value:** Links production completion to packing by tracking available quality-passed output by SKU.

**Tables:**
- `quality_output_boxes` (primary, optimistic lock)
- `inventory_transactions` (QUALITY_OUTPUT type written)

**Use Cases:**
- `RecordQualityOutputUseCase` — upsert quality output box for a color/size, create QUALITY_OUTPUT transaction
- `GetQualityOutputUseCase` — fetch quality output boxes for an order

**Commands:**
- `RecordQualityOutputCommand { order_id, color_id, size_id, dozens_passed }`

**Business Rules Applied:**
- BR-Q01: `quality_output_boxes` uses optimistic lock (version)
- BR-Q02: `dozens_passed` cannot exceed stage output for that color/size
- BR-Q03: Multiple quality recording events for same `(order_id, color_id, size_id)` accumulate (upsert add)

**Repository:** `QualityOutputRepository`
- `upsertOutputBox(order_id, color_id, size_id, dozens, version?) → quality_output_boxes`
- `findByOrder(order_id) → quality_output_boxes[]`
- `findByOrderAndSku(order_id, color_id, size_id) → quality_output_boxes`

**API Endpoints:**
- `POST /v1/production/orders/:id/quality-output` — record quality output
- `GET /v1/production/orders/:id/quality-output` — list quality output boxes

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P06

---

## P07 — Return to Warehouse

**Objective:** Allow returning unused/excess production material back to a warehouse.

**Business Value:** Closes the material loop; prevents inventory leakage.

**Tables:**
- `return_transactions`
- `inventory_bags` (dozens_available restored)
- `inventory_transactions` (RETURN type)
- `physical_bags` (status reverts)
- `production_order_parts` (status → RETURNED when fully returned)

**Use Cases:**
- `ReturnMaterialUseCase` — create return transaction, update inventory, update part status

**Commands:**
- `ReturnMaterialCommand { order_id, part_id, bag_id, dozens_returned, destination_warehouse_id, reason }`

**Business Rules Applied:**
- BR-Rt01: Can only return from a bag that was RELEASED to this order
- BR-Rt02: `dozens_returned` ≤ `dozens_released` for that bag in this order
- BR-Rt03: Creates RETURN inventory transaction
- BR-Rt04: If all WIP for that part returns to zero → `production_order_parts.status` → RETURNED

**Repository:** `ReturnTransactionsRepository`
- `createReturn(cmd) → return_transactions`
- `findByOrder(order_id) → return_transactions[]`
- `sumReturnedByOrderAndBag(order_id, bag_id) → number`

**API Endpoints:**
- `POST /v1/production/orders/:id/returns` — create return
- `GET /v1/production/orders/:id/returns` — list returns for order

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P07

---

## P08 — Packing Execution

**Objective:** Assemble finished garment dozens into packing boxes according to the packing pattern, verify counts, and post the packing order.

**Business Value:** The final production step; creates finished goods inventory.

**Tables:**
- `packing_orders`
- `dozen_assemblies`
- `dozen_assembly_lines`
- `packing_patterns`
- `packing_pattern_lines`
- `packing_verifications`
- `quality_output_boxes` (dozens_available decremented, optimistic lock)

**Use Cases:**
- `CreatePackingOrderUseCase` — create DRAFT packing order for a PRODUCTION_COMPLETE order
- `AddAssemblyUseCase` — add a dozen assembly to a packing order; consume from quality_output_boxes
- `StartPackingUseCase` — transition packing order DRAFT → IN_PROCESS
- `CompleteAssemblyUseCase` — transition IN_PROCESS → ASSEMBLED
- `RecordVerificationUseCase` — create packing verification (physical count)
- `ApproveVerificationUseCase` — supervisor approves; transition → VERIFIED
- `PostPackingOrderUseCase` — transition VERIFIED → POSTED; create finished_goods_bags

**Commands:**
- `CreatePackingOrderCommand { production_order_id }`
- `AddAssemblyCommand { packing_order_id, assembly_lines: [{ quality_output_box_id, pieces_consumed }] }`
- `RecordVerificationCommand { packing_order_id, physical_count_dozens }`
- `ApproveVerificationCommand { verification_id, approved_by }`
- `PostPackingOrderCommand { packing_order_id }`

**Business Rules Applied:**
- BR-P01: Packing pattern must be ACTIVE for the order's model
- BR-P02: Assembly consumes from `quality_output_boxes` — optimistic lock required
- BR-P03: `dozens_assembled` is sum of `dozen_assembly_lines.dozens_consumed` (computed, DB-generated)
- BR-P04: `packing_verifications.variance_dozens` is DB-generated — do not write directly
- BR-P05: Supervisor must approve verification even when `variance_dozens = 0`
- BR-P06: POSTED creates `finished_goods_bags` and `PACKING` inventory transactions

**Repository:** `PackingRepository`
- `createPackingOrder(cmd) → packing_orders`
- `findPackingOrderById(id) → packing_orders`
- `findPackingOrderByProductionOrder(production_order_id) → packing_orders`
- `addAssembly(packing_order_id, sequence, lines[]) → dozen_assemblies`
- `updatePackingStatus(id, status) → packing_orders`
- `createVerification(cmd) → packing_verifications`
- `approveVerification(verification_id) → packing_verifications`
- `findActivePattern(model_id) → packing_patterns & lines`

**API Endpoints:**
- `POST /v1/production/packing-orders` — create packing order
- `GET /v1/production/packing-orders/:id` — get packing order
- `POST /v1/production/packing-orders/:id/assemblies` — add assembly
- `PATCH /v1/production/packing-orders/:id/start` — start packing
- `PATCH /v1/production/packing-orders/:id/assemble` — mark assembled
- `POST /v1/production/packing-orders/:id/verification` — record physical count
- `PATCH /v1/production/packing-orders/:id/verification/approve` — approve
- `PATCH /v1/production/packing-orders/:id/post` — post packing order

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P08

---

## P09 — Finished Goods Management

**Objective:** Manage finished goods bags created by posted packing orders; provide visibility into FG inventory.

**Business Value:** Connects production output to shipping/dispatch readiness.

**Tables:**
- `finished_goods_bags`
- `inventory_transactions` (PACKING type)

**Use Cases:**
- `GetFinishedGoodsBagUseCase` — fetch one FG bag
- `ListFinishedGoodsBagsUseCase` — paginated list with filters (warehouse, customer, model, cmo_line)

**Queries:**
- `ListFinishedGoodsBagsQuery { warehouse_id?, customer_id?, model_id?, cmo_line_id?, page, limit }`

**Repository:** `FinishedGoodsRepository`
- `create(cmd) → finished_goods_bags` (called from PostPackingOrderUseCase)
- `findById(id) → finished_goods_bags`
- `findMany(filter, page, limit) → PaginatedResult<finished_goods_bags>`

**API Endpoints:**
- `GET /v1/production/finished-goods` — list (paginated)
- `GET /v1/production/finished-goods/:id` — get one bag

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P09

---

## P10 — Supplementary Material Requests

**Objective:** Formal workflow for requesting additional material when original release is insufficient.

**Business Value:** Closes the production exception loop; prevents informal bypass of inventory controls.

**Tables:**
- `supplementary_material_requests`
- `supplementary_request_lines`
- `supplementary_request_negligence`
- `inventory_bags` (updated on TRANSFERRED)
- `inventory_transactions` (SUPPLEMENTARY_RELEASE on TRANSFERRED)

**Use Cases:**
- `CreateSupplementaryRequestUseCase` — create DRAFT request with lines and optional negligence record
- `SubmitSupplementaryRequestUseCase` — DRAFT → PENDING_APPROVAL
- `ApproveSupplementaryRequestUseCase` — PENDING_APPROVAL → APPROVED
- `RejectSupplementaryRequestUseCase` — PENDING_APPROVAL → REJECTED
- `TransferSupplementaryMaterialUseCase` — APPROVED → TRANSFERRED; creates SUPPLEMENTARY_RELEASE transactions
- `CancelSupplementaryRequestUseCase` — any non-terminal state → CANCELLED
- `GetSupplementaryRequestUseCase` — fetch with lines and negligence
- `ListSupplementaryRequestsUseCase` — paginated list

**Commands:**
- `CreateSupplementaryRequestCommand { order_id, reason, lines: [{ part_id, bag_id, dozens_requested }], negligence?: { responsible_user_id, notes } }`
- `ApproveSupplementaryCommand { request_id, approved_by }`
- `TransferSupplementaryCommand { request_id, transferred_by }`

**Business Rules Applied:**
- BR-Sup01: NEGLIGENCE reason requires `supplementary_request_negligence` record
- BR-Sup02: TRANSFERRED creates `SUPPLEMENTARY_RELEASE` inventory transaction per line
- BR-Sup03: `request_number` auto-generated by `DocumentNumberingService`
- BR-Sup04: Cannot submit if order is CLOSED or PRODUCTION_COMPLETE
- BR-Sup05: Cannot transfer until APPROVED

**Repository:** `SupplementaryRepository`
- `createRequest(cmd) → supplementary_material_requests`
- `createRequestLine(line) → supplementary_request_lines`
- `createNegligenceRecord(record) → supplementary_request_negligence`
- `updateStatus(request_id, status) → supplementary_material_requests`
- `findById(id) → request & lines & negligence`
- `findMany(filter, page, limit) → PaginatedResult<...>`

**API Endpoints:**
- `POST /v1/production/supplementary-requests` — create
- `GET /v1/production/supplementary-requests` — list
- `GET /v1/production/supplementary-requests/:id` — get one
- `PATCH /v1/production/supplementary-requests/:id/submit` — submit for approval
- `PATCH /v1/production/supplementary-requests/:id/approve` — approve
- `PATCH /v1/production/supplementary-requests/:id/reject` — reject
- `PATCH /v1/production/supplementary-requests/:id/transfer` — transfer material
- `PATCH /v1/production/supplementary-requests/:id/cancel` — cancel

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P10

---

## P11 — Production Reporting & Dashboard

**Objective:** Aggregate production KPIs, stage efficiency, scrap rates, WIP balances, and order completion status.

**Business Value:** Management visibility into factory floor performance.

**Use Cases:**
- `GetProductionDashboardUseCase` — summary counts by status, total orders in flight
- `GetOrderProgressReportUseCase` — per-order stage completion, scrap %, WIP balance
- `GetScrapAnalyticsUseCase` — scrap by type, by stage, by model
- `GetWipSummaryUseCase` — total WIP across all active orders
- `GetPackingEfficiencyReportUseCase` — verification variances, packing throughput

**Repository:** `ProductionReportingRepository`
- All methods are aggregate queries; all must have `take` caps per F04 pattern
- No computed writes — reporting only

**API Endpoints:**
- `GET /v1/production/reports/dashboard` — overall dashboard
- `GET /v1/production/reports/orders/:id/progress` — order progress detail
- `GET /v1/production/reports/scrap` — scrap analytics (filterable by date range, model, type)
- `GET /v1/production/reports/wip` — WIP summary
- `GET /v1/production/reports/packing-efficiency` — packing efficiency

**Acceptance Criteria:** See `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P11
