# Engineering Decision Report — Phase 4 APEC

**Date:** 2026-06-29  
**Phase:** 4 — Inventory Module Completion  
**Status:** PHASE 4 COMPLETE (8 of 10 features; 2 permanently blocked)

---

## Executive Summary

Phase 4 completed 8 of 10 planned features. Two features — Warehouse Location Engine (F06) and Inventory Event Integration (F07) — are permanently blocked by missing infrastructure that cannot be added under Phase 4 constraints (no schema changes, no new infrastructure). All other features are implemented, tested, linted, built, and committed.

---

## Blocked Feature Analysis

### Feature 06 — Warehouse Location Engine

**Blocked reason:** The feature requires zone/rack/shelf/bin hierarchy tables that do not exist in `prisma/schema.prisma`.

**Evidence:**
- The `warehouses` model contains only: `warehouse_id`, `warehouse_code`, `warehouse_name`, `warehouse_type`, `is_active`.
- No `warehouse_zones`, `racks`, `shelves`, or `bins` tables exist anywhere in the 2229-line schema.
- The `physical_bags.current_warehouse_id` FK points directly to `warehouses` — there is no sub-location pointer.

**Options for future phases:**
1. Add `warehouse_locations` table with hierarchy (`zone_id`, `rack_id`, `shelf_id`, `bin_id`) and FK from `physical_bags`. Requires new migration as `postgres` superuser.
2. Implement flat "location code" stored as a string field on `physical_bags` (lower fidelity, no migration needed for foreign key, but no referential integrity).

**Recommendation:** Option 1. Define `warehouse_locations` table in the next schema phase, add `physical_bags.location_id` FK, then implement this feature in Phase 5.

---

### Feature 07 — Inventory Event Integration

**Blocked reason:** No event bus, event emitter, or message queue infrastructure exists in the repository.

**Evidence:**
- Full codebase glob for `src/**/*event*`, `src/**/*bus*`, `src/**/*emitter*`, `src/**/*queue*` returned zero results.
- NestJS `@nestjs/event-emitter` or `@nestjs/bull` packages are not in `package.json`.
- The `AuditModule` exists but is a write-only audit log, not a publish/subscribe bus.

**Options for future phases:**
1. Install `@nestjs/event-emitter` for in-process events (lightweight, no external dependency). Emit `InventoryAdjustedEvent`, `BagMovedEvent`, `CycleCountOpenedEvent`, etc.
2. Integrate a message broker (RabbitMQ, Redis Streams) for cross-service events (heavier, requires infrastructure).

**Recommendation:** Option 1 for an internal event bus first. Define event contracts before implementing. Phase 5 scope: install the package, define event DTOs, emit from `InventoryAdjustmentService` and `PhysicalBagMovementService`, subscribe from any downstream module (e.g., production).

---

## Completed Features Summary

| # | Feature | Commit | Tests |
|---|---------|--------|-------|
| 01 | Inventory Availability Engine | c937069 | +7 |
| 02 | Inventory Balance Engine | bc6f56a | +6 |
| 03 | Physical Bag Movement | 0600f54 | +10 |
| 04 | Inventory Adjustment (ledger-atomic) | 499dc8d | +10 |
| 05 | Cycle Count Engine | 5474570 | +9 |
| 08 | Inventory Performance | a399864 | +6 |
| 09 | Inventory Reporting | ced83d3 | +6 |
| 10 | Inventory Integration | bdc4d3a | +6 |

**Total new tests:** 60 (197 baseline → 255 final)  
**All quality gates:** Build PASS · Lint PASS · Tests PASS · Prisma Validate PASS

---

## Key Technical Decisions Made in Phase 4

### D1 — Cycle Count mapped to `inventory_investigations`
No dedicated cycle-count table exists. Feature 05 maps cycle counts to `inventory_investigations` with `investigation_type = INVENTORY_VARIANCE`. All repository queries are scoped to this type, fully isolating the feature without schema changes.

### D2 — `AdjustmentReasonEnum` defined at application layer
`inventory_transactions.txn_type` uses the DB enum `TxnTypeEnum = ADJUSTMENT` for all adjustments. The reason sub-classification (DAMAGE, LOSS, POSITIVE_CORRECTION, etc.) is a validation concern only — stored as a prefix in the `notes` field. No DB enum change required.

### D3 — `upsertOnHandInTx` closes the pre-existing ledger gap
Sprint 11.2's `AdjustInventoryUseCase` only wrote `inventory_transactions` and never updated `inventory_bags.dozens_on_hand`. Feature 04 closes this gap atomically using Prisma upsert with `{ increment: delta }` inside `executeInTransaction`.

### D4 — Integration via `physical_bags.current_order_id` and `wip_inventory`
Feature 10 bridges inventory ↔ production using two existing FK relationships: `physical_bags.current_order_id` (bags in WIP) and `wip_inventory.order_id` (WIP ledger balance). No new tables required.
