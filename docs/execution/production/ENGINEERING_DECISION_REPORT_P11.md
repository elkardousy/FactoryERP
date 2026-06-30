# Engineering Decision Report — P11: Production Reporting Engine

| Field | Value |
|---|---|
| **Phase** | P11 — Production Reporting |
| **Status** | FINAL |
| **Date** | 2026-07-01 |
| **Author** | Claude Code (P11 MEC execution) |

---

## ED-P11-001 — No `started_at` on `production_orders`; Cycle Time Approximated

**Problem:** `production_orders` stores `created_at` and `closed_at` but no `started_at`. Accurate cycle-time KPIs (time-from-start-to-complete) cannot be derived solely from the order record.

**Decision:** Production start time is approximated from the earliest `production_stage_logs.started_at` for the order. This field is nullable; orders with no started stage logs have no start-time data. The KPI dashboard does not include average cycle time — only scrap rate, completion rate, WIP totals, and FG totals, which are all fully supported by the schema. A dedicated `started_at` column on `production_orders` would require a schema migration.

**Impact:** No average cycle time KPI is exposed in P11. The `historical_report` includes `created_at` and `closed_at` for consumers to derive their own cycle times.

---

## ED-P11-002 — Model Names and Line Names Excluded from Report Response DTOs

**Problem:** Report DTOs for orders, stages, WIP, etc., reference `model_id` and `line_id` as BigInt foreign keys. Joining to `models` and `production_lines` in every report query would inflate query complexity and page sizes significantly.

**Decision:** All reporting DTOs carry FK IDs (`model_id`, `line_id`, `stage_id`, etc.) as strings. Name resolution is delegated to the consumer (frontend, BI tool). This avoids N+1 joins across 12 report endpoints. A future "enriched report" feature could add name resolution with a dedicated lookup endpoint or a materialized view.

**Impact:** Report consumers must resolve model/line/stage names via separate master-data APIs if needed. This is acceptable for a reporting layer.

---

## ED-P11-003 — `ProductionReportingMapper` and `ProductionReportingFactory` Merged into Service and DTO Layer

**Problem:** The MEC prescribes three separate classes: `ProductionReportingService`, `ProductionReportingMapper`, and `ProductionReportingFactory`. Per CLAUDE.md: "Three similar lines is better than a premature abstraction. Don't add features, refactor, or introduce abstractions beyond what the task requires."

**Decision:** Mapper functions are co-located in `production-reporting.dto.ts` as standalone exported functions (consistent with P07–P10 pattern). Factory logic (building composite report DTOs from raw repository data) is implemented as private methods on `ProductionReportingService`. No separate `ProductionReportingMapper` or `ProductionReportingFactory` class is created.

**Impact:** Reduces class count by 2 with no loss of functionality. Consistent with existing module patterns.

---

## ED-P11-004 — `line_kpi_summary` and `employee_kpi_daily` Tables Excluded from P11

**Problem:** `line_kpi_summary` and `employee_kpi_daily` tables exist in the schema and contain KPI data. However, these tables are populated by an external system process (not by any P01–P10 feature). They have no confirmed write path in the production module and their data consistency cannot be guaranteed.

**Decision:** Line utilization KPIs and employee KPI data are not included in P11 reports. KPIs are derived from `production_stage_logs`, `wip_inventory`, `finished_goods_bags`, and `production_orders` — all populated by verified P01–P10 features. If `line_kpi_summary` is populated in a future phase, a `GetLineKPIReport` endpoint can be added.

**Impact:** No "line utilization" or "employee performance" reports are exposed in P11.

---

## ED-P11-005 — Scrap Totals from `production_stage_logs` Aggregates, Not `scrap_records` Detail

**Problem:** Both `production_stage_logs.scrap_dozens` (aggregated) and `scrap_records` (individual scrap events) contain scrap data. The stage log aggregate is simpler and faster. The `scrap_records` detail provides scrap type breakdown.

**Decision:** The KPI dashboard scrap total uses `production_stage_logs.scrap_dozens` aggregate (single `_sum` query). The scrap report endpoint uses `scrap_records` for paginated detail (scrap type, color, size). Both paths are consistent and complementary.

**Impact:** KPI scrap total may differ from `scrap_records` sum if any scrap was recorded directly on the stage log without a corresponding `scrap_records` entry (implementation detail of P03/P05). This is an acceptable approximation for dashboard-level reporting.

---

## ED-P11-006 — Summary Report Scoped to Single Order (NotFoundException if Missing)

**Problem:** The MEC mentions `GetProductionSummary` as a query. This could mean an order-level summary OR a global summary. Given the schema has per-order stage logs, WIP, quality, packing, and supplementary data, an order-scoped summary is the only meaningful implementation.

**Decision:** `GetProductionSummary` requires `order_id` query parameter and returns a composite view of that order's production data. Returns `NotFoundException` if the order does not exist. A global summary is covered by `GetProductionDashboard` and `GetProductionKPIs`.

**Impact:** Consumers must provide an `order_id` to get the production summary.

---

## ED-P11-007 — Historical Report Uses `production_orders.created_at` for Date Range Filtering

**Problem:** "Historical production report" needs a time dimension. `production_orders` has `created_at` and `closed_at`. Using `created_at` for date range filtering finds orders created in the period; using `closed_at` finds completed orders in the period.

**Decision:** Historical report filters on `production_orders.created_at` (order creation date). This is consistent with the natural meaning of "production history" — what was started in the period. Consumers can filter closed orders by combining `status = CLOSED` with a date range.

**Impact:** Orders created before a date range but closed within it would NOT appear if filtering by `created_at` only. This is an acceptable limitation for a v1 historical report.
