# Performance Targets

**Status:** Architecture Design — Phase 3 Sprint 0
**Date:** 2026-06-27
**Authority:** Chief ERP Architect / Database Architect
**Version:** 1.0.0

---

## Workload Estimation

### Factory Profile (Target Deployment)

| Dimension | Value | Basis |
|-----------|-------|-------|
| Production lines | 5–10 | Factory size |
| Active employees | 150–300 | Factory profile |
| Warehouse operators | 5–15 | Concurrent inventory users |
| Concurrent API sessions (peak) | 15–40 | Warehouse + supervisors + managers |
| Barcode scan events per hour (peak) | 200–500 | Receiving + release operations |
| Production shifts per day | 2–3 | Factory schedule |

### Daily Volume Estimates

| Operation | Daily Count | Peak Hour |
|-----------|-------------|-----------|
| Physical bags received | 50–200 bags/day | 20–50/hour |
| Stock reservations created | 50–150/day | 20–40/hour |
| Inventory transactions inserted | 300–1,500/day | 100–400/hour |
| Audit events inserted | 600–3,000/day | 200–800/hour |
| Stock level reads (`GetStockLevel`) | 500–2,000/day | 200–500/hour |
| Physical bag list queries | 200–800/day | 50–200/hour |

---

## Annual Table Growth Projections

| Table | Year 1 | Year 3 | Year 5 | Partitioning Threshold |
|-------|--------|--------|--------|----------------------|
| `inventory_transactions` | ~400K rows | ~1.5M | ~3M | 3M (monthly partition) |
| `audit_events` | ~1M rows | ~4M | ~8M | Already designed for it |
| `physical_bag_movements` | ~200K | ~700K | ~1.5M | 2M |
| `physical_bag_reservations` | ~50K | ~150K | ~300K | No partitioning needed |
| `physical_bags` | ~40K | ~120K | ~250K | No partitioning needed |
| `physical_bag_contents` | ~200K | ~600K | ~1.2M | No partitioning needed |
| `inventory_bags` (aggregate) | ~500 rows | ~2K | ~5K | No partitioning needed (small) |
| `wip_inventory` | ~2K/year | ~6K | ~10K | No partitioning needed |
| `quality_output_boxes` | ~10K/year | ~30K | ~50K | No partitioning needed |

---

## Response Time Targets

| Endpoint | Target P50 | Target P99 | Notes |
|----------|-----------|-----------|-------|
| POST /v1/physical-bags | < 150ms | < 500ms | Includes T1 transaction |
| GET /v1/physical-bags/:id | < 50ms | < 150ms | Single-row read with include |
| GET /v1/physical-bags | < 100ms | < 300ms | Paginated list, max 100 rows |
| GET /v1/inventory/stock | < 30ms | < 100ms | Single aggregate row read |
| GET /v1/inventory/bags | < 100ms | < 300ms | Paginated, small table |
| GET /v1/inventory/transactions | < 150ms | < 400ms | Requires date range filter |
| POST /v1/inventory/reservations | < 200ms | < 600ms | T2 includes FOR UPDATE |
| DELETE /v1/inventory/reservations/:id | < 150ms | < 500ms | T4 transaction |
| PATCH /v1/inventory/bags/:id/adjust | < 200ms | < 600ms | T7 transaction |

---

## Index Analysis

### Existing Indexes — Inventory Tables

#### `physical_bags`
| Index | Columns | Purpose | Assessment |
|-------|---------|---------|-----------|
| PK | `bag_id` | Row lookup | ✅ Present |
| UQ | `bag_code` | Barcode uniqueness | ✅ Present |
| IDX | `container_id` | Find bags by container | ✅ Present |
| IDX | `model_id, part_id` | Find bags by material | ✅ Present |
| IDX | `status` | Filter by bag status | ✅ Present |
| IDX | `current_warehouse_id` | Find bags in warehouse | ✅ Present |
| **MISSING** | `customer_id` | Bags by customer | ⚠️ Not present — add if customer-scoped queries are common |
| **MISSING** | `current_order_id` | Bags in production order | ⚠️ Not present — needed for production release queries |

#### `inventory_bags`
| Index | Columns | Purpose | Assessment |
|-------|---------|---------|-----------|
| PK | `bag_id` | Row lookup | ✅ Present |
| UQ | `warehouse_id, model_id, part_id` | Stock key | ✅ Present (covers GetStockLevel) |
| IDX | `warehouse_id, model_id, part_id` | Duplicate of UQ | ✅ Redundant but harmless |
| IDX | `model_id` | Find stock by model | ✅ Present |
| IDX | `model_id, part_id, warehouse_id` | Alternative ordering | ✅ Present |

#### `inventory_transactions`
| Index | Columns | Purpose | Assessment |
|-------|---------|---------|-----------|
| PK | `txn_id, executed_at` | Composite — partition-ready | ✅ Present |
| IDX | `model_id, executed_at` | Material history by date | ✅ Present |
| IDX | `txn_type, executed_at` | Filter by type + date | ✅ Present |
| IDX | `txn_reference` | Find txns by reference doc | ✅ Present |
| IDX | `executed_by, executed_at` | Operator activity log | ✅ Present |

#### `physical_bag_reservations` — CRITICAL GAPS
| Index | Columns | Purpose | Assessment |
|-------|---------|---------|-----------|
| PK | `reservation_id` | Row lookup | ✅ Present |
| UQ | `bag_id, order_id` | Prevent double reservation | ✅ Present |
| **MISSING** | `bag_id, status` | Find active reservation for a bag | ❌ MISSING — full scan |
| **MISSING** | `order_id, status` | Find active reservations for an order | ❌ MISSING — full scan |
| **MISSING** | `status` | Count active reservations | ❌ MISSING — full scan |

#### `physical_bag_movements`
| Index | Columns | Purpose | Assessment |
|-------|---------|---------|-----------|
| PK | `movement_id` | Row lookup | ✅ Present |
| IDX | `bag_id, performed_at` | Bag movement history | ✅ Present |

#### `wip_inventory`
| Index | Columns | Purpose | Assessment |
|-------|---------|---------|-----------|
| PK | `wip_id` | Row lookup | ✅ Present |
| UQ | `order_id, part_id` | WIP key | ✅ Present |
| IDX | `order_id, part_id` | WIP queries | ✅ Present (covers production queries) |
| IDX | `line_id` | WIP by production line | ✅ Present |

#### `quality_output_boxes`
| Index | Columns | Purpose | Assessment |
|-------|---------|---------|-----------|
| PK | `box_id` | Row lookup | ✅ Present |
| UQ | `order_id, color_id, size_id` | Quality output key | ✅ Present |
| IDX | `order_id` | All output for an order | ✅ Present |
| IDX | `order_id, color_id, size_id` | Specific output lookup | ✅ Present |

---

## Required Schema Changes for Performance (Pre-Sprint 11)

### PERF-1 (Critical): Add indexes to `physical_bag_reservations`

```prisma
model physical_bag_reservations {
  ...
  @@index([bag_id, status])         // Find active reservation for a specific bag
  @@index([order_id, status])       // Find all reservations for a production order
  @@index([status])                 // Count active/released reservations
}
```

Without these indexes, every `CreateStockReservationUseCase` call performs a full table scan to check for existing active reservations on a bag.

### PERF-2 (High): Add `current_order_id` index to `physical_bags`

```prisma
model physical_bags {
  ...
  @@index([current_order_id])       // Find all bags assigned to a production order
}
```

This index is needed when production queries "all bags for order X".

### PERF-3 (Medium): Enforce date range on `ListInventoryTransactionsUseCase`

`inventory_transactions` will grow to millions of rows. The use case MUST enforce a maximum date range. Recommended: max 31 days per query. Enforce in DTO:
```typescript
@IsDateString()
from: string;  // required

@IsDateString()
to: string;    // required, must be <= from + 31 days
```

---

## Partial Index Recommendations (Future Sprint)

When `inventory_transactions` exceeds 1M rows, add a partial index for recent-record queries:

```sql
-- For active reservation counts (not Prisma PSL — manage in migration SQL)
CREATE INDEX CONCURRENTLY idx_pbr_active
  ON factory.physical_bag_reservations (bag_id, reserved_at)
  WHERE status = 'ACTIVE';

-- For recent inventory transactions (last 90 days)
CREATE INDEX CONCURRENTLY idx_inv_txn_recent
  ON factory.inventory_transactions (model_id, executed_at)
  WHERE executed_at > NOW() - INTERVAL '90 days';
```

These are Sprint 18 (Reporting) concerns — not required for Sprint 11.

---

## Caching Strategy

### Sprint 11: No Application Caching Required

At the projected workload (< 500 inventory reads/hour), PostgreSQL with proper indexes is sufficient. Do not add caching prematurely.

### Sprint 18+ Caching Candidates

| Cache Key | Value | TTL | Rationale |
|-----------|-------|-----|-----------|
| `stock:{wh_id}:{model_id}:{part_id}` | `inventory_bags` row | 30 seconds | High-read availability query |
| `active_reservations:{order_id}` | `physical_bag_reservations[]` | 60 seconds | Production release planning |
| `stock_summary:{warehouse_id}` | Aggregate by model/part | 5 minutes | Dashboard read |

Cache implementation: swap `MemoryPermissionCache` pattern → `IStockCache` interface with `RedisStockCache` implementation. The interface-based design is already proven by `IPermissionCache` (ADR-014).

---

## Expected Bottlenecks

| Bottleneck | When | Mitigation |
|-----------|------|-----------|
| ATP calculation (available-to-promise) | Sprint 13 when reservations grow | Add `dozens_reserved` column to `inventory_bags` (Sprint 13) |
| Transaction history queries without date range | Sprint 18 reports | Enforce date range in all ListTransactions queries |
| inventory_transactions table scans | Year 2 (1M+ rows) | Monthly partitioning (Sprint 18) |
| Concurrent optimistic lock retries on high-velocity stock | Peak production days | 3-retry policy; if still failing, investigate serial bottleneck |
| Per-request session DB read | Sprint 20 (> 100 concurrent users) | Redis session cache (Sprint 20) |

---

## Read/Write Separation Readiness

The current architecture is **not** using read replicas. The following preconditions are met when a read replica is introduced:

1. ✅ All write operations go through explicit transactions
2. ✅ Read use cases (`GetStockLevel`, `ListInventoryBags`, etc.) use separate read-only query patterns
3. ✅ No writes happen in read use cases
4. ⚠️ Prisma requires separate `datasource` configuration for read replica — ADR needed at that point
5. ⚠️ Eventual consistency lag must be acceptable for stock-level reads (recommendation: reads go to primary for reservation flows; replica only for reporting)
