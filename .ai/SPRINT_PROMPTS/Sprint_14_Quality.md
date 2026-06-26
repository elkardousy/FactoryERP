# Sprint 14 — Quality Control

**Version target:** v0.7.0-quality
**Prerequisite:** Sprint 13 (Production) complete

---

## Objectives

Implement quality control tracking: defect recording at production stages, supplementary material requests for non-standard material needs, and quality reporting aggregations.

---

## Scope

### New Domain Module: `src/modules/quality/`

**Schema entities:**
- `defect_records` — quality defects recorded at production stages
- `supplementary_material_requests` — requests for materials outside standard BOM
- `supplementary_request_items` — individual items within a request

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `RecordDefectUseCase` | Record a defect at a specific production stage |
| `GetDefectUseCase` | Retrieve defect record with context |
| `ListDefectsUseCase` | Paginated list — filterable by order/stage/severity |
| `CreateSupplementaryRequestUseCase` | Request non-standard materials |
| `ApproveSupplementaryRequestUseCase` | Approve request (warehouse manager) |
| `RejectSupplementaryRequestUseCase` | Reject with reason |
| `FulfillSupplementaryRequestUseCase` | Mark request fulfilled from inventory |
| `GetQualityReportUseCase` | Defect rate per production order |

---

## Architecture Constraints

- Defects are linked to production orders and specific production stages
- Supplementary requests require approval before fulfillment — status: PENDING → APPROVED/REJECTED → FULFILLED
- `FulfillSupplementaryRequestUseCase` must atomically deduct inventory via InventoryModule
- Defect recording does NOT halt production — it is informational only
- `@Roles`: defect recording = operator+; approval = warehouse_manager+; reporting = manager+

---

## Testing Requirements

- All 8 use cases must have test suites
- Supplementary request state machine: test all valid and invalid transitions
- Minimum new tests: 40

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0, `npm run build` clean, all tests passing
- [ ] Supplementary request state machine enforced
- [ ] Defects properly linked to production orders and stages
- [ ] Quality report returns correct defect rates
- [ ] ADR-029 written (Quality Control Architecture)

---

## Exit Criteria

Sprint 14 complete when all acceptance criteria checked, quality gates pass, `v0.7.0-quality` released.
