# Sprint 19 — Operational Dashboard

**Version target:** v0.12.0-dashboard
**Prerequisite:** Sprint 18 (Reporting) complete

---

## Objectives

Implement real-time operational dashboard endpoints: KPI aggregations, status summaries, and alert indicators. These are lightweight, frequently-polled endpoints designed for dashboard UIs. They favor speed over completeness.

---

## Scope

### Extension of `src/modules/reporting/` with a `dashboard/` sub-module

No new schema entities — dashboard queries operate against existing tables.

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `GetOperationalKPIsUseCase` | Today's key metrics: units produced, orders in progress, alerts |
| `GetProductionLineSummaryUseCase` | Real-time WIP count per active production line |
| `GetInventoryAlertUseCase` | Materials below reorder threshold |
| `GetPendingApprovalsUseCase` | Count of pending workflow steps by type |
| `GetCMOProgressSummaryUseCase` | Active CMOs: % complete, days remaining |
| `GetShipmentsDueTodayUseCase` | Shipments scheduled for today's dispatch |
| `GetDefectAlertUseCase` | Production orders exceeding defect rate threshold |

---

## Architecture Constraints

- All dashboard endpoints are read-only — no writes
- KPI queries must complete in < 200ms (enforce via integration test on real DB when available)
- Dashboard responses must never exceed 50 items — they are summary views, not paginated reports
- Cache headers: dashboard endpoints may return `Cache-Control: max-age=30` — consistent with 30-second polling
- `@Roles`: all dashboard endpoints available to all authenticated users (operators need visibility too)

---

## Testing Requirements

- All 7 use cases must have unit tests
- Test: non-empty system, empty system (no production orders yet), partial data
- Minimum new tests: 35

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0, `npm run build` clean, all tests passing
- [ ] KPI endpoint returns response < 200ms on unit tests (future: integration tests on real DB)
- [ ] Inventory alert threshold is configurable per material type
- [ ] ADR-034 written (Dashboard Architecture)

---

## Exit Criteria

Sprint 19 complete when all acceptance criteria checked, quality gates pass, `v0.12.0-dashboard` released.
