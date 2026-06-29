# 07 — Production Acceptance Criteria

| Field | Value |
|---|---|
| **Purpose** | Define per-feature Definition of Ready, Definition of Done, and quality gates |
| **Scope** | All acceptance criteria for P01–P11 |
| **Audience** | Implementing agents, QA |
| **Status** | ACTIVE |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Per-feature |
| **Version** | 1.0 |

**Dependencies:** `02_PRODUCTION_FEATURE_QUEUE.md`, `03_PRODUCTION_BUSINESS_RULES.md`  
**Related FEOS:** FEOS-01 Article II (Definition of Ready), FEOS-01 Article III (Definition of Done), FEOS-08 (Test Governance)  
**Related KEB:** KEB-04  

---

## Global Standards

### Definition of Ready (per FEOS-01 Article II)

A feature is READY to implement when ALL of the following are true:

1. All listed dependencies are in state DONE
2. The relevant section of this document is written
3. The schema tables required are present in `prisma/schema.prisma`
4. The business rules governing this feature are documented in `03_PRODUCTION_BUSINESS_RULES.md`
5. The implementing agent understands the optimistic lock requirements (if any)

### Definition of Done (per FEOS-01 Article III)

A feature is DONE when ALL of the following are true:

1. All use cases are implemented with corresponding spec files
2. `npm run build` → zero TypeScript errors
3. `npm run lint` → zero ESLint errors
4. `npm run test` → all tests pass (existing + new)
5. All new endpoints have `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse` decorators
6. All new DTOs have `@ApiProperty()` on every field
7. All new routes are versioned (`version: '1'`)
8. Feature is documented in `08_PRODUCTION_PROGRESS_TEMPLATE.md`
9. Feature report is completed in `09_PRODUCTION_REPORT_TEMPLATE.md` format

### Test Standards (per FEOS-08)

- Every use case has a `.spec.ts` file in the same directory
- Repositories are mocked in unit tests (never hit the real DB)
- Global modules (`PrismaModule`, `LoggerModule`, `AuditModule`, `DocumentNumberingModule`) are NOT imported in test modules — they are mocked
- The `@nestjs/testing` `Test.createTestingModule()` pattern is used throughout
- Mock objects must include all repository methods used by the use case under test
- Optimistic lock retry behavior must be tested (mock conflict on first call, success on retry)

---

## P01 — Production Order Management

### Acceptance Criteria

**AC-P01-01:** `POST /v1/production/orders` creates a production order with status DRAFT and auto-generated `order_number` (via DocumentNumberingService).

**AC-P01-02:** `order_number` is unique; duplicate creation for the same CMO line with FULL type is rejected.

**AC-P01-03:** `PATCH .../plan` transitions DRAFT → PLANNED; fails with 400 if no parts exist.

**AC-P01-04:** `PATCH .../start` transitions PLANNED → IN_PRODUCTION and initializes stage log records; fails with 400 if any part is not RELEASED.

**AC-P01-05:** `PATCH .../complete` fails with 400 if any stage log is not COMPLETE.

**AC-P01-06:** `PATCH .../close` fails with 400 if packing order is not POSTED.

**AC-P01-07:** `GET /v1/production/orders` returns paginated results; status filter works correctly.

**AC-P01-08:** BigInt IDs are serialized as strings in all responses.

**Unit Tests Required:**
- `CreateProductionOrderUseCase` — happy path, duplicate order_number handling
- `PlanProductionOrderUseCase` — happy path, no-parts guard
- `StartProductionUseCase` — happy path, unreleased-parts guard
- `CompleteProductionUseCase` — happy path, incomplete-stages guard
- `CloseProductionOrderUseCase` — happy path, unpacked guard

---

## P02 — Material Release

### Acceptance Criteria

**AC-P02-01:** `POST .../release-groups` creates a release group atomically; if any line fails, the entire group rolls back.

**AC-P02-02:** Cannot release from a bag not RESERVED for this order; returns 400.

**AC-P02-03:** Cannot release more dozens than the bag's `reserved_dozens` for this order; returns 400.

**AC-P02-04:** After full release of a bag (`reserved_dozens = 0`), bag status changes to RELEASED.

**AC-P02-05:** CMO line `remaining_dozens` is decremented with optimistic lock; conflict returns 409 after retries.

**AC-P02-06:** `production_order_parts.status` → RELEASED when all bags for that part are RELEASED.

**AC-P02-07:** An `inventory_transactions` record with type=RELEASE is created per line.

**AC-P02-08:** `group_number` is sequential per order (1, 2, 3...).

**Unit Tests Required:**
- `CreateReleaseGroupUseCase` — happy path (single line), multi-line, over-release guard, wrong bag status guard, optimistic lock retry/failure

---

## P03 — Production Stage Tracking

### Acceptance Criteria

**AC-P03-01:** On order start, `production_stage_logs` records are created (one per stage) with status PENDING.

**AC-P03-02:** Cannot start a stage before the previous stage is COMPLETE; returns 400.

**AC-P03-03:** First stage `input_dozens` equals total released dozens for the order.

**AC-P03-04:** `RecordStageOutput` fails with 400 if `output + scrap + incomplete ≠ input` (conservation law).

**AC-P03-05:** Stage completion with `scrap_dozens > 0` requires at least one `scrap_records` entry.

**AC-P03-06:** Stage completion with `incomplete_dozens > 0` requires at least one `incomplete_item_records` entry.

**AC-P03-07:** A `WIP_CONSUMPTION` transaction is created on stage completion.

**AC-P03-08:** Last stage completion triggers quality output recording path.

**Unit Tests Required:**
- `StartStageUseCase` — happy path, previous-stage-not-complete guard
- `RecordStageOutputUseCase` — happy path, conservation violation, scrap/incomplete validation, WIP update trigger

---

## P04 — WIP Inventory Management

### Acceptance Criteria

**AC-P04-01:** `wip_inventory` record is created on first stage completion for an (order, part) pair.

**AC-P04-02:** Subsequent stage completions update (not duplicate) the WIP record.

**AC-P04-03:** Optimistic lock conflict on `wip_inventory` retries up to 3 times; after 3 failures returns 409.

**AC-P04-04:** `dozens_in_wip >= 0` is enforced; attempt to set negative value fails.

**AC-P04-05:** `GET .../wip` returns current WIP positions for all parts on the order.

**Unit Tests Required:**
- `UpdateWipOnStageCompleteUseCase` — create path, update path, optimistic lock retry, negative balance guard

---

## P05 — Scrap & Incomplete Recording

### Acceptance Criteria

**AC-P05-01:** `GET .../scrap` returns totals by type (aggregated across all stages).

**AC-P05-02:** `GET .../incomplete` returns totals by reason.

**AC-P05-03:** Both endpoints return 404 if order not found.

**Unit Tests Required:**
- `GetScrapSummaryUseCase` — happy path, empty order
- `GetIncompleteSummaryUseCase` — happy path, empty order

---

## P06 — Quality Output

### Acceptance Criteria

**AC-P06-01:** `RecordQualityOutput` creates a `quality_output_boxes` record on first recording for a (order, color, size).

**AC-P06-02:** Subsequent recordings for the same (order, color, size) accumulate (upsert-add, not replace).

**AC-P06-03:** Optimistic lock on `quality_output_boxes` retries up to 3 times; 409 on persistent conflict.

**AC-P06-04:** A `QUALITY_OUTPUT` inventory transaction is created per recording.

**AC-P06-05:** `dozens_available >= 0` enforced; cannot record negative output.

**Unit Tests Required:**
- `RecordQualityOutputUseCase` — create path, accumulate path, optimistic lock retry

---

## P07 — Return to Warehouse

### Acceptance Criteria

**AC-P07-01:** Cannot return from a bag not previously released to this order; returns 400.

**AC-P07-02:** Cannot return more dozens than were released for that bag; returns 400.

**AC-P07-03:** A `RETURN` inventory transaction is created.

**AC-P07-04:** Bag status reverts to RECEIVED if all dozens are returned.

**AC-P07-05:** `production_order_parts.status` → RETURNED if WIP reaches 0 for that part.

**Unit Tests Required:**
- `ReturnMaterialUseCase` — happy path, over-return guard, wrong bag guard, status revert path

---

## P08 — Packing Execution

### Acceptance Criteria

**AC-P08-01:** Cannot create packing order if production order is not PRODUCTION_COMPLETE; returns 400.

**AC-P08-02:** Cannot create a second packing order for the same production order; returns 409.

**AC-P08-03:** Active packing pattern must exist for the model; returns 404 if missing.

**AC-P08-04:** Assembly consumes from `quality_output_boxes` with optimistic lock; conflict → 409 after retries.

**AC-P08-05:** `dozen_assembly_lines.dozens_consumed` is NOT written directly (it is DB-generated).

**AC-P08-06:** `packing_verifications.variance_dozens` is NOT written directly (it is DB-generated).

**AC-P08-07:** Cannot POST packing order without an approved verification; returns 400.

**AC-P08-08:** POST creates `finished_goods_bags` and `PACKING` inventory transactions atomically.

**Unit Tests Required:**
- `CreatePackingOrderUseCase` — happy path, wrong order status, duplicate guard, missing pattern
- `AddAssemblyUseCase` — happy path, optimistic lock retry, insufficient QO
- `RecordVerificationUseCase` — happy path, wrong status
- `ApproveVerificationUseCase` — happy path, already approved
- `PostPackingOrderUseCase` — happy path, no approved verification, FG bag creation

---

## P09 — Finished Goods Management

### Acceptance Criteria

**AC-P09-01:** FG bags can only be created via `PostPackingOrderUseCase` (no direct creation endpoint).

**AC-P09-02:** `GET /v1/production/finished-goods` returns paginated results; all filters work correctly.

**AC-P09-03:** `GET /v1/production/finished-goods/:id` returns 404 for unknown bag.

**Unit Tests Required:**
- `ListFinishedGoodsBagsUseCase` — happy path, filters, pagination
- `GetFinishedGoodsBagUseCase` — happy path, 404

---

## P10 — Supplementary Material Requests

### Acceptance Criteria

**AC-P10-01:** Cannot create a supplementary request for NEGLIGENCE reason without a negligence record; returns 400.

**AC-P10-02:** Cannot create a request for an order that is not IN_PRODUCTION; returns 400.

**AC-P10-03:** Status transitions are strictly enforced; out-of-order transitions return 400.

**AC-P10-04:** `request_number` is auto-generated by DocumentNumberingService.

**AC-P10-05:** TRANSFERRED creates `SUPPLEMENTARY_RELEASE` inventory transactions per line.

**AC-P10-06:** Cannot cancel a TRANSFERRED or REJECTED request; returns 400.

**Unit Tests Required:**
- `CreateSupplementaryRequestUseCase` — happy path, NEGLIGENCE without record guard, wrong order status
- `ApproveSupplementaryRequestUseCase` — happy path, wrong status
- `TransferSupplementaryMaterialUseCase` — happy path, optimistic lock, inventory transaction creation
- `CancelSupplementaryRequestUseCase` — happy path, terminal state guard

---

## P11 — Production Reporting

### Acceptance Criteria

**AC-P11-01:** Dashboard returns correct counts for each `OrderStatusEnum` value.

**AC-P11-02:** All reporting repository methods have `take` caps (follow F04 pattern, see F04 commit `baf6368`).

**AC-P11-03:** Date range filters are applied correctly; invalid dates return 400.

**AC-P11-04:** Reports return empty results (not errors) when no data matches filters.

**Unit Tests Required:**
- `GetProductionDashboardUseCase` — happy path, empty data
- `GetOrderProgressReportUseCase` — happy path, 404
- `GetScrapAnalyticsUseCase` — happy path with type filter
- `GetWipSummaryUseCase` — happy path

---

## Performance Gate

Per F04 standards (committed `baf6368`), all new repository methods that may return large result sets must include `take` caps:

| Query Type | Cap |
|---|---|
| Stage logs per order | `take: 100` (max stages per line) |
| Scrap records per order | `take: 500` |
| Incomplete records per order | `take: 500` |
| Quality output boxes per order | `take: 200` |
| Assembly lines per packing order | `take: 500` |
| Reporting aggregate queries | `take: 5000` |

---

## Security Gate

All endpoints must be protected. Verify:

- `@ApiBearerAuth('JWT')` on controller class
- `@Roles(...)` on all controller methods or the class
- Sensitive operations (approve, post, close) require MANAGER or above
- No endpoint accepts a user ID from the request body for privileged operations — actor from JWT only
