# Sprint 18 — Reporting Engine

**Version target:** v0.11.0-reporting
**Prerequisite:** All operational sprints (11–17) complete

---

## Objectives

Implement the reporting layer: aggregated queries for operational reporting, period-based summaries, export-ready data structures. This sprint does NOT implement a frontend — it implements the API endpoints that power dashboards and reports.

---

## Scope

### New Domain Module: `src/modules/reporting/`

No new schema entities — all reporting is read-only aggregation against existing tables.

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `ProductionSummaryReportUseCase` | Units produced per line per period |
| `InventoryValuationReportUseCase` | Current stock levels per warehouse |
| `CMOFulfillmentReportUseCase` | Fulfillment % per CMO per customer |
| `SupplierPerformanceReportUseCase` | On-time delivery, rejection rate per supplier |
| `DefectRateReportUseCase` | Defects per production order, per stage |
| `WorkshiftUtilizationReportUseCase` | Production output per shift |
| `PurchaseOrderStatusReportUseCase` | PO status summary per period |
| `StockMovementReportUseCase` | Inventory flow by transaction type per period |

---

## Architecture Constraints

- All reporting use cases are **read-only** — no writes, no audit events
- Reporting repositories may use raw Prisma `$queryRaw` for complex aggregations where the type-safe client is insufficient
- All reports accept `DateRangeDto` as input for period filtering
- Report endpoints must use `@Roles(UserRole.system_admin, UserRole.factory_manager, UserRole.accountant)`
- Response types include pagination metadata and summary totals
- Reports must never block OLTP operations — use read replicas or async generation if needed in future

---

## Testing Requirements

- All 8 use cases must have unit tests with mocked repositories
- Mock repositories return pre-computed aggregation results
- Test: valid date range, empty result (returns structured empty response, not 404), invalid date range (start > end throws 422)
- Minimum new tests: 40

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0, `npm run build` clean, all tests passing
- [ ] All reports return structured responses with `items[]`, totals, and period metadata
- [ ] Empty period returns `{ items: [], total: 0, period: {...} }` not 404
- [ ] All report endpoints require accountant role or higher
- [ ] ADR-033 written (Reporting Architecture)

---

## Exit Criteria

Sprint 18 complete when all acceptance criteria checked, quality gates pass, `v0.11.0-reporting` released.
