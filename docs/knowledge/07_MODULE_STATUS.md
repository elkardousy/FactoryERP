# 07 — Module Status

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Module Completion Status

| Module | Status | Controllers | Repositories | Use Cases | Tests |
|--------|--------|-------------|--------------|-----------|-------|
| `auth` | COMPLETE | 1 | 1 (UsersRepository) | 3 (login, logout, refresh) | 4 spec files |
| `authorization` | COMPLETE | 0 (guard-only) | 1 | 3 services | 5 spec files |
| `customers` | COMPLETE | 1 | 1 | CRUD + soft-delete | 1 spec file |
| `garment-models` | COMPLETE | 3 | multiple | CRUD + parts/colors/sizes | 1 spec file |
| `measurements` | COMPLETE | 2 (colors, sizes) | 2 | CRUD | 1 spec file |
| `organization` | COMPLETE | 2 (depts, shifts) | 2 | CRUD + soft-delete | 2 spec files |
| `production-setup` | COMPLETE | 2 (lines, stages) | 2 | CRUD + soft-delete | 1 spec file |
| `suppliers` | COMPLETE | 1 | 1 | CRUD + soft-delete | 1 spec file |
| `warehouses` | COMPLETE | 1 | 1 | CRUD + soft-delete | 1 spec file |
| `inventory` | COMPLETE | 1 | 5 | 16 (8 txn + 8 rsv) | 2 spec files |

---

## Core Infrastructure Modules

| Module | Status | Notes |
|--------|--------|-------|
| `PrismaModule` | COMPLETE | `@Global()`, provides PrismaService everywhere |
| `LoggerModule` | COMPLETE | `@Global()`, nestjs-pino, JSON prod / pretty dev |
| `AuditModule` | COMPLETE | `@Global()`, writes to `audit_events` |
| `DocumentNumberingModule` | COMPLETE | `@Global()`, generates document numbers |
| `ConfigModule` | COMPLETE | Namespaced, Joi-validated, cached |

---

## Auth Module Detail

**Path:** `src/modules/auth/`

### Providers

| Provider | Type | Role |
|----------|------|------|
| `AuthService` | Service | Orchestrates login/logout/refresh |
| `JwtService` | Service | JWT sign/verify wrapper |
| `TokenService` | Service | Refresh token management |
| `PasswordService` | Service | bcrypt hash/compare |
| `SessionService` | Service | Session lifecycle |
| `JwtStrategy` | Strategy | Passport JWT validation |
| `JwtAuthGuard` | Guard | JWT guard (exported) |
| `UsersRepository` | Repository | User DB access |

### Use Cases

| Use Case | Path |
|----------|------|
| `LoginUseCase` | `use-cases/login/` |
| `LogoutUseCase` | `use-cases/logout/` |
| `RefreshUseCase` | `use-cases/refresh/` |

### Exports

`AuthService`, `JwtAuthGuard`, `JwtService`, `UsersRepository`

---

## Authorization Module Detail

**Path:** `src/modules/authorization/`

### Providers

| Provider | Type | Role |
|----------|------|------|
| `AuthorizationService` | Service | Permission resolution orchestration |
| `PermissionResolverService` | Service | Resolves effective permissions for user+role |
| `PermissionCacheService` | Service | Cache layer (alias for `PERMISSION_CACHE` token) |
| `MemoryPermissionCache` | Cache | In-memory cache, registered as `PERMISSION_CACHE` |
| `RolesGuard` | Guard | Checks `@Roles` decorator |
| `ScreenPermissionGuard` | Guard | Checks screen-level CRUD |

### Repositories

- `PermissionsRepository` — queries `role_permissions`
- `ScreenPermissionsRepository` — queries `screen_permissions`

### Exports

All 3 guards and all services.

---

## Inventory Module Detail (Most Complex)

**Path:** `src/modules/inventory/`  
**Sprint:** 11.1 (Foundation) + 11.2 (Transaction Engine) + 11.3 (Reservation Engine)

### Repositories (5)

| Repository | Tables Accessed | Key Methods |
|------------|----------------|-------------|
| `InventoryBagsRepository` | `inventory_bags` | findByWarehousePartModel, upsert-style updates |
| `InventoryTransactionsRepository` | `inventory_transactions` | create, createInTx, findById (findFirst!), findByWarehouseId, paginated list |
| `InventoryValidationRepository` | `warehouses`, `models`, `model_parts`, `production_orders` | existence checks: warehouseExistsAndActive, modelExistsAndActive, partExistsForModel, orderExists |
| `PhysicalBagsRepository` | `physical_bags`, `physical_bag_movements` | findById, findMovementHistory |
| `PhysicalBagReservationsRepository` | `physical_bag_reservations` | create, updateStatus, findById, findByBagAndOrder, findAllWithPagination, findAllByBag, findAllByOrder, sumActiveReservedDozens |

### Transaction Services (4)

| Service | Role |
|---------|------|
| `InventoryTransactionFactory` | Creates `CreateTransactionData` objects from command types |
| `InventoryTransactionMapper` | Maps DB rows to `TransactionResponseDto` |
| `InventoryTransactionValidator` | Validates commands (warehouse exists, model exists, etc.) |
| `InventoryTransactionService` | Orchestrates: receive, issue, transfer, adjust, list, getById, getBagHistory |

### Reservation Services (4)

| Service | Role |
|---------|------|
| `ReservationFactory` | Creates reservation data objects |
| `ReservationMapper` | Maps DB rows to `ReservationResponseDto` |
| `ReservationValidator` | Validates: qty > 0, bag exists, order exists, no duplicate, available qty |
| `ReservationService` | Orchestrates: reserve, release, cancel, expire, get, list, listByBag, listByOrder |

### Use Cases (16)

**Transaction Use Cases (8):**
- `CreateInventoryTransactionUseCase` — generic dispatcher (switch on operation type)
- `ReceiveInventoryUseCase` — thin delegate
- `IssueInventoryUseCase` — thin delegate
- `TransferInventoryUseCase` — thin delegate
- `AdjustInventoryUseCase` — thin delegate
- `ListInventoryTransactionsUseCase` — thin delegate
- `GetInventoryTransactionUseCase` — thin delegate
- `GetBagTransactionHistoryUseCase` — thin delegate

**Reservation Use Cases (8):**
- `CreateReservationUseCase` — thin delegate
- `ReleaseReservationUseCase` — thin delegate
- `CancelReservationUseCase` — thin delegate
- `ExpireReservationUseCase` — thin delegate
- `GetReservationUseCase` — thin delegate
- `ListReservationsUseCase` — thin delegate
- `ListReservationsByBagUseCase` — thin delegate
- `ListReservationsByOrderUseCase` — thin delegate

### Controller

Single `InventoryController` with 16 endpoints (8 transaction + 8 reservation).

### Exports

`PhysicalBagsRepository`, `PhysicalBagReservationsRepository`, `InventoryBagsRepository`, `InventoryTransactionsRepository`, `InventoryTransactionService`, `ReservationService`

---

## Stub / Empty Files

The following files exist but contain minimal/empty content:

| File | Status |
|------|--------|
| `src/core/config/config.module.ts` | Empty stub (1 line) |
| `src/core/exceptions/exceptions.module.ts` | Empty stub (1 line) |

These are known technical debt items and do not affect functionality.

---

## Modules NOT Yet Implemented (Schema-Only)

These domains exist in the Prisma schema but have NO NestJS module:

| Domain | Schema Tables | Status |
|--------|--------------|--------|
| Production Orders | `production_orders`, `production_order_parts`, `release_groups`, etc. | No module |
| WIP / Stage Tracking | `production_stage_logs`, `scrap_records`, `wip_inventory` | No module |
| Packing | `packing_orders`, `dozen_assemblies`, `packing_verifications` | No module |
| Container Receiving | `containers`, `packaging_list_items`, `receiving_audit_items` | No module |
| CMO | `customer_manufacturing_orders`, `customer_manufacturing_order_lines` | No module |
| Shipping | `shipping_orders`, `delivery_notes`, `proof_of_delivery` | No module |
| Employees / HR | `employees`, `employee_attendance` | No module |
| Machines | `machines`, `machine_assignments`, `machine_downtime_events` | No module |
| Workflow | `workflow_templates`, `workflow_instances` | No module |
| Supplementary | `supplementary_material_requests` | No module |
| Investigations | `inventory_investigations` | No module |
| Physical Bag Operations | `physical_bags` (full lifecycle ops) | Partial — inventory module has read-only access |
| Finished Goods | `finished_goods_bags` | No module |

**Summary:** ~13 major business domains exist in the schema but have no NestJS module.
