# 06 — Production Data Flow

| Field | Value |
|---|---|
| **Purpose** | Document the complete data flow from CMO/Inventory through Production to Finished Goods |
| **Scope** | All data transformations and state changes across the full production lifecycle |
| **Audience** | Implementing agents, architects, integration developers |
| **Status** | ACTIVE |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Per-feature |
| **Version** | 1.0 |

**Dependencies:** `01_PRODUCTION_DOMAIN_MODEL.md`, `03_PRODUCTION_BUSINESS_RULES.md`  
**Related FEOS:** FEOS-01  
**Related KEB:** KEB-03 (Business Knowledge — primary), KEB-04 (Database Knowledge)  

---

## Overview: End-to-End Flow

```
CMO Line
  ↓ (reservation)
Inventory Bags (RESERVED)
  ↓ P01: Production Order Created
Production Order [DRAFT → PLANNED]
  ↓ P02: Material Release
  ├── Release Group + Lines created
  ├── inventory_bags.reserved_dozens decremented
  ├── inventory_transactions [RELEASE] written
  ├── physical_bags.status → RELEASED
  └── cmo_line.remaining_dozens decremented (optimistic lock)
  ↓ Production Order [PLANNED → IN_PRODUCTION]
  ├── production_stage_logs created (all stages, status=PENDING)
  ↓ P03: Stage-by-Stage Execution
  ├── Stage 1: PENDING → IN_PROGRESS
  │     input_dozens = total released dozens
  │   → RecordOutput → COMPLETE
  │     output + scrap + incomplete = input (conservation)
  │     inventory_transactions [WIP_CONSUMPTION] written
  │     wip_inventory upserted (optimistic lock)
  ├── Stage 2: (input = Stage 1 output)
  │   → ...same pattern...
  ├── Stage N (last stage): COMPLETE
  │     triggers quality output recording path
  ↓ P06: Quality Output
  ├── quality_output_boxes upserted per (order, color, size) (optimistic lock)
  └── inventory_transactions [QUALITY_OUTPUT] written
  ↓ Production Order [IN_PRODUCTION → PRODUCTION_COMPLETE]
  ↓ P08: Packing Execution
  ├── packing_orders created [DRAFT]
  ├── Assemblies added:
  │     quality_output_boxes.dozens_available decremented (optimistic lock)
  │     dozen_assemblies + dozen_assembly_lines created
  │     dozen_assembly_lines.dozens_consumed = pieces_consumed/12 (DB computed)
  ├── packing_orders [DRAFT → IN_PROCESS → ASSEMBLED]
  ├── packing_verifications created (physical count recorded)
  │     packing_verifications.variance_dozens = system - physical (DB computed)
  ├── Supervisor approves verification [is_approved = true]
  ├── packing_orders [ASSEMBLED → VERIFIED → POSTED]
  ↓ P09: Finished Goods Created (on POSTED)
  ├── finished_goods_bags created
  └── inventory_transactions [PACKING] written
  ↓ Production Order [PRODUCTION_COMPLETE → CLOSED]
```

---

## 1. Pre-Production: Inventory State

Before a production order can start, the inventory module must have:

| Entity | Required State |
|---|---|
| `inventory_bags` | Status = RESERVED, sufficient `reserved_dozens` |
| `garment_models` | Active, with parts configured |
| `production_lines` | Active (from production-setup module) |
| `production_stages` | Configured for the line (from production-setup module) |
| `packing_patterns` | Active pattern exists for the model |

---

## 2. Stage 1: Production Order Creation (P01)

**Input:** `CreateProductionOrderDto`  
**Actor:** Production Manager

**Writes:**
1. `production_orders` → INSERT (status=DRAFT, order_number from DocumentNumberingService)
2. `production_order_parts` → INSERT (one per part_id, status=PENDING)

**State after:**
```
production_orders.status = DRAFT
production_order_parts.status = PENDING (all)
```

**Plan transition:**
- Validates: parts exist
- `production_orders.status` → PLANNED

---

## 3. Stage 2: Material Release (P02)

**Input:** `CreateReleaseGroupDto` (one or more release waves)  
**Actor:** Warehouse Supervisor

**Writes per line (atomic within group):**
1. `release_groups` → INSERT
2. `release_group_lines` → INSERT (one per bag)
3. `inventory_bags` → UPDATE (`reserved_dozens -= dozens_released`)
4. `inventory_bags` → UPDATE (`status = RELEASED` when `reserved_dozens = 0`)
5. `physical_bags` → UPDATE (`status = RELEASED` when bag fully consumed)
6. `inventory_transactions` → INSERT (type=RELEASE)
7. `customer_manufacturing_order_lines` → UPDATE (`remaining_dozens -= dozens_released`) [optimistic lock]
8. `production_order_parts` → UPDATE (status=RELEASED) when all bags for that part are released

**Inventory ledger impact:**
```
inventory_bags.reserved_dozens: -N
inventory_bags.dozens_available: unchanged (material is in production, not available)
inventory_transactions: +1 RELEASE record per bag
```

**After full release of all parts:**
```
production_order_parts.status = RELEASED (all)
production_orders ready to start
```

---

## 4. Stage 3: Production Start (P01)

**Writes:**
1. `production_orders.status` → IN_PRODUCTION
2. `production_stage_logs` → INSERT (one per stage on the line, status=PENDING)

---

## 5. Stage 4: Stage Execution (P03 + P04)

**Per stage:**

**Start (PENDING → IN_PROGRESS):**
- `production_stage_logs.status` → IN_PROGRESS

**Record Output (IN_PROGRESS → COMPLETE):**
1. `production_stage_logs` → UPDATE (output_dozens, scrap_dozens, incomplete_dozens, status=COMPLETE)
2. `scrap_records` → INSERT (if scrap_dozens > 0)
3. `incomplete_item_records` → INSERT (if incomplete_dozens > 0)
4. `inventory_transactions` → INSERT (type=WIP_CONSUMPTION)
5. `wip_inventory` → UPSERT (optimistic lock) — `dozens_in_wip` updated per part

**Data flow through stages:**
```
Stage 1 input_dozens = sum(release_group_lines.dozens_released) for this order
Stage 1 output_dozens → Stage 2 input_dozens
Stage 2 output_dozens → Stage 3 input_dozens
...
Stage N output_dozens → quality_output_boxes.dozens_available
```

**Conservation invariant enforced at every stage:**
```
input = output + scrap + incomplete
```

---

## 6. Stage 5: Quality Output (P06)

**Trigger:** Last stage completes  
**Actor:** Quality Inspector

**Writes per (color, size) combination:**
1. `quality_output_boxes` → UPSERT (add `dozens_passed` to `dozens_available`) [optimistic lock]
2. `inventory_transactions` → INSERT (type=QUALITY_OUTPUT)

**After:**
```
quality_output_boxes: one record per (order, color, size), dozens_available = total passed
production_orders ready for PRODUCTION_COMPLETE transition
```

---

## 7. Stage 6: Production Complete (P01)

**Guard:** All `production_stage_logs` for order must be COMPLETE  
**Writes:**
1. `production_orders.status` → PRODUCTION_COMPLETE

---

## 8. Stage 7: Packing (P08)

**Packing order created:**
1. `packing_orders` → INSERT (status=DRAFT, production_order_id)

**Per assembly batch:**
1. `dozen_assemblies` → INSERT (sequence number)
2. `dozen_assembly_lines` → INSERT per QO box consumed (pieces_consumed only; `dozens_consumed` is DB-generated)
3. `quality_output_boxes` → UPDATE (`dozens_available -= lines.dozens_consumed`) [optimistic lock]

**Verification:**
1. `packing_verifications` → INSERT (`system_count_dozens` = sum of all assemblies, `physical_count_dozens` from supervisor input)
2. DB computes: `variance_dozens = system_count_dozens - physical_count_dozens`
3. `packing_verifications.is_approved` → true (supervisor approval step)

**Post:**
1. `packing_orders.status` → POSTED
2. `finished_goods_bags` → INSERT (one per color/size combination)
3. `inventory_transactions` → INSERT (type=PACKING, one per finished_goods_bag)

---

## 9. Stage 8: Production Order Closed (P01)

**Guard:** `packing_orders.status = POSTED`  
**Writes:**
1. `production_orders.status` → CLOSED

---

## 10. Exception Paths

### 10.1 Return to Warehouse (P07)

Can occur at any point after material release (production order must be IN_PRODUCTION or later).

**Writes:**
1. `return_transactions` → INSERT
2. `inventory_bags` → UPDATE (restore dozens to available or returned state)
3. `physical_bags` → UPDATE (status → RECEIVED if fully returned)
4. `inventory_transactions` → INSERT (type=RETURN)
5. `wip_inventory` → UPDATE (decrement, optimistic lock)
6. `production_order_parts` → UPDATE (status → RETURNED if wip reaches 0)

### 10.2 Supplementary Material Request (P10)

Can occur while production order is IN_PRODUCTION.

**On TRANSFERRED:**
1. `supplementary_material_requests.status` → TRANSFERRED
2. `inventory_bags` → UPDATE (decrement reserved/available for supplementary bag)
3. `inventory_transactions` → INSERT (type=SUPPLEMENTARY_RELEASE, one per request line)
4. `supplementary_request_lines` linked to bags now treated as additional released material

---

## 11. Inventory Transaction Summary

All production-triggered transactions in `inventory_transactions`:

| TxnType | When | Net Effect on inventory_bags |
|---|---|---|
| RELEASE | Material released from bag to production | reserved_dozens -= N; bag status → RELEASED |
| WIP_CONSUMPTION | Stage completes | tracking only (WIP already consumed) |
| QUALITY_OUTPUT | Quality output recorded | tracking only (output now in QO boxes) |
| PACKING | Packing order posted | creates FG bag; no change to inventory_bags |
| RETURN | Material returned from production | dozens restored; status reverts |
| SUPPLEMENTARY_RELEASE | Supplementary transfer | reserved_dozens -= N (same as RELEASE) |

---

## 12. Optimistic Lock Touch Points

| Table | Operation | Version Pattern |
|---|---|---|
| `wip_inventory` | Stage output recorded | Read version → UPDATE WHERE version = N → check rowCount = 1 |
| `quality_output_boxes` | Quality output upserted | Read version → UPDATE WHERE version = N → check rowCount = 1 |
| `quality_output_boxes` | Assembly consumes | Read version → UPDATE WHERE version = N → check rowCount = 1 |
| `customer_manufacturing_order_lines` | Material released | Read version → UPDATE WHERE version = N → check rowCount = 1 |

All conflicts raise `ConflictException` after max 3 retries.

---

## 13. Database-Generated Columns (Never Write Directly)

| Table | Column | Formula |
|---|---|---|
| `dozen_assembly_lines` | `dozens_consumed` | `pieces_consumed / 12` |
| `packing_verifications` | `variance_dozens` | `system_count_dozens - physical_count_dozens` |
| `customer_manufacturing_order_lines` | `remaining_dozens` | computed from releases (UNKNOWN: exact formula) |
