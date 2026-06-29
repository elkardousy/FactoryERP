# 04 — Production API Specification

| Field | Value |
|---|---|
| **Purpose** | Complete REST API specification for all Production Module endpoints |
| **Scope** | Every endpoint, HTTP method, request/response shape, and status code |
| **Audience** | Implementing agents, frontend/integration developers, QA |
| **Status** | ACTIVE |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Per-feature |
| **Version** | 1.0 |

**Dependencies:** `02_PRODUCTION_FEATURE_QUEUE.md`, `03_PRODUCTION_BUSINESS_RULES.md`  
**Related FEOS:** FEOS-11 (Module Governance — Swagger requirements)  
**Related KEB:** KEB-04 (Database Knowledge — field types)  

**Global rules:**
- All endpoints are prefixed `/v1/`
- All endpoints require `Authorization: Bearer <JWT>` (except none — all production routes are protected)
- All controllers declare `@ApiBearerAuth('JWT')` and `version: '1'`
- BigInt IDs are serialized as strings in all responses
- All paginated responses return `{ items: T[], meta: { page, limit, total, totalPages } }`
- All error responses follow `ErrorResponse` shape from `src/core/responses/`

---

## P01 — Production Orders

### POST /v1/production/orders
**Create a production order in DRAFT status**

Request body:
```json
{
  "model_id": "string",
  "line_id": "string",
  "release_type": "FULL | PARTIAL",
  "cmo_line_id": "string | null",
  "target_dozens": "number",
  "part_ids": ["string"]
}
```

Response `201`:
```json
{
  "order_id": "string",
  "order_number": "string",
  "status": "DRAFT",
  "model_id": "string",
  "line_id": "string",
  "release_type": "FULL",
  "cmo_line_id": "string | null",
  "target_dozens": "number",
  "parts": [
    { "order_part_id": "string", "part_id": "string", "status": "PENDING" }
  ],
  "created_at": "ISO8601"
}
```

Errors: `400` (validation), `404` (model/line/CMO not found), `409` (conflict)

---

### GET /v1/production/orders
**List production orders (paginated)**

Query params: `status?`, `line_id?`, `model_id?`, `page` (default 1), `limit` (default 20, max 100)

Response `200`: `PaginatedResult<ProductionOrderSummaryDto>`

---

### GET /v1/production/orders/:id
**Get a single production order with parts**

Response `200`: `ProductionOrderResponseDto` (full detail including parts array)

Errors: `404`

---

### PATCH /v1/production/orders/:id/plan
**Transition order DRAFT → PLANNED**

Request body: `{}` (no body required)

Response `200`: Updated `ProductionOrderResponseDto`

Errors: `400` (no parts, wrong status), `404`

---

### PATCH /v1/production/orders/:id/start
**Transition order PLANNED → IN_PRODUCTION; initializes stage logs**

Request body: `{}` (no body required)

Response `200`: Updated `ProductionOrderResponseDto`

Errors: `400` (parts not all RELEASED, wrong status), `404`

---

### PATCH /v1/production/orders/:id/complete
**Transition order IN_PRODUCTION → PRODUCTION_COMPLETE**

Request body: `{}` (no body required)

Response `200`: Updated `ProductionOrderResponseDto`

Errors: `400` (stages not all COMPLETE, wrong status), `404`

---

### PATCH /v1/production/orders/:id/close
**Transition order PRODUCTION_COMPLETE → CLOSED**

Request body: `{}` (no body required)

Response `200`: Updated `ProductionOrderResponseDto`

Errors: `400` (packing not POSTED, wrong status), `404`

---

## P02 — Material Release

### POST /v1/production/orders/:id/release-groups
**Create a material release group for a production order**

Request body:
```json
{
  "lines": [
    {
      "bag_id": "string",
      "dozens_to_release": "number",
      "source_warehouse_id": "string"
    }
  ]
}
```

Response `201`:
```json
{
  "release_group_id": "string",
  "order_id": "string",
  "group_number": "number",
  "lines": [
    {
      "release_line_id": "string",
      "bag_id": "string",
      "dozens_released": "number",
      "source_warehouse_id": "string"
    }
  ],
  "created_at": "ISO8601"
}
```

Errors: `400` (bag not reserved for this order, over-release), `404` (order/bag not found), `409` (optimistic lock on CMO line)

---

### GET /v1/production/orders/:id/release-groups
**List all release groups for a production order**

Response `200`: `ReleaseGroupResponseDto[]` (array, not paginated — typically < 10 per order)

---

### GET /v1/production/release-groups/:groupId
**Get a single release group with all lines**

Response `200`: `ReleaseGroupResponseDto` with full lines array

Errors: `404`

---

## P03 — Production Stage Tracking

### GET /v1/production/orders/:id/stages
**List all stage logs for a production order**

Response `200`: `ProductionStageLogDto[]` (ordered by stage sequence)

---

### GET /v1/production/orders/:id/stages/:stageId
**Get a single stage log with scrap and incomplete records**

Response `200`:
```json
{
  "log_id": "string",
  "order_id": "string",
  "stage_id": "string",
  "status": "PENDING | IN_PROGRESS | COMPLETE",
  "input_dozens": "number",
  "output_dozens": "number | null",
  "scrap_dozens": "number | null",
  "incomplete_dozens": "number | null",
  "scrap_records": [...],
  "incomplete_records": [...]
}
```

Errors: `404`

---

### PATCH /v1/production/orders/:id/stages/:stageId/start
**Start a production stage (PENDING → IN_PROGRESS)**

Request body: `{}` (no body required)

Response `200`: `ProductionStageLogDto`

Errors: `400` (previous stage not COMPLETE, wrong status), `404`

---

### POST /v1/production/orders/:id/stages/:stageId/output
**Record stage output, scrap, and incomplete dozens**

Request body:
```json
{
  "output_dozens": "number",
  "scrap_records": [
    {
      "scrap_type": "SEWING_DEFECT | MATERIAL_DEFECT | STAIN | DAMAGE | SIZE_ISSUE | OTHER",
      "dozens_scrapped": "number",
      "color_id": "string | null",
      "size_id": "string | null"
    }
  ],
  "incomplete_records": [
    {
      "reason": "MISSING_PART | MISSING_MATERIAL | PRODUCTION_ISSUE | OTHER",
      "dozens_incomplete": "number",
      "notes": "string | null"
    }
  ]
}
```

Response `200`: `ProductionStageLogDto` (status → COMPLETE)

Errors: `400` (conservation violation: output+scrap+incomplete ≠ input, wrong stage status), `404`

---

## P05 — Scrap & Incomplete Analytics

### GET /v1/production/orders/:id/scrap
**Get scrap summary for a production order**

Response `200`:
```json
{
  "order_id": "string",
  "total_scrap_dozens": "number",
  "by_type": {
    "SEWING_DEFECT": "number",
    "MATERIAL_DEFECT": "number",
    ...
  },
  "by_stage": [
    { "stage_id": "string", "stage_name": "string", "scrap_dozens": "number" }
  ]
}
```

---

### GET /v1/production/orders/:id/incomplete
**Get incomplete item summary for a production order**

Response `200`:
```json
{
  "order_id": "string",
  "total_incomplete_dozens": "number",
  "by_reason": {
    "MISSING_PART": "number",
    "MISSING_MATERIAL": "number",
    ...
  }
}
```

---

## P04 — WIP Inventory

### GET /v1/production/orders/:id/wip
**Get live WIP positions for a production order**

Response `200`:
```json
{
  "order_id": "string",
  "positions": [
    {
      "wip_id": "string",
      "part_id": "string",
      "dozens_in_wip": "number",
      "version": "string"
    }
  ]
}
```

---

## P06 — Quality Output

### POST /v1/production/orders/:id/quality-output
**Record quality-passed dozens for a color/size combination**

Request body:
```json
{
  "color_id": "string",
  "size_id": "string",
  "dozens_passed": "number"
}
```

Response `201`:
```json
{
  "box_id": "string",
  "order_id": "string",
  "color_id": "string",
  "size_id": "string",
  "dozens_available": "number",
  "version": "string"
}
```

Errors: `400` (order not PRODUCTION_COMPLETE), `404`, `409` (optimistic lock)

---

### GET /v1/production/orders/:id/quality-output
**List all quality output boxes for a production order**

Response `200`: `QualityOutputBoxDto[]`

---

## P07 — Return to Warehouse

### POST /v1/production/orders/:id/returns
**Return unused material from production back to a warehouse**

Request body:
```json
{
  "part_id": "string",
  "bag_id": "string",
  "dozens_returned": "number",
  "destination_warehouse_id": "string",
  "reason": "string"
}
```

Response `201`:
```json
{
  "return_id": "string",
  "order_id": "string",
  "part_id": "string",
  "bag_id": "string",
  "dozens_returned": "number",
  "destination_warehouse_id": "string",
  "reason": "string",
  "created_at": "ISO8601"
}
```

Errors: `400` (bag not released to this order, over-return), `404`, `409`

---

### GET /v1/production/orders/:id/returns
**List all return transactions for a production order**

Response `200`: `ReturnTransactionDto[]`

---

## P08 — Packing Execution

### POST /v1/production/packing-orders
**Create a packing order for a PRODUCTION_COMPLETE production order**

Request body:
```json
{
  "production_order_id": "string"
}
```

Response `201`:
```json
{
  "packing_order_id": "string",
  "production_order_id": "string",
  "status": "DRAFT",
  "created_at": "ISO8601"
}
```

Errors: `400` (order not PRODUCTION_COMPLETE, no QO boxes), `404`, `409` (packing order already exists)

---

### GET /v1/production/packing-orders/:id
**Get packing order with assemblies and verification**

Response `200`: Full `PackingOrderResponseDto`

---

### POST /v1/production/packing-orders/:id/assemblies
**Add a dozen assembly event to a packing order**

Request body:
```json
{
  "lines": [
    {
      "quality_output_box_id": "string",
      "pieces_consumed": "number"
    }
  ]
}
```

Response `201`: `DozenAssemblyDto` (with computed `dozens_consumed` per line)

Errors: `400` (insufficient dozens_available), `404`, `409` (optimistic lock on QO box)

---

### PATCH /v1/production/packing-orders/:id/start
**Transition packing order DRAFT → IN_PROCESS**

Response `200`: `PackingOrderResponseDto`

---

### PATCH /v1/production/packing-orders/:id/assemble
**Transition packing order IN_PROCESS → ASSEMBLED**

Response `200`: `PackingOrderResponseDto`

---

### POST /v1/production/packing-orders/:id/verification
**Record physical count for packing verification**

Request body:
```json
{
  "physical_count_dozens": "number"
}
```

Response `201`:
```json
{
  "verification_id": "string",
  "packing_order_id": "string",
  "physical_count_dozens": "number",
  "system_count_dozens": "number",
  "variance_dozens": "number",
  "is_approved": false,
  "created_at": "ISO8601"
}
```

Errors: `400` (packing not ASSEMBLED), `404`, `409` (verification already exists)

---

### PATCH /v1/production/packing-orders/:id/verification/approve
**Supervisor approves packing verification; transitions → VERIFIED**

Request body: `{}` (no body required — actor from JWT)

Response `200`: Updated `PackingVerificationDto`

Errors: `400` (already approved), `403` (insufficient role), `404`

---

### PATCH /v1/production/packing-orders/:id/post
**Post packing order (VERIFIED → POSTED); creates finished goods bags**

Request body: `{}` (no body required)

Response `200`: `PackingOrderResponseDto` with `finished_goods_bags` included

Errors: `400` (not VERIFIED, no approved verification), `404`, `409`

---

## P09 — Finished Goods

### GET /v1/production/finished-goods
**List finished goods bags (paginated)**

Query params: `warehouse_id?`, `customer_id?`, `model_id?`, `cmo_line_id?`, `page`, `limit`

Response `200`: `PaginatedResult<FinishedGoodsBagDto>`

---

### GET /v1/production/finished-goods/:id
**Get a single finished goods bag**

Response `200`: `FinishedGoodsBagDto`

Errors: `404`

---

## P10 — Supplementary Material Requests

### POST /v1/production/supplementary-requests
**Create a supplementary material request in DRAFT**

Request body:
```json
{
  "order_id": "string",
  "reason": "NEGLIGENCE | GENUINE_SHORTAGE",
  "lines": [
    {
      "part_id": "string",
      "bag_id": "string",
      "dozens_requested": "number"
    }
  ],
  "negligence": {
    "responsible_user_id": "string",
    "notes": "string"
  }
}
```

Note: `negligence` is required when `reason = NEGLIGENCE`.

Response `201`: `SupplementaryRequestResponseDto`

Errors: `400` (NEGLIGENCE without responsible party, order not IN_PRODUCTION), `404`

---

### GET /v1/production/supplementary-requests
**List supplementary requests (paginated)**

Query params: `order_id?`, `status?`, `reason?`, `page`, `limit`

Response `200`: `PaginatedResult<SupplementaryRequestSummaryDto>`

---

### GET /v1/production/supplementary-requests/:id
**Get a supplementary request with lines and negligence record**

Response `200`: `SupplementaryRequestResponseDto` (full detail)

Errors: `404`

---

### PATCH /v1/production/supplementary-requests/:id/submit
**Submit for approval (DRAFT → PENDING_APPROVAL)**

Response `200`: `SupplementaryRequestResponseDto`

Errors: `400` (wrong status), `404`

---

### PATCH /v1/production/supplementary-requests/:id/approve
**Approve the request (PENDING_APPROVAL → APPROVED)**

Response `200`: `SupplementaryRequestResponseDto`

Errors: `400` (wrong status), `403` (insufficient role), `404`

---

### PATCH /v1/production/supplementary-requests/:id/reject
**Reject the request (PENDING_APPROVAL → REJECTED)**

Request body:
```json
{
  "rejection_reason": "string"
}
```

Response `200`: `SupplementaryRequestResponseDto`

Errors: `400` (wrong status), `403`, `404`

---

### PATCH /v1/production/supplementary-requests/:id/transfer
**Transfer material (APPROVED → TRANSFERRED); creates SUPPLEMENTARY_RELEASE transactions**

Response `200`: `SupplementaryRequestResponseDto`

Errors: `400` (wrong status), `404`, `409`

---

### PATCH /v1/production/supplementary-requests/:id/cancel
**Cancel a supplementary request**

Response `200`: `SupplementaryRequestResponseDto`

Errors: `400` (already TRANSFERRED or REJECTED), `404`

---

## P11 — Production Reporting

### GET /v1/production/reports/dashboard
**Production overview dashboard**

Response `200`:
```json
{
  "orders_by_status": {
    "DRAFT": "number",
    "PLANNED": "number",
    "IN_PRODUCTION": "number",
    "PRODUCTION_COMPLETE": "number",
    "CLOSED": "number"
  },
  "total_wip_dozens": "number",
  "total_fg_dozens": "number",
  "open_supplementary_requests": "number"
}
```

---

### GET /v1/production/reports/orders/:id/progress
**Detailed progress report for a single order**

Response `200`:
```json
{
  "order_id": "string",
  "order_number": "string",
  "status": "string",
  "stages": [
    {
      "stage_id": "string",
      "stage_name": "string",
      "status": "string",
      "input_dozens": "number",
      "output_dozens": "number",
      "scrap_dozens": "number",
      "scrap_rate_pct": "number"
    }
  ],
  "total_released_dozens": "number",
  "total_wip_dozens": "number",
  "total_quality_output_dozens": "number",
  "total_scrap_dozens": "number"
}
```

---

### GET /v1/production/reports/scrap
**Scrap analytics (filterable)**

Query params: `from_date?`, `to_date?`, `model_id?`, `scrap_type?`

Response `200`: Aggregated scrap data

---

### GET /v1/production/reports/wip
**WIP summary across all active orders**

Response `200`: WIP totals grouped by order and part

---

### GET /v1/production/reports/packing-efficiency
**Packing efficiency report**

Query params: `from_date?`, `to_date?`

Response `200`: Verification variances, approval rates, throughput by period
