# Sprint 11 — Inventory Engine

**Version target:** v0.5.0-inventory-engine
**Prerequisite:** v0.3.0-business-foundation released, database migrations applied

---

## Objectives

Implement the core inventory management system: physical bag tracking, inventory bag records, inventory transactions, and stock reservations. This sprint delivers the inventory layer that links material receiving to production consumption.

---

## Scope

### New Domain Module: `src/modules/inventory/`

**Schema entities (already in prisma/schema.prisma):**
- `physical_bags` — barcode-tracked physical units received from suppliers
- `inventory_bags` — logical inventory records linked to physical bags
- `inventory_transactions` — all movements: receive, reserve, release, consume, return
- `stock_reservations` — allocations linked to production orders

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `ReceivePhysicalBagUseCase` | Record a physical bag arriving from a supplier (links to purchase order) |
| `CreateInventoryBagUseCase` | Create logical inventory record from a physical bag |
| `GetInventoryBagUseCase` | Retrieve inventory bag with current stock level |
| `ListInventoryBagsUseCase` | Paginated list with filters: warehouse, status, material type |
| `RecordTransactionUseCase` | Atomic inventory transaction (receive/reserve/release/consume/return) |
| `ListTransactionsUseCase` | Paginated transaction history with date range filter |
| `CreateStockReservationUseCase` | Reserve inventory for a production order |
| `ReleaseReservationUseCase` | Release an existing reservation |
| `GetStockLevelUseCase` | Current stock level query per material/warehouse |

---

## Architecture Constraints

- Inventory transactions must use `executeInTransaction<T>()` — stock level changes and transaction records must be atomic
- Stock level must never be negative — validate before any CONSUME or RESERVE operation
- `RecordTransactionUseCase` is the only path to modify stock levels — no direct Prisma updates in other use cases
- `inventory_transactions` uses a composite PK `[txn_id, executed_at]` — queries must include `executed_at` in partition-aware queries
- Physical bag barcodes must be globally unique — catch `P2002` Prisma error and rethrow as `ConflictException`
- All endpoints require `@Roles(UserRole.system_admin, UserRole.warehouse_manager)`

---

## Files Expected to Change

```
prisma/schema.prisma                          (verify physical_bags, inventory_bags, etc.)
prisma/migrations/                            (new migration for any schema additions)
src/modules/inventory/
  inventory.module.ts
  repositories/
    physical-bags.repository.ts
    inventory-bags.repository.ts
    inventory-transactions.repository.ts
    stock-reservations.repository.ts
  dto/
    physical-bag.dto.ts
    inventory-bag.dto.ts
    inventory-transaction.dto.ts
    stock-reservation.dto.ts
  use-cases/
    receive-physical-bag.use-case.ts
    receive-physical-bag.use-case.spec.ts
    create-inventory-bag.use-case.ts
    ... (one spec per use case)
  controllers/
    physical-bags.controller.ts
    inventory-bags.controller.ts
    inventory-transactions.controller.ts
    stock-reservations.controller.ts
src/app.module.ts                             (register InventoryModule)
docs/PROJECT_MEMORY.md
docs/checkpoints/PROJECT_CHECKPOINT.md
docs/architecture/adr/ADR-026-Inventory-Architecture.md
docs/architecture/ADR_INDEX.md
docs/releases/v0.5.0-inventory-engine.md
```

---

## Testing Requirements

- Every use case must have a unit test suite
- `RecordTransactionUseCase` must test: all 5 transaction types, negative stock guard, atomicity via mocked transaction
- `CreateStockReservationUseCase` must test: success, insufficient stock (throws `UnprocessableEntityException`), duplicate reservation
- Minimum new tests: 45
- All existing 142 tests must continue passing

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0
- [ ] `npm run build` succeeds
- [ ] `npm run test` shows 0 failures (≥ 187 tests)
- [ ] Stock cannot go negative under any combination of concurrent transactions
- [ ] All transaction types (receive/reserve/release/consume/return) produce correct `inventory_transactions` records
- [ ] Physical bag barcodes are unique — duplicate returns 409
- [ ] All inventory endpoints require warehouse_manager role or higher
- [ ] Audit events emitted for every state change
- [ ] ADR-026 written and accepted

---

## Quality Gates

Before marking sprint complete, all gates in `.ai/QUALITY_GATES/` must pass.

See `.ai/CHECKLISTS/Sprint_Checklist.md` for the complete sprint completion checklist.

---

## Documentation Updates Required

1. `docs/PROJECT_MEMORY.md` — add Sprint 11 to completed milestones, update metrics
2. `docs/checkpoints/PROJECT_CHECKPOINT.md` — replace with Sprint 11 snapshot
3. `docs/architecture/ARCHITECTURE_TIMELINE.md` — add Sprint 11 milestone
4. `docs/architecture/adr/ADR-026-Inventory-Architecture.md` — new ADR
5. `docs/architecture/ADR_INDEX.md` — add ADR-026
6. `docs/releases/v0.5.0-inventory-engine.md` — release notes

---

## Exit Criteria

Sprint 11 is complete when:
- All acceptance criteria are checked
- All quality gates pass
- Release `v0.5.0-inventory-engine` is tagged and published
- `docs/PROJECT_MEMORY.md` is updated
