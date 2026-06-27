# Sprint 11 Contract — Inventory Engine Core

**Status:** RATIFIED by Architecture Review Board — Phase 3 Sprint 0
**Date:** 2026-06-27
**Version target:** v0.5.0-inventory-engine
**Sprint type:** Implementation Sprint
**Prerequisites:** All items in "Gate Conditions" must be COMPLETE before first commit

---

## Sprint Identity

| Field | Value |
|-------|-------|
| Sprint number | 11 |
| Sprint name | Inventory Engine Core |
| Phase | Phase 3 — Transaction & Execution Engine |
| Version | v0.5.0-inventory-engine |
| Estimated scope | 9 use cases, 4 repositories, 3 controllers, ≥ 45 new tests |
| Prompt | `.ai/SPRINT_PROMPTS/Sprint_11_Inventory_Engine.md` |
| ADR required | ADR-026 (Inventory Architecture) — must be written before first implementation commit |

---

## Gate Conditions (All Must Be COMPLETE Before Sprint 11 Starts)

| ID | Condition | Type | How to Satisfy |
|----|-----------|------|----------------|
| G-1 | PostgreSQL database running with `factory` schema | Critical | `npx prisma migrate dev --name initial-schema` exits 0 |
| G-2 | `prisma/migrations/` directory exists with initial migration | Critical | Output of G-1 |
| G-3 | `npx prisma validate` exits 0 after schema changes | Critical | Run after any schema additions |
| G-4 | `ReservationStatusEnum` added to schema; `physical_bag_reservations.status` migrated | Critical | See Required Schema Change R2 |
| G-5 | Missing indexes added to `physical_bag_reservations` | Critical | See Required Schema Change R3 |
| G-6 | `physical_bags.current_order_id` index added | High | See Performance Target PERF-2 |
| G-7 | `physical_bags.updated_at` has `@updatedAt` directive (TD-2) | High | Schema change + migrate |
| G-8 | ADR-026 written and marked Accepted in `ADR_INDEX.md` | High | Create from template before implementation |
| G-9 | `npm run lint` exits 0 | Mandatory | Must be green before starting |
| G-10 | `npm run build` exits 0 | Mandatory | Must be green before starting |
| G-11 | `npm run test` shows 142 passing, 0 failing | Mandatory | Baseline must be stable |

---

## Scope — What Sprint 11 Builds

### New Module: `src/modules/inventory/`

### Repositories (4)

| Repository | Primary Table | Key Operations |
|-----------|--------------|----------------|
| `PhysicalBagsRepository` | `physical_bags` + `physical_bag_contents` + `physical_bag_movements` | createWithContents, updateStatus, addMovement, findById, findAll |
| `InventoryBagsRepository` | `inventory_bags` | findByKey, upsertWithVersion (optimistic lock), findAll |
| `InventoryTransactionsRepository` | `inventory_transactions` | create, findAll (mandatory date range) |
| `StockReservationsRepository` | `physical_bag_reservations` | create, findActiveByBagId, findActiveByOrderId, updateStatus |

### Use Cases (9)

| # | Use Case | Type | Transaction | Roles Required |
|---|----------|------|-------------|----------------|
| 1 | `ReceivePhysicalBagUseCase` | Write | T1 | warehouse_manager, system_admin |
| 2 | `GetPhysicalBagUseCase` | Read | None | warehouse_manager, system_admin, production_manager |
| 3 | `ListPhysicalBagsUseCase` | Read | None | warehouse_manager, system_admin, production_manager |
| 4 | `GetStockLevelUseCase` | Read | None | warehouse_manager, system_admin, production_manager |
| 5 | `ListInventoryBagsUseCase` | Read | None | warehouse_manager, system_admin |
| 6 | `ListInventoryTransactionsUseCase` | Read | None | warehouse_manager, system_admin |
| 7 | `CreateStockReservationUseCase` | Write | T2 | warehouse_manager, production_manager, system_admin |
| 8 | `ReleaseStockReservationUseCase` | Write | T4 | warehouse_manager, production_manager, system_admin |
| 9 | `AdjustInventoryUseCase` | Write | T7 | system_admin, warehouse_manager (requires justification) |

### Controllers (3)

| Controller | Routes |
|-----------|--------|
| `PhysicalBagsController` | POST /v1/physical-bags, GET /v1/physical-bags/:id, GET /v1/physical-bags |
| `InventoryController` | GET /v1/inventory/stock, GET /v1/inventory/bags, GET /v1/inventory/transactions, PATCH /v1/inventory/bags/:id/adjust |
| `StockReservationsController` | POST /v1/inventory/reservations, DELETE /v1/inventory/reservations/:id, GET /v1/inventory/reservations |

---

## Scope — What Sprint 11 Does NOT Build

| Item | Reason | Sprint |
|------|--------|--------|
| Container receiving workflow | Purchasing domain | Sprint 15 |
| Receiving audit approval (RECEIVED → AVAILABLE transition) | Purchasing domain | Sprint 15 |
| WIP inventory mutations | Production domain | Sprint 13 |
| Quality output recording | Quality domain | Sprint 14 |
| Return transactions | Production domain | Sprint 13 |
| Release to production line | Production domain | Sprint 13 |
| Supplementary material requests | Production domain | Sprint 13 |
| Inventory investigations | Reporting domain | Sprint 18 |
| Packing and finished goods | CMO/Packing domain | Sprint 12 |
| CMO module | CMO domain | Sprint 12 |
| Inventory reporting and dashboards | Reporting | Sprint 18 |

---

## Transaction Boundaries (Mandatory)

All write use cases MUST use `this.executeInTransaction<T>()`. Partial writes are not permitted.

| Use Case | Transaction | See |
|----------|------------|-----|
| ReceivePhysicalBagUseCase | T1 — 5 table writes | `TRANSACTION_BOUNDARIES.md` T1 |
| CreateStockReservationUseCase | T2 — 4 table writes + FOR UPDATE | `TRANSACTION_BOUNDARIES.md` T2 |
| ReleaseStockReservationUseCase | T4 — 4 table writes + FOR UPDATE | `TRANSACTION_BOUNDARIES.md` T4 |
| AdjustInventoryUseCase | T7 — 2 table writes + FOR UPDATE | `TRANSACTION_BOUNDARIES.md` T7 |

---

## Concurrency Requirements (Mandatory)

1. `inventory_bags` updates MUST use optimistic locking (version column)
2. `physical_bags` status changes MUST use `SELECT FOR UPDATE` within the transaction
3. Optimistic lock failures MUST trigger retry with max 3 attempts
4. After 3 failures: throw `ConflictException` to caller
5. Multi-bag operations: acquire locks in ascending `bag_id` order (deadlock prevention)
6. Non-negative guard: `WHERE dozens_on_hand >= $delta` in all decrement operations

See `docs/architecture/CONCURRENCY_STRATEGY.md` for full specification.

---

## Business Rules (Mandatory)

| Rule | Enforcement |
|------|-------------|
| Stock cannot go negative | Pre-check + WHERE guard in UPDATE |
| Duplicate bag_code → 409 | Catch P2002, rethrow as ConflictException |
| Only AVAILABLE bags can be reserved | Pre-check + FOR UPDATE re-validation |
| Reservation quantity ≤ bag.current_dozens | Pre-check before transaction |
| AdjustInventory requires justification string | DTO: `@IsString() @MinLength(10)` |
| All writes emit audit events (fire-and-forget) | `void this.auditService.log()` after commit |
| No direct PrismaService injection in use cases | Architecture invariant |
| No cross-module repository injection | Rule CM-1 |
| Every list endpoint requires PaginationDto | Max 100 items per page |
| ListInventoryTransactions requires date range | DTO: `from` and `to` both required |

---

## Testing Requirements

| Requirement | Target |
|-------------|--------|
| Existing tests continue passing | 142 tests, 0 failures |
| New tests added | ≥ 45 |
| Total after sprint | ≥ 187 tests |
| ReceivePhysicalBagUseCase tests | Atomic rollback, duplicate bag_code (409), optimistic lock retry, content creation |
| CreateStockReservationUseCase tests | Success, insufficient stock (422), bag not AVAILABLE (409), duplicate reservation (409), optimistic lock |
| ReleaseStockReservationUseCase tests | Success, reservation not found (404), already released (409) |
| AdjustInventoryUseCase tests | Success, justification missing (400), non-negative guard |
| GetStockLevelUseCase tests | Found, not found (returns 0 stock), wrong warehouse |
| ListInventoryTransactionsUseCase tests | Missing date range returns 400, valid range returns paginated |

---

## Documentation Deliverables (All Required)

| Document | Action |
|----------|--------|
| `docs/architecture/adr/ADR-026-Inventory-Architecture.md` | Create before first implementation commit |
| `docs/architecture/ADR_INDEX.md` | Add ADR-026 entry |
| `docs/PROJECT_MEMORY.md` | Update metrics, add Sprint 11 to completed milestones |
| `docs/checkpoints/PROJECT_CHECKPOINT.md` | Replace with Sprint 11 snapshot |
| `docs/architecture/ARCHITECTURE_TIMELINE.md` | Add Sprint 11 entry |
| `docs/releases/v0.5.0-inventory-engine.md` | Create release notes |
| `docs/architecture/INVENTORY_ARCHITECTURE.md` | Already created in Phase 3 Sprint 0 |
| `docs/architecture/INVENTORY_DOMAIN_MODEL.md` | Already created in Phase 3 Sprint 0 |
| `docs/architecture/TRANSACTION_BOUNDARIES.md` | Already created in Phase 3 Sprint 0 |
| `docs/architecture/CONCURRENCY_STRATEGY.md` | Already created in Phase 3 Sprint 0 |

---

## Sprint 11 Implementation Order

```
Day 1: Pre-conditions (Gate G-1 through G-8)
  1. Run npx prisma migrate dev --name initial-schema (G-1, G-2)
  2. Add ReservationStatusEnum + schema changes (G-4, G-5, G-6, G-7)
  3. npx prisma migrate dev --name inventory-schema-hardening
  4. Write ADR-026 (G-8)

Day 2: Repository layer (bottom-up)
  5. InventoryBagsRepository — includes upsertWithVersion with optimistic lock
  6. InventoryTransactionsRepository
  7. StockReservationsRepository
  8. PhysicalBagsRepository (most complex — leaves to last)

Day 3-4: Use Cases
  9. Read use cases first (GetStockLevel, ListInventoryBags, etc.) — no transaction risk
  10. ReceivePhysicalBagUseCase (T1 — most complex write)
  11. CreateStockReservationUseCase (T2 — FOR UPDATE pattern)
  12. ReleaseStockReservationUseCase (T4 — simpler)
  13. AdjustInventoryUseCase (T7)

Day 5: Controllers and wiring
  14. PhysicalBagsController
  15. InventoryController
  16. StockReservationsController
  17. InventoryModule registration in AppModule

Day 6: Tests
  18. All use case spec files (≥ 45 tests)

Day 7: Quality gates
  19. npm run lint → 0 errors
  20. npm run build → clean
  21. npm run test → ≥ 187 passing
  22. Architecture Review (QUALITY_GATES/Architecture_Gate.md)
  23. Security Review (QUALITY_GATES/Security_Gate.md)

Day 8: Release
  24. Update PROJECT_MEMORY.md
  25. Update PROJECT_CHECKPOINT.md
  26. Create docs/releases/v0.5.0-inventory-engine.md
  27. Commit + tag v0.5.0-inventory-engine
```

---

## Acceptance Criteria (See Full List in `PHASE3_READINESS_REVIEW.md` Phase 9)

Short form:
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0 — no TypeScript errors
- [ ] `npm run test` — ≥ 187 tests, 0 failures
- [ ] Stock cannot go negative under any operation
- [ ] Duplicate bag_code returns 409
- [ ] Only AVAILABLE bags can be reserved — any other status returns 409
- [ ] Optimistic lock retries up to 3 times; ConflictException on 4th failure
- [ ] All inventory write operations have corresponding `inventory_transactions` records
- [ ] All write use cases emit audit events (fire-and-forget)
- [ ] All endpoints require warehouse_manager role or higher
- [ ] ListInventoryTransactions requires date range — missing range returns 400
- [ ] ADR-026 written and accepted
- [ ] All Sprint 11 documentation deliverables complete
- [ ] Architecture Review: PASS
- [ ] Security Review: PASS

---

## Contract Signatories

This contract is ratified by the Architecture Review Board as part of Phase 3 Sprint 0 (Readiness Review). No modifications to scope, transaction boundaries, or concurrency requirements may be made without a new ADR.

Sprint 11 may begin only when all Gate Conditions (G-1 through G-11) are satisfied.
