# Phase 3 — Inventory Engine Readiness Review

**Review Type:** Architecture Readiness Sprint (Sprint 0)
**Date:** 2026-06-27
**Reviewers:** Chief ERP Architect / Principal Software Engineer / Database Architect / Architecture Review Board
**Repository Baseline:** v0.3.0-business-foundation
**Subject:** Phase 3 — Transaction & Execution Engine (Sprint 11 — Inventory Engine Core)

---

## Executive Summary

The repository has been thoroughly audited across all 9 review phases: inventory domain, database transactions, domain model, event flow, concurrency, performance, scalability, inventory engine definition, and acceptance criteria.

**The overall finding is: READY WITH REQUIRED CHANGES.**

The Business Foundation is architecturally sound and provides the correct prerequisite layer. The Inventory domain model is well-designed in the Prisma schema with proper concurrency primitives (version columns), composite partition-ready keys, and a clear physical/logical bag separation. Six gaps must be resolved before Sprint 11 implementation begins. None are architectural blockers to the design — they are schema and configuration items.

---

## Readiness Scores

| Dimension | Score | Assessment |
|-----------|-------|-----------|
| **Architecture Readiness** | 8.5 / 10 | Clean Architecture layers sound; module boundaries clear; minor gaps in enum typing |
| **Inventory Domain Readiness** | 7.5 / 10 | Domain model well-defined in schema; ReservationStatusEnum and LocationTypeEnum missing |
| **Database Readiness** | 5.0 / 10 | Schema correct but **no migrations exist** — Critical blocker |
| **Performance Readiness** | 7.5 / 10 | Good index coverage; 3 missing indexes on `physical_bag_reservations` |
| **Concurrency Readiness** | 8.5 / 10 | Version columns present on all aggregate tables; pessimistic lock pattern documented |
| **Scalability Readiness** | 7.0 / 10 | BigInt PKs, composite keys, partitioning-ready; no Redis yet; single-instance |
| **ERP Execution Readiness** | 6.5 / 10 | Foundation complete; transactional layer not yet implemented; no integration tests |

---

## Phase 1 — Inventory Domain Review

### Aggregates Identified

| Aggregate | Root Table | Status |
|-----------|-----------|--------|
| PhysicalBag | `physical_bags` | ✅ Well-defined |
| InventoryBag (Stock Ledger) | `inventory_bags` | ✅ Well-defined with version |
| WIPInventory | `wip_inventory` | ✅ Well-defined with version |
| InventoryTransaction | `inventory_transactions` | ✅ Composite PK for partitioning |
| QualityOutputBox | `quality_output_boxes` | ✅ Well-defined with version |

### Domain Model Assessment

**Strengths:**
- Clear separation of physical bags (traceable units) from inventory bags (aggregate stock records)
- Optimistic locking (`version BigInt`) on all aggregate tables — correct pattern
- Composite PK on `inventory_transactions [txn_id, executed_at]` is architecturally forward-looking
- `BagStatusEnum` has all required lifecycle states: RECEIVED → AVAILABLE → RESERVED → RELEASED → IN_WIP → RETURNED → CLOSED
- `TxnTypeEnum` covers all inventory movement types: RECEIVING, RELEASE, WIP_CONSUMPTION, QUALITY_OUTPUT, PACKING, RETURN, ADJUSTMENT, SUPPLEMENTARY_RELEASE

**Gaps Identified:**

| Gap | Severity | Required Before Sprint 11 |
|-----|----------|--------------------------|
| G-1: `physical_bag_reservations.status` is `String` not enum | Critical | Yes (Gate G-4) |
| G-2: `inventory_transactions.from/to_location_type` are `String` not enum | High | Yes — first Sprint 11 commit |
| G-3: No ATP (available-to-promise) column on `inventory_bags` | Medium | No — defer to Sprint 13 |
| G-4: `physical_bags.updated_at` missing `@updatedAt` | High | Yes (Gate G-7) |
| G-5: No `current_order_id` index on `physical_bags` | High | Yes (Gate G-6) |
| G-6: No `is_damaged` sub-status concept | Low | No — defer |

**Domain Readiness:** CONDITIONALLY READY — G-1, G-2, G-4, G-5 must be resolved.

Full domain model: see `docs/architecture/INVENTORY_DOMAIN_MODEL.md`

---

## Phase 2 — Database Transaction Review

### Inventory Table Audit

#### `physical_bags` — PASS with Gap

| Attribute | Status | Notes |
|-----------|--------|-------|
| Primary Key | ✅ `bag_id BigInt @id @default(autoincrement())` | Correct |
| Unique constraint | ✅ `bag_code @unique` | Barcode globally unique |
| Foreign Keys | ✅ container_id, customer_id, model_id, part_id, warehouse_id | All present |
| Status field | ✅ `BagStatusEnum` | 7 states — complete lifecycle |
| Audit fields | ✅ `created_by`, `created_at` | Present |
| `updated_at` | ⚠️ Present but **missing `@updatedAt`** | Will not auto-update |
| `is_active` | N/A — uses status instead of soft-delete | Correct for lifecycle entity |
| Indexes | ✅ container_id, [model_id,part_id], status, current_warehouse_id | Adequate |
| **Missing index** | ❌ `current_order_id` | Required for production queries |
| Soft delete | N/A — CLOSED is terminal state | Correct |

#### `inventory_bags` — PASS

| Attribute | Status | Notes |
|-----------|--------|-------|
| Primary Key | ✅ `bag_id BigInt @id @default(autoincrement())` | Correct |
| Unique constraint | ✅ `[warehouse_id, model_id, part_id]` | Stock position unique |
| Version column | ✅ `version BigInt @default(0)` | Optimistic locking ready |
| `dozens_on_hand` | ✅ `Decimal(12,3)` | Correct precision |
| Indexes | ✅ Multiple composite indexes covering all query patterns | Excellent |
| **Missing** | ⚠️ No `CHECK (dozens_on_hand >= 0)` | Application must guard |

#### `inventory_transactions` — PASS

| Attribute | Status | Notes |
|-----------|--------|-------|
| Primary Key | ✅ `[txn_id, executed_at]` composite | Partition-ready |
| TxnType | ✅ `TxnTypeEnum` — 8 types | Complete |
| Location fields | ⚠️ `from/to_location_type` are `String @db.VarChar(20)` | Should be enum (G-2) |
| Immutability | ✅ No update operations planned — append-only | Correct |
| Indexes | ✅ model+date, type+date, reference, executor+date | Complete |
| `part_id`, `color_id`, `size_id` | ✅ Optional — supports both raw and finished goods | Correct |

#### `physical_bag_reservations` — FAIL (Missing Enum + Missing Indexes)

| Attribute | Status | Notes |
|-----------|--------|-------|
| Primary Key | ✅ `reservation_id BigInt @id` | Correct |
| Unique constraint | ✅ `[bag_id, order_id]` | Prevents double reservation |
| **Status field** | ❌ `String @db.VarChar(20) @default("ACTIVE")` | Must be `ReservationStatusEnum` |
| **Indexes** | ❌ None beyond unique constraint | Missing bag_id+status, order_id+status |
| Audit fields | ✅ `reserved_by`, `reserved_at`, `released_at` | Present |

#### `wip_inventory` — PASS

| Attribute | Status | Notes |
|-----------|--------|-------|
| Primary Key | ✅ `wip_id BigInt @id` | Correct |
| Unique constraint | ✅ `[order_id, part_id]` | WIP position unique |
| Version column | ✅ `version BigInt @default(0)` | Optimistic locking |
| Indexes | ✅ `[order_id, part_id]`, `line_id` | Covers all query patterns |

#### `quality_output_boxes` — PASS

| Attribute | Status | Notes |
|-----------|--------|-------|
| Primary Key | ✅ `box_id BigInt @id` | Correct |
| Unique constraint | ✅ `[order_id, color_id, size_id]` | Output position unique |
| Version column | ✅ `version BigInt @default(0)` | Optimistic locking |
| Indexes | ✅ Covers order and color/size combinations | Complete |

### Transaction Boundary Assessment

All 8 transaction boundaries (T1–T8) have been defined. See `docs/architecture/TRANSACTION_BOUNDARIES.md`.

**Database Readiness: FAIL** — No migrations exist. This is the single most critical blocker.

---

## Phase 3 — Domain Model Review

### Business Foundation → Transactional ERP Support

| Domain | Can Be Built | Prerequisites Available | Notes |
|--------|-------------|------------------------|-------|
| Inventory | ✅ Yes | warehouses, models, model_parts, customers, containers | All FK targets exist |
| Production | ✅ Yes (Sprint 13) | inventory + production_lines/stages | Needs inventory first |
| CMO | ✅ Yes (Sprint 12) | customers, models | Can be built in parallel with Inventory |
| Purchasing | ✅ Yes (Sprint 15) | containers, physical_bags | Needs inventory first |
| Shipping | ✅ Yes (Sprint 16) | CMO, finished_goods_bags | Needs CMO + packing |
| Quality | ✅ Yes (Sprint 14) | production_orders, wip_inventory | Needs production first |
| Planning | Future | All of the above | Sprint 19+ |

### Aggregate Boundary Validation

| Rule | Status |
|------|--------|
| PhysicalBag owns its contents, movements, and reservations | ✅ Correct |
| InventoryBag is NOT owned by PhysicalBag | ✅ Correct — separate aggregate |
| InventoryTransaction is NOT mutated after creation | ✅ Correct — append-only |
| WIPInventory is owned by the Production domain (Sprint 13) | ✅ Correct — Inventory creates but Production mutates |
| QualityOutputBox is owned by the Quality domain (Sprint 14) | ✅ Correct — boundary at Sprint 14 |

### Invariant Coverage

| Invariant | Defined | Enforcement Level |
|-----------|---------|------------------|
| Stock non-negative | ✅ BR-1 | Application + WHERE guard |
| Bag code globally unique | ✅ BR-14 | DB unique constraint |
| Reservation quantity ≤ bag quantity | ✅ BR-6 | Application pre-check |
| Status transitions valid | ✅ BR-8 through BR-13 | Application guard (no DB check) |
| Every quantity change has a txn record | ✅ BR-2 | Transaction boundary enforcement |
| Version matches before update | ✅ BR-3 | Optimistic lock WHERE clause |

**Domain Model Readiness: CONDITIONALLY READY** — see gaps G-1, G-2, G-4.

---

## Phase 4 — Inventory Event Flow Review

12 business events have been identified and documented. See `docs/architecture/INVENTORY_EVENT_FLOW.md`.

**Sprint 11 publishes:** EVT-001 (GoodsReceived), EVT-003 (BagReserved), EVT-004 (ReservationReleased), EVT-008 (InventoryAdjusted)

**Event Bus Decision:** Synchronous orchestration for Sprint 11. NestJS EventEmitter2 in Sprint 17. Message queue evaluated in Sprint 20.

**Event Readiness: READY** — no event bus required for Sprint 11.

---

## Phase 5 — Concurrency Review

### Concurrency Controls Assessment

| Control | Present | Table | Assessment |
|---------|---------|-------|-----------|
| Optimistic locking | ✅ | `inventory_bags`, `wip_inventory`, `quality_output_boxes` | All aggregate tables |
| Pessimistic locking (FOR UPDATE) | Pattern defined | `physical_bags` | `$queryRaw` required |
| Unique constraint prevention | ✅ | `physical_bag_reservations [bag_id, order_id]` | Duplicate reservation blocked |
| Lock ordering rule | Documented | Multi-bag operations | Ascending bag_id order |
| Retry policy | Documented | All optimistic lock holders | 3 retries, exponential backoff |

### Concurrency Scenario Assessment

| Scenario | Handled | Mechanism |
|----------|---------|-----------|
| Double reservation of same bag | ✅ | FOR UPDATE + status re-validation |
| Concurrent stock decrement (race condition) | ✅ | Optimistic lock + retry |
| Stock goes negative | ✅ | Pre-check + WHERE guard |
| Deadlock in multi-bag operation | ✅ | Ascending lock order |
| Supplementary release deadlock | ⚠️ Documented | Lock order: inventory_bags first, wip_inventory second |

### Gaps

| Gap | Severity | Mitigation |
|-----|----------|-----------|
| C-1: `physical_bag_reservations.status` is string | Critical | R2 (ReservationStatusEnum) |
| C-2: Missing indexes on `physical_bag_reservations` | High | R3 (add indexes) |
| C-3: No CHECK constraint on `dozens_on_hand >= 0` | Medium | Application guard is sufficient for Sprint 11; DB constraint recommended Sprint 13 |

**Concurrency Readiness: READY WITH SCHEMA CHANGES** (R2, R3)

Full strategy: see `docs/architecture/CONCURRENCY_STRATEGY.md`

---

## Phase 6 — Performance Review

### Index Coverage Assessment

| Table | Assessment |
|-------|-----------|
| `inventory_bags` | ✅ Excellent — all query patterns covered |
| `physical_bags` | ✅ Good — missing `current_order_id` index (PERF-2) |
| `inventory_transactions` | ✅ Excellent — composite PK + 4 indexes |
| `physical_bag_reservations` | ❌ Critical gap — 3 missing indexes (PERF-1) |
| `wip_inventory` | ✅ Good |
| `quality_output_boxes` | ✅ Good |
| `physical_bag_movements` | ✅ Good |

### Response Time Targets Defined

All endpoints have P50 and P99 targets. See `docs/architecture/PERFORMANCE_TARGETS.md`.

### Caching

No caching required for Sprint 11 at expected workload (< 500 inventory reads/hour). Redis caching deferred to Sprint 17+.

**Performance Readiness: READY WITH SCHEMA CHANGES** (PERF-1, PERF-2)

---

## Phase 7 — Scalability Review

### Short-Term Scalability (Sprints 11–16)

| Concern | Status |
|---------|--------|
| BigInt PKs everywhere | ✅ All primary keys |
| Composite PK on partition-ready tables | ✅ `inventory_transactions`, `audit_events` |
| Version columns for concurrent access | ✅ All aggregate tables |
| Indexes for common query patterns | ✅ With noted gaps |
| Single-instance design | ✅ Acceptable for current scale |

### Long-Term Scalability (Sprint 20+)

| Future Need | Current Readiness | When |
|------------|------------------|------|
| Multiple warehouse operators (barcode scanners) | ✅ FOR UPDATE handles concurrent scans | Sprint 11 |
| Redis permission cache (multi-instance) | ✅ `IPermissionCache` interface ready | Sprint 20 |
| Redis session cache | ✅ Session token design supports Redis | Sprint 20 |
| PostgreSQL read replica | ✅ Write and read use cases are already separated | Sprint 20 |
| `inventory_transactions` partitioning | ✅ Composite PK ready | Sprint 18 |
| NestJS EventEmitter2 | ✅ Synchronous calls will be easy to migrate | Sprint 17 |
| Message queue (Redis/RabbitMQ) | Design documented in ADR-025 | Sprint 20 |
| CQRS for reporting | ✅ Append-only transaction ledger is natural CQRS write side | Sprint 20+ |
| Microservices decomposition | Design documented in ADR-025 | Post v1.0 |
| Mobile/offline barcode scanning | Not designed yet | Sprint 20 |

**Scalability Readiness: READY** — no blockers for Sprint 11; long-term path is defined.

---

## Phase 8 — Inventory Engine Definition

**Full contract:** see `docs/architecture/SPRINT11_CONTRACT.md`

**Summary:**
- Module: `src/modules/inventory/`
- Repositories: 4 (PhysicalBags, InventoryBags, InventoryTransactions, StockReservations)
- Use Cases: 9 (4 writes, 5 reads)
- Controllers: 3 (PhysicalBags, Inventory, StockReservations)
- ADR: ADR-026 (written)
- Tests: ≥ 45 new tests
- Version: v0.5.0-inventory-engine

---

## Phase 9 — Acceptance Criteria

### Functional Acceptance

- [ ] POST /v1/physical-bags: creates physical_bags + physical_bag_contents + inventory_bags + inventory_transactions atomically
- [ ] POST /v1/physical-bags with duplicate `bag_code`: returns 409
- [ ] GET /v1/physical-bags/:id: returns bag with contents and movements
- [ ] GET /v1/physical-bags with filters (status, warehouse_id, model_id): returns paginated results
- [ ] GET /v1/inventory/stock: returns current `dozen_on_hand` for a warehouse+model+part
- [ ] GET /v1/inventory/stock for non-existent combination: returns `{ dozens_on_hand: 0 }`
- [ ] GET /v1/inventory/bags: returns paginated stock ledger
- [ ] GET /v1/inventory/transactions without date range: returns 400 Bad Request
- [ ] GET /v1/inventory/transactions with valid date range: returns paginated results
- [ ] POST /v1/inventory/reservations for AVAILABLE bag: succeeds, bag status → RESERVED
- [ ] POST /v1/inventory/reservations for RESERVED/RELEASED/IN_WIP bag: returns 409
- [ ] POST /v1/inventory/reservations for quantity > current_dozens: returns 422
- [ ] POST /v1/inventory/reservations when two concurrent requests race: only one succeeds; other gets 409
- [ ] DELETE /v1/inventory/reservations/:id: bag status → AVAILABLE, reservation → CANCELLED
- [ ] PATCH /v1/inventory/bags/:id/adjust without justification: returns 400
- [ ] PATCH /v1/inventory/bags/:id/adjust to negative: returns 422
- [ ] All write operations produce corresponding `inventory_transactions` records
- [ ] Stock cannot go negative under any operation sequence

### Architecture Acceptance

- [ ] No `PrismaService` injected directly in use cases or controllers
- [ ] No cross-module repository injection (Rule CM-1)
- [ ] All write use cases use `executeInTransaction()`
- [ ] `inventory_bags` updates use `WHERE version = $expected AND dozens_on_hand >= $delta`
- [ ] `physical_bags` status changes use `SELECT FOR UPDATE` inside transaction
- [ ] Optimistic lock failures retry ≤ 3 times; ConflictException on failure
- [ ] Architecture Review gate: PASS
- [ ] ADR-026 status: Accepted

### Performance Acceptance

- [ ] GET /v1/inventory/stock responds in < 50ms (P50) on a warm database
- [ ] POST /v1/physical-bags responds in < 150ms (P50) under normal load
- [ ] POST /v1/inventory/reservations responds in < 200ms (P50)
- [ ] No unbounded `findMany()` calls — all list queries have `take` and `skip`
- [ ] ListInventoryTransactions enforces mandatory date range — missing range → 400

### Security Acceptance

- [ ] All endpoints require `@Roles()` — none are `@Public()`
- [ ] Minimum role for writes: `warehouse_manager` or `system_admin`
- [ ] No PrismaService injection in controllers
- [ ] No `$queryRawUnsafe()` calls
- [ ] `$queryRaw` (for SELECT FOR UPDATE) uses parameterized template literals only
- [ ] Security Review gate: PASS

### Documentation Acceptance

- [ ] ADR-026 written and accepted
- [ ] ADR-026 added to `docs/architecture/ADR_INDEX.md`
- [ ] `docs/PROJECT_MEMORY.md` updated with Sprint 11 metrics
- [ ] `docs/checkpoints/PROJECT_CHECKPOINT.md` updated
- [ ] `docs/architecture/ARCHITECTURE_TIMELINE.md` updated
- [ ] `docs/releases/v0.5.0-inventory-engine.md` created
- [ ] Documentation Review gate: PASS

### Testing Acceptance

- [ ] `npm run test` exits 0 — 0 failures
- [ ] Total tests ≥ 187 (142 existing + 45 new)
- [ ] All existing 142 tests continue passing (no regression)
- [ ] ReceivePhysicalBagUseCase: atomic rollback test, duplicate bag_code test, optimistic lock retry test
- [ ] CreateStockReservationUseCase: all 4 failure paths tested
- [ ] ListInventoryTransactionsUseCase: missing date range returns 400 test
- [ ] Testing Gate: PASS

### Repository Acceptance

- [ ] `npm run lint` exits 0 — 0 errors, 0 warnings
- [ ] `npm run build` exits 0 — no TypeScript compilation errors
- [ ] Git status: clean at sprint completion
- [ ] Git tag `v0.5.0-inventory-engine` created and annotated
- [ ] Release Gate: PASS

---

## Required Changes Before Sprint 11

### R1 — CRITICAL: Apply Database Migrations

**What:** Run `npx prisma migrate dev --name initial-schema` against a live PostgreSQL instance with the `factory` schema.

**Why:** No queries have ever been executed against a real database. This is the most critical risk in the entire repository (RISK-C1). Sprint 11 cannot proceed without migrations because every use case requires database access.

**How to satisfy Gate G-1:**
```bash
# 1. Ensure PostgreSQL is running with factory schema
# 2. Set DATABASE_URL in .env
npx prisma migrate dev --name initial-schema
# Expected: prisma/migrations/ directory created
# Expected: "Your database is now in sync with your schema"
```

### R2 — CRITICAL: Add `ReservationStatusEnum`

**What:** Add enum to schema; migrate `physical_bag_reservations.status` from `String` to the enum.

```prisma
enum ReservationStatusEnum {
  ACTIVE
  RELEASED
  CANCELLED
  @@map("reservation_status_enum")
  @@schema("factory")
}

model physical_bag_reservations {
  ...
  status ReservationStatusEnum @default(ACTIVE)  // was: String @db.VarChar(20)
  ...
}
```

**Migration:** `npx prisma migrate dev --name add-reservation-status-enum`

### R3 — CRITICAL: Add Missing Indexes to `physical_bag_reservations`

**What:** Add 3 indexes for reservation query patterns.

```prisma
model physical_bag_reservations {
  ...
  @@index([bag_id, status])
  @@index([order_id, status])
  @@index([status])
}
```

**Migration:** Include in the same migration as R2.

### R4 — HIGH: Apply `@updatedAt` to `physical_bags.updated_at`

**What:** Add `@updatedAt` directive so the field auto-updates.

```prisma
model physical_bags {
  ...
  updated_at DateTime @updatedAt @db.Timestamptz(6) @default(now())
  ...
}
```

**Migration:** Include in the same migration as R2 and R3.

### R5 — HIGH: Add `current_order_id` Index to `physical_bags`

```prisma
model physical_bags {
  ...
  @@index([current_order_id])
}
```

### R6 — HIGH: Write and Accept ADR-026

**Status:** ✅ COMPLETE — ADR-026 written in this review.
**Action required:** Update `ADR_INDEX.md` with ADR-026 entry.

### R7 — MEDIUM: Add `LocationTypeEnum`

**What:** Replace free-string location type fields in `inventory_transactions`.

```prisma
enum LocationTypeEnum {
  WAREHOUSE
  PRODUCTION_ORDER
  SUPPLIER
  CUSTOMER
  @@map("location_type_enum")
  @@schema("factory")
}

model inventory_transactions {
  ...
  from_location_type LocationTypeEnum?  // was: String? @db.VarChar(20)
  to_location_type   LocationTypeEnum?  // was: String? @db.VarChar(20)
  ...
}
```

**Timing:** First commit of Sprint 11 (before InventoryTransactionsRepository is implemented).

---

## Risk Register (Current State)

### Critical Risks

**RISK-C1: No database migrations (pre-existing)**
- Severity: Critical
- Impact: No integration testing possible; every use case will fail without a real database
- Mitigation: Required Change R1 — must be resolved as Gate G-1 before Sprint 11

### High Risks

**RISK-H1: AuditRepository in AuthModule (pre-existing, TD-1)**
- Severity: High
- Impact: Auth audit events bypass standard pipeline
- Mitigation: Resolve during Sprint 11 (deferred from Sprint 10.5)

**RISK-H2: physical_bag_reservations missing indexes**
- Severity: High (NEW — identified this review)
- Impact: Reservation conflict checks perform full table scans — degrades under load
- Mitigation: Required Change R3 — Gate G-5

**RISK-H3: physical_bag_reservations.status is free string**
- Severity: High (NEW — identified this review)
- Impact: Invalid status values cause silent data bugs; no compile-time type safety
- Mitigation: Required Change R2 — Gate G-4

**RISK-H4: Supplementary release deadlock possibility**
- Severity: High (NEW — identified this review)
- Impact: Two concurrent supplementary releases could deadlock on (inventory_bags, wip_inventory) lock order
- Mitigation: Lock ordering rule documented in `CONCURRENCY_STRATEGY.md` — must be enforced in Sprint 13

### Medium Risks

**RISK-M1: Incomplete schema fields (pre-existing, TD-2)**
- Severity: Medium
- `physical_bags.updated_at` missing `@updatedAt`
- Mitigation: Required Change R4

**RISK-M2: No integration tests (pre-existing)**
- Severity: Medium
- All 142 tests are unit tests; no real queries verified
- Mitigation: Resolves naturally after R1 (migrations applied); add integration tests in Sprint 20

**RISK-M3: LocationTypeEnum not defined**
- Severity: Medium (NEW — identified this review)
- Impact: Free-string location types allow data inconsistency in inventory_transactions
- Mitigation: Required Change R7 — Sprint 11 first commit

**RISK-M4: No CHECK constraint on dozens_on_hand >= 0**
- Severity: Medium (NEW — identified this review)
- Impact: Application-level guard is the only protection against negative stock
- Mitigation: Application non-negative guard is correct for Sprint 11; add DB CHECK constraint Sprint 13

### Low Risks

**RISK-L1: Memory permission cache single-instance (pre-existing)**
- Severity: Low
- Impact: Multi-instance cache inconsistency
- Mitigation: Redis in Sprint 20 (IPermissionCache interface ready)

**RISK-L2: No `is_damaged` field on physical_bags**
- Severity: Low
- Impact: Damaged goods cannot be flagged separately from CLOSED
- Mitigation: Defer to Sprint 14 (Quality) — track as inventory investigation instead

---

## Recommended ADRs

| ADR | Topic | Status |
|-----|-------|--------|
| ADR-026 | Inventory Architecture (optimistic locking, transaction boundaries, physical vs. logical bag) | ✅ Written in this review |
| ADR-027 | Location Type Enum for Inventory Transactions | Recommended — write before Sprint 11 implementation |

ADR-027 can be written as a 1-page ADR documenting the LocationTypeEnum decision. It may be combined with ADR-026 if the team prefers.

---

## Implementation Order Recommendation

```
Sprint 11 Pre-Work (before any use case code):
  1. Run initial database migration (R1 — Gate G-1)
  2. Add ReservationStatusEnum + indexes + @updatedAt (R2, R3, R4)
  3. Run hardening migration (npx prisma migrate dev --name inventory-schema-hardening)
  4. Add LocationTypeEnum (R7)
  5. Run migration (npx prisma migrate dev --name add-location-type-enum)
  6. Confirm: npx prisma validate exits 0
  7. Confirm: npm run build exits 0 after prisma generate
  8. Write ADR-027 (optional — can combine with ADR-026)

Sprint 11 Implementation (bottom-up):
  9.  InventoryBagsRepository
  10. InventoryTransactionsRepository
  11. StockReservationsRepository
  12. PhysicalBagsRepository
  13. Read use cases (GetStockLevel, ListInventoryBags, etc.)
  14. ReceivePhysicalBagUseCase (T1 — most complex)
  15. CreateStockReservationUseCase (T2)
  16. ReleaseStockReservationUseCase (T4)
  17. AdjustInventoryUseCase (T7)
  18. Controllers (3)
  19. InventoryModule registration in AppModule
  20. Unit tests (≥ 45)
  21. Quality gates (lint, build, test, architecture review, security review)
  22. Documentation updates
  23. Release commit + tag v0.5.0-inventory-engine
```

---

## Final Decision

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         READY WITH REQUIRED CHANGES                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Explanation:**

The repository architecture is fundamentally sound and correctly prepared for the Inventory Engine. The Business Foundation provides all prerequisite master data. The Prisma schema for all inventory tables is well-designed, with proper PKs, FKs, optimistic locking version columns, and a clear physical/logical separation.

**Sprint 11 CANNOT start until:**
1. R1: A live PostgreSQL database exists with the initial migration applied (Critical)
2. R2: `ReservationStatusEnum` is defined and `physical_bag_reservations.status` migrated (Critical)
3. R3: Missing indexes on `physical_bag_reservations` are added (Critical)

**Sprint 11 MUST do as first commits:**
4. R4: `physical_bags.updated_at @updatedAt` applied
5. R5: `current_order_id` index added to `physical_bags`
6. R7: `LocationTypeEnum` added and `inventory_transactions` fields migrated

Once R1–R3 are complete, all Gate Conditions G-1 through G-11 will be satisfied, and Sprint 11 may begin implementation.

The architecture decisions are documented in ADR-026. The transaction boundaries are defined in `TRANSACTION_BOUNDARIES.md`. The concurrency strategy is specified in `CONCURRENCY_STRATEGY.md`. The Sprint 11 scope and acceptance criteria are ratified in `SPRINT11_CONTRACT.md`.

**This review becomes the mandatory baseline for Sprint 11 — Inventory Engine Core.**

No implementation may begin until the Gate Conditions are satisfied.
No scope changes may be made without a new ADR.
