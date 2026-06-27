# Inventory Architecture

**Status:** Architecture Design — Phase 3 Sprint 0
**Date:** 2026-06-27
**Authority:** Chief ERP Architect / Principal Software Engineer
**Version:** 1.0.0

---

## Module Identity

| Attribute | Value |
|-----------|-------|
| Module name | `InventoryModule` |
| Source path | `src/modules/inventory/` |
| NestJS registration | `AppModule` providers array |
| Global scope | No — domain module |
| Exports | None initially; `InventoryService` exported in future sprint when cross-module queries needed |
| Version | All routes under `/v1/` (standard project convention) |

---

## Responsibility Boundary

The Inventory Engine owns:
- Physical bag lifecycle (receipt → availability → reservation → release → consumption/return)
- Aggregate stock ledger (`inventory_bags`)
- All inventory transaction records (`inventory_transactions`)
- Stock reservation management (`physical_bag_reservations`)
- Inventory adjustments (manual corrections)

The Inventory Engine does NOT own:
- Container receiving workflow (belongs to Purchasing/Containers — Sprint 15)
- WIP consumption (belongs to Production — Sprint 13)
- Quality output recording (belongs to Quality — Sprint 14)
- Packing and finished goods (belongs to CMO/Packing — Sprint 12)
- Inventory investigations (belongs to Reporting — Sprint 18)
- Return transactions to warehouse (belongs to Production — Sprint 13)
- Supplementary material requests (belongs to Production — Sprint 13)

---

## Layer Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Layer (NestJS)                       │
│  PhysicalBagsController   InventoryController               │
│  StockReservationsController                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ (calls one use case per method)
┌────────────────────────▼────────────────────────────────────┐
│                    Use Case Layer                            │
│  ReceivePhysicalBagUseCase    GetPhysicalBagUseCase         │
│  ListPhysicalBagsUseCase      GetStockLevelUseCase          │
│  ListInventoryBagsUseCase     ListInventoryTransactionsUseCase│
│  CreateStockReservationUseCase ReleaseStockReservationUseCase│
│  AdjustInventoryUseCase                                      │
└────────────────────────┬────────────────────────────────────┘
                         │ (injects repositories)
┌────────────────────────▼────────────────────────────────────┐
│                   Repository Layer                           │
│  PhysicalBagsRepository    InventoryBagsRepository          │
│  InventoryTransactionsRepository  StockReservationsRepository│
└────────────────────────┬────────────────────────────────────┘
                         │ (extends BaseRepository → this.db)
┌────────────────────────▼────────────────────────────────────┐
│              PrismaService (Global Module)                   │
│              factory schema — PostgreSQL                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Definitions

### PhysicalBagsRepository

**File:** `src/modules/inventory/repositories/physical-bags.repository.ts`
**Table primary:** `physical_bags`
**Tables secondary:** `physical_bag_contents`, `physical_bag_movements`

**Methods:**
```typescript
findById(bagId: bigint): Promise<PhysicalBagWithContents | null>
findByCode(bagCode: string): Promise<PhysicalBag | null>
findAll(filters: PhysicalBagFilters, pagination: PaginationDto): Promise<PaginatedResult<PhysicalBag>>
// Write methods are only called from within executeInTransaction():
createWithContents(tx, dto): Promise<PhysicalBag>
updateStatus(tx, bagId, newStatus, meta): Promise<void>
addMovement(tx, movement): Promise<void>
```

### InventoryBagsRepository

**File:** `src/modules/inventory/repositories/inventory-bags.repository.ts`
**Table:** `inventory_bags`

**Methods:**
```typescript
findByKey(warehouseId, modelId, partId): Promise<InventoryBag | null>
findByKeyForUpdate(tx, warehouseId, modelId, partId): Promise<InventoryBag | null>
findAll(filters, pagination): Promise<PaginatedResult<InventoryBag>>
upsertWithVersion(tx, key, delta, expectedVersion): Promise<void>
// Returns void — checks rowCount to detect optimistic lock failure
```

### InventoryTransactionsRepository

**File:** `src/modules/inventory/repositories/inventory-transactions.repository.ts`
**Table:** `inventory_transactions`

**Notes:** Composite PK `[txn_id, executed_at]`. All queries MUST include `executed_at` range for partition efficiency.

**Methods:**
```typescript
create(tx, dto): Promise<void>  // Always write within a transaction
findAll(filters: TxnFilters, pagination): Promise<PaginatedResult<InventoryTransaction>>
// filters MUST include dateRange (from, to) to avoid full table scans
findByReference(txnReference: string): Promise<InventoryTransaction[]>
```

### StockReservationsRepository

**File:** `src/modules/inventory/repositories/stock-reservations.repository.ts`
**Table:** `physical_bag_reservations`

**Methods:**
```typescript
findById(reservationId: bigint): Promise<StockReservation | null>
findActiveByBagId(bagId: bigint): Promise<StockReservation | null>
findActiveByOrderId(orderId: bigint): Promise<StockReservation[]>
create(tx, dto): Promise<StockReservation>
updateStatus(tx, reservationId, newStatus, releasedAt?): Promise<void>
```

---

## Use Case Definitions

### Sprint 11 Use Cases

| Use Case | Type | Transaction | Description |
|----------|------|-------------|-------------|
| `ReceivePhysicalBagUseCase` | Write | T1 | Create physical bag from container audit |
| `GetPhysicalBagUseCase` | Read | None | Retrieve bag with contents |
| `ListPhysicalBagsUseCase` | Read | None | Paginated list with filters |
| `GetStockLevelUseCase` | Read | None | Current stock at warehouse+model+part |
| `ListInventoryBagsUseCase` | Read | None | Paginated stock ledger view |
| `ListInventoryTransactionsUseCase` | Read | None | History with mandatory date range |
| `CreateStockReservationUseCase` | Write | T2 | Reserve bag for production order |
| `ReleaseStockReservationUseCase` | Write | T4 | Cancel reservation (return to available) |
| `AdjustInventoryUseCase` | Write | T7 | Manual adjustment — manager role required |

### Future Sprint Use Cases (NOT in Sprint 11)

| Use Case | Sprint | Owner Module |
|----------|--------|-------------|
| `ReleaseToProductionUseCase` | 13 | Production |
| `ConsumeWIPUseCase` | 13 | Production |
| `ReturnMaterialUseCase` | 13 | Production |
| `RecordQualityOutputUseCase` | 14 | Quality |
| `TransferSupplementaryMaterialUseCase` | 13 | Production |

---

## Controller Definitions

### PhysicalBagsController

```
@Controller({ path: 'physical-bags', version: '1' })
@Roles(UserRole.system_admin, UserRole.warehouse_manager)
```

| Method | Route | Use Case |
|--------|-------|---------|
| POST | /v1/physical-bags | ReceivePhysicalBagUseCase |
| GET | /v1/physical-bags/:id | GetPhysicalBagUseCase |
| GET | /v1/physical-bags | ListPhysicalBagsUseCase |

### InventoryController

```
@Controller({ path: 'inventory', version: '1' })
@Roles(UserRole.system_admin, UserRole.warehouse_manager)
```

| Method | Route | Use Case |
|--------|-------|---------|
| GET | /v1/inventory/stock | GetStockLevelUseCase |
| GET | /v1/inventory/bags | ListInventoryBagsUseCase |
| GET | /v1/inventory/transactions | ListInventoryTransactionsUseCase |
| PATCH | /v1/inventory/bags/:id/adjust | AdjustInventoryUseCase |

### StockReservationsController

```
@Controller({ path: 'inventory/reservations', version: '1' })
@Roles(UserRole.system_admin, UserRole.warehouse_manager, UserRole.production_manager)
```

| Method | Route | Use Case |
|--------|-------|---------|
| POST | /v1/inventory/reservations | CreateStockReservationUseCase |
| DELETE | /v1/inventory/reservations/:id | ReleaseStockReservationUseCase |
| GET | /v1/inventory/reservations | (list by order_id or bag_id — filter query) |

---

## Module Dependencies

### InventoryModule imports from:

| Module | Why | Rule |
|--------|-----|------|
| `PrismaModule` | Database access | Global — no explicit import needed |
| `LoggerModule` | Structured logging | Global — no explicit import needed |
| `AuditModule` | Fire-and-forget audit events | Global — no explicit import needed |
| `DocumentNumberingModule` | Bag code generation (if using number sequences) | Global — no explicit import needed |

### InventoryModule does NOT import:

| Module | Reason |
|--------|--------|
| `ProductionModule` | Cross-module dependency violation (CM-1). Production imports from Inventory |
| `CMOModule` | Same — CMO imports InventoryService in future, not the reverse |
| `AuthModule` | Guard stack is global — no import needed |

### Future — InventoryModule will export:

When Production needs to query stock levels:
```typescript
// future: inventory.module.ts
exports: [InventoryService],
```

`InventoryService` will expose read-only methods: `getStockLevel()`, `getActiveReservationsByOrder()`. Production calls these via the exported service (Rule CM-2).

---

## Integration Points

### Inbound (entities InventoryModule reads from other modules)

| Entity | Table | Source Module | How |
|--------|-------|--------------|-----|
| Warehouse validation | `warehouses` | WarehousesModule | Direct Prisma read in repository |
| Model validation | `models` | GarmentModelsModule | Direct Prisma read in repository |
| Part validation | `model_parts` | GarmentModelsModule | Direct Prisma read in repository |
| Container reference | `containers` | (containers are Purchasing — Sprint 15) | FK in physical_bags |
| Audit item reference | `receiving_audit_items` | Purchasing — Sprint 15 | Optional FK in physical_bags |

**Rule:** Reading cross-module tables via Prisma directly in a repository is acceptable for validation reads (FK lookups). Do NOT inject other modules' Repositories (Rule CM-1).

### Outbound (what other modules read from InventoryModule)

| Consumer | What it needs | Sprint |
|----------|--------------|--------|
| ProductionModule | Stock levels, active reservations per order | 13 |
| QualityModule | Quality output boxes (owned by Inventory boundary) | 14 |
| PackingModule | Quality output available dozens | 12 |
| CMOModule | Produced/packed/delivered counts | 12 |
| ReportingModule | Inventory transaction history | 18 |

---

## Audit Events

Every write use case emits a fire-and-forget audit event:

| Use Case | Audit Action | Entity Type |
|----------|-------------|------------|
| ReceivePhysicalBagUseCase | `PHYSICAL_BAG_RECEIVED` | `physical_bag` |
| CreateStockReservationUseCase | `STOCK_RESERVED` | `physical_bag_reservation` |
| ReleaseStockReservationUseCase | `RESERVATION_RELEASED` | `physical_bag_reservation` |
| AdjustInventoryUseCase | `INVENTORY_ADJUSTED` | `inventory_bag` |

Pattern (always outside the database transaction):
```typescript
// After successful commit:
void this.auditService.log({
  action: 'PHYSICAL_BAG_RECEIVED',
  entityType: 'physical_bag',
  entityId: String(result.bag_id),
  actorId,
  payload: { bag_code: result.bag_code, dozens: result.received_dozens },
});
```

---

## Module File Structure

```
src/modules/inventory/
├── inventory.module.ts
├── repositories/
│   ├── physical-bags.repository.ts
│   ├── inventory-bags.repository.ts
│   ├── inventory-transactions.repository.ts
│   └── stock-reservations.repository.ts
├── dto/
│   ├── receive-physical-bag.dto.ts
│   ├── physical-bag-filter.dto.ts
│   ├── inventory-bag-filter.dto.ts
│   ├── inventory-transaction-filter.dto.ts
│   └── create-stock-reservation.dto.ts
├── use-cases/
│   ├── receive-physical-bag/
│   │   ├── receive-physical-bag.use-case.ts
│   │   └── receive-physical-bag.use-case.spec.ts
│   ├── get-physical-bag/
│   ├── list-physical-bags/
│   ├── get-stock-level/
│   ├── list-inventory-bags/
│   ├── list-inventory-transactions/
│   ├── create-stock-reservation/
│   │   ├── create-stock-reservation.use-case.ts
│   │   └── create-stock-reservation.use-case.spec.ts
│   ├── release-stock-reservation/
│   └── adjust-inventory/
└── controllers/
    ├── physical-bags.controller.ts
    ├── inventory.controller.ts
    └── stock-reservations.controller.ts
```
