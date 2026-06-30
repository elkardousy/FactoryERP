# Engineering Decision Report — P09: Finished Goods Management

| Field | Value |
|---|---|
| **Feature** | P09 — Finished Goods Management Engine |
| **Date** | 2026-06-30 |
| **Author** | Implementing Agent |
| **Status** | FINAL |

---

## ED-P09-001 — No `packing_order_id` on `finished_goods_bags`

**Context:** `finished_goods_bags` has no `packing_order_id` column. There is no schema-level link from an FG bag to the packing order that produced it.

**Impact:**
- Cannot enforce "one FG bag per packing order" at the DB level.
- Cannot query FG bags by packing order.
- For FULL orders, `cmo_line_id` (carried from `production_orders.cmo_line_id`) provides indirect traceability.
- For PARTIAL orders (no CMO), there is no persistent link to the originating packing order after creation.

**Decision:** Accept the schema limitation. Never invent columns. Pass `cmo_line_id` from the production order for FULL orders to preserve indirect traceability. Document the gap. Multiple FG bags per packing order are architecturally possible — no constraint prevents it.

---

## ED-P09-002 — BR-FG01 Superseded by P09 MEC

**Context:** `BR-FG01` states "FG Bags Created Only on Packing Post — finished_goods_bags records are created exclusively by the PostPackingOrderUseCase. No standalone creation endpoint exists." The P09 MEC explicitly defines `CreateFinishedGoods` as a standalone command.

**Decision:** The P09 MEC is the authoritative tasking contract and supersedes BR-FG01. `CreateFinishedGoods` is implemented as an explicit POST endpoint. The business logic gate (packing order must be POSTED) preserves the original intent: FG bags are only created after packing is complete.

---

## ED-P09-003 — `customer_id` Resolution (BR-FG02)

**Context:** `BR-FG02` states customer_id comes from the CMO chain (`cmo_line_id → cmo_id → customer_id`), but is **[UNKNOWN]** for PARTIAL orders. `finished_goods_bags.customer_id` is NOT NULL.

**Decision:** Caller provides `customer_id` in the request body for all orders. For FULL orders (production order has `cmo_line_id`), the system auto-derives the customer from the CMO chain and uses it — the caller's value is ignored. For PARTIAL orders (no CMO), `customer_id` from the request body is used directly (any valid customer). This ensures correct customer attribution for FULL orders and unblocks PARTIAL orders without schema changes.

---

## ED-P09-004 — `warehouse_id` Resolution (BR-FG03)

**Context:** `BR-FG03` states the FG warehouse is the "designated FG warehouse" but is **[UNKNOWN]** — no schema source exists for auto-derivation.

**Decision:** Caller provides `warehouse_id` in the request body. The system validates the warehouse exists. No auto-derive is possible without additional schema (e.g., a `default_fg_warehouse_id` on production lines or a system config). Documented as a future enhancement when the designation mechanism is defined.

---

## ED-P09-005 — No Inventory Transaction on `CreateFinishedGoods`

**Context:** The P09 MEC states "Every Finished Goods creation must create Inventory Transactions through Inventory infrastructure." However, `TxnTypeEnum` does not include a FINISHED_GOODS or FG_RECEIPT type. Adding one would require a schema migration and enum change — out of P09 scope. Additionally, the PACKING inventory transaction already created in P08's `PostPackingOrder` represents the physical movement from production → finished goods.

**Decision:** No additional inventory transaction is created in `CreateFinishedGoods`. The PACKING transaction from P08 is the inventory record for the production-to-FG movement. `finished_goods_bags` IS the FG inventory register — a row in this table represents a bag of finished goods in the system. A new TxnTypeEnum value (e.g., `FG_RECEIPT`) would be the correct fix but requires a migration beyond P09 scope. Documented for future resolution.

---

## ED-P09-006 — `dozens_qty` Defaulting and Validation

**Context:** `finished_goods_bags.dozens_qty` is NOT NULL. For `CreateFinishedGoods`, the operator may want to create a partial FG bag (not the full assembled amount), or the full amount.

**Decision:** `dozens_qty` is an optional request field. If omitted, defaults to `packing_order.assembled_dozens`. If provided, must be > 0. No upper-bound validation is enforced against `assembled_dozens` because multiple FG bags may be created from a single packing order (partial splits), and without `packing_order_id` on `finished_goods_bags` there is no way to track cumulative totals.

---

## ED-P09-007 — `session_id` Left Null

**Context:** `finished_goods_bags.session_id BigInt?` — purpose not documented in the current schema or business rules. No `packing_sessions` or similar table exists in the schema.

**Decision:** `session_id` is left null in all FG bag records created by `CreateFinishedGoods`. Will be revisited if a sessions concept is introduced in a future phase.
