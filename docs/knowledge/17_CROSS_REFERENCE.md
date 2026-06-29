# 17 — Cross Reference

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Entity → Prisma Model → Repository → Service → Use Cases → Controller Endpoints

### Physical Bag

| Layer | Component | File |
|-------|-----------|------|
| Prisma model | `physical_bags` | `prisma/schema.prisma:1061` |
| Repository | `PhysicalBagsRepository` | `src/modules/inventory/repositories/physical-bags.repository.ts` |
| Service | `InventoryTransactionService` (bag history) | `src/modules/inventory/services/inventory-transaction.service.ts` |
| Service | `ReservationValidator` (bag validation) | `src/modules/inventory/services/reservation.validator.ts` |
| Use Case | `GetBagTransactionHistoryUseCase` | `src/modules/inventory/use-cases/get-bag-transaction-history/` |
| Use Case | `ListReservationsByBagUseCase` | `src/modules/inventory/use-cases/list-reservations/` |
| Controller | `GET /v1/inventory/bags/:id/history` | `src/modules/inventory/controllers/inventory.controller.ts:248` |
| Controller | `GET /v1/inventory/bags/:id/reservations` | `src/modules/inventory/controllers/inventory.controller.ts:366` |

### Physical Bag Reservation

| Layer | Component | File |
|-------|-----------|------|
| Prisma model | `physical_bag_reservations` | `prisma/schema.prisma:1123` |
| Repository | `PhysicalBagReservationsRepository` | `src/modules/inventory/repositories/physical-bag-reservations.repository.ts` |
| Factory | `ReservationFactory` | `src/modules/inventory/services/reservation.factory.ts` |
| Mapper | `ReservationMapper` | `src/modules/inventory/services/reservation.mapper.ts` |
| Validator | `ReservationValidator` | `src/modules/inventory/services/reservation.validator.ts` |
| Service | `ReservationService` | `src/modules/inventory/services/reservation.service.ts` |
| Use Cases (8) | Create/Release/Cancel/Expire/Get/List/ListByBag/ListByOrder | `src/modules/inventory/use-cases/create-reservation/`, `get-reservation/`, `list-reservations/` |
| Controller (8) | POST/GET reservation endpoints | `src/modules/inventory/controllers/inventory.controller.ts:267-404` |
| DTO request | `ReservationRequestDto` | `src/modules/inventory/dto/reservation-request.dto.ts` |
| DTO response | `ReservationResponseDto` | `src/modules/inventory/dto/reservation-response.dto.ts` |
| DTO filter | `ReservationFilterDto` | `src/modules/inventory/dto/reservation-filter.dto.ts` |
| Contract | `ReservationResult` | `src/modules/inventory/contracts/reservation-result.interface.ts` |
| Tests | `reservations.use-cases.spec.ts` | `src/modules/inventory/use-cases/reservations.use-cases.spec.ts` |

### Inventory Transaction

| Layer | Component | File |
|-------|-----------|------|
| Prisma model | `inventory_transactions` | `prisma/schema.prisma:1032` |
| Repository | `InventoryTransactionsRepository` | `src/modules/inventory/repositories/inventory-transactions.repository.ts` |
| Factory | `InventoryTransactionFactory` | `src/modules/inventory/services/inventory-transaction.factory.ts` |
| Mapper | `InventoryTransactionMapper` | `src/modules/inventory/services/inventory-transaction.mapper.ts` |
| Validator | `InventoryTransactionValidator` | `src/modules/inventory/services/inventory-transaction.validator.ts` |
| Service | `InventoryTransactionService` | `src/modules/inventory/services/inventory-transaction.service.ts` |
| Use Cases (8) | Create/Receive/Issue/Transfer/Adjust/List/Get/BagHistory | `src/modules/inventory/use-cases/create-inventory-transaction/`, etc. |
| Controller (8) | POST/GET transaction endpoints | `src/modules/inventory/controllers/inventory.controller.ts:94-265` |
| DTO request | `TransactionRequestDto` | `src/modules/inventory/dto/transaction-request.dto.ts` |
| DTO response | `TransactionResponseDto` | `src/modules/inventory/dto/transaction-response.dto.ts` |
| DTO filter | `TransactionFilterDto` | `src/modules/inventory/dto/transaction-filter.dto.ts` |
| DTO history | `TransactionHistoryDto` | `src/modules/inventory/dto/transaction-history.dto.ts` |
| Contract | `TransactionResult`, `TransferResult` | `src/modules/inventory/contracts/transaction-result.interface.ts` |
| Tests | `inventory-transactions.use-cases.spec.ts` | `src/modules/inventory/use-cases/inventory-transactions.use-cases.spec.ts` |

---

## ReservationStatusEnum Cross-Reference

| Usage | Location |
|-------|----------|
| Enum definition | `prisma/schema.prisma:333` |
| Validator (assertActive) | `reservation.validator.ts` |
| Service (release) | `reservation.service.ts` — sets RELEASED + released_at |
| Service (cancel) | `reservation.service.ts` — sets CANCELLED |
| Service (expire) | `reservation.service.ts` — sets CANCELLED (EXPIRED doesn't exist) |
| Repository (sumActive) | `physical-bag-reservations.repository.ts` — filters by ACTIVE |
| Filter DTO | `reservation-filter.dto.ts` — optional status filter |

---

## TxnTypeEnum Cross-Reference

| Enum Value | Set By | Factory Method |
|------------|--------|----------------|
| `RECEIVING` | `fromReceive()` / `fromOpeningBalance()` | `InventoryTransactionFactory` |
| `RELEASE` | `fromIssue()` / `fromTransfer()` (outbound leg) | `InventoryTransactionFactory` |
| `ADJUSTMENT` | `fromAdjust()` | `InventoryTransactionFactory` |
| `WIP_CONSUMPTION` | NOT YET IMPLEMENTED | Future sprint |
| `QUALITY_OUTPUT` | NOT YET IMPLEMENTED | Future sprint |
| `PACKING` | NOT YET IMPLEMENTED | Future sprint |
| `RETURN` | NOT YET IMPLEMENTED | Future sprint |
| `SUPPLEMENTARY_RELEASE` | NOT YET IMPLEMENTED | Future sprint |

---

## JwtPayload Cross-Reference

| Usage | Location |
|-------|----------|
| Interface definition | `src/modules/auth/use-cases/login/contracts/` |
| Populated by | `JwtStrategy.validate()` |
| Available via | `@CurrentUser() user: JwtPayload` decorator |
| `user.sub` used as `executed_by` in | `InventoryController` (all transaction endpoints) |
| `user.sub` used as `reserved_by` in | `InventoryController` (reservation create endpoint) |

---

## LoggerService Cross-Reference

| Correct Usage | Incorrect Usage (compile error) |
|---------------|--------------------------------|
| `this.logger.info(...)` | `this.logger.log(...)` ❌ |
| `this.logger.warn(...)` | `this.logger.verbose(...)` ❌ |
| `this.logger.error(...)` | |
| `this.logger.debug(...)` | |

Fixed in: `src/modules/inventory/services/inventory-transaction.service.ts` (Sprint 11.2)

---

## Validation Repository Cross-Reference

`InventoryValidationRepository` is used by multiple validators:

| Caller | Method Used | Validates |
|--------|-------------|-----------|
| `InventoryTransactionValidator.validateReceive()` | `warehouseExistsAndActive()`, `modelExistsAndActive()` | warehouse, model |
| `InventoryTransactionValidator.validateIssue()` | `warehouseExistsAndActive()`, `modelExistsAndActive()`, `orderExists()` | warehouse, model, order |
| `InventoryTransactionValidator.validateTransfer()` | `warehouseExistsAndActive()` (x2), `modelExistsAndActive()` | from/to warehouse, model |
| `InventoryTransactionValidator.validateAdjust()` | `warehouseExistsAndActive()`, `modelExistsAndActive()` | warehouse, model |
| `ReservationValidator.validateCreate()` | `orderExists()` | production order |

---

## BigInt Conversion Cross-Reference

| Where | Direction | Code |
|-------|-----------|------|
| Controller (URL params) | String → BigInt | `BigInt(id)` |
| Controller (DTO fields) | Number → BigInt | `BigInt(dto.model_id)` |
| Mapper (response) | BigInt → String | `.toString()` |
| Mapper (Decimal response) | Decimal → String | `.toString()` |
| ResponseInterceptor | Any BigInt → String | `serializeBigInts()` |

---

## Test Mock ↔ Real Implementation Cross-Reference

| Mock Target | Real Implementation | Spec File |
|-------------|--------------------|----|
| `InventoryTransactionService` | `src/modules/inventory/services/inventory-transaction.service.ts` | `inventory-transactions.use-cases.spec.ts` |
| `ReservationService` | `src/modules/inventory/services/reservation.service.ts` | `reservations.use-cases.spec.ts` |
| `LoggerService` | `src/core/logger/logger.service.ts` | Both inventory spec files |
| `executeInTransaction` | `BaseRepository.executeInTransaction()` | `inventory-transactions.use-cases.spec.ts` |

---

## Sprint → Files Changed Cross-Reference

### Sprint 11.2 Files Created/Modified

**New files:**
- `src/modules/inventory/dto/transaction-request.dto.ts`
- `src/modules/inventory/dto/transaction-response.dto.ts`
- `src/modules/inventory/dto/transaction-filter.dto.ts`
- `src/modules/inventory/dto/transaction-history.dto.ts`
- `src/modules/inventory/contracts/transaction-result.interface.ts`
- `src/modules/inventory/repositories/inventory-validation.repository.ts`
- `src/modules/inventory/services/inventory-transaction.factory.ts`
- `src/modules/inventory/services/inventory-transaction.mapper.ts`
- `src/modules/inventory/services/inventory-transaction.validator.ts`
- `src/modules/inventory/services/inventory-transaction.service.ts`
- `src/modules/inventory/use-cases/create-inventory-transaction/` (8 files)
- `src/modules/inventory/use-cases/get-inventory-transaction/` (2 files)
- `src/modules/inventory/use-cases/get-bag-transaction-history/` (2 files)
- `src/modules/inventory/use-cases/list-inventory-transactions/` (3 files)
- `src/modules/inventory/use-cases/inventory-transactions.use-cases.spec.ts`

**Modified files:**
- `src/modules/inventory/repositories/inventory-transactions.repository.ts`
- `src/modules/inventory/repositories/physical-bags.repository.ts`
- `src/modules/inventory/controllers/inventory.controller.ts`
- `src/modules/inventory/inventory.module.ts`

### Sprint 11.3 Files Created/Modified

**New files:**
- `src/modules/inventory/use-cases/create-reservation/commands/` (4 command files)
- `src/modules/inventory/dto/reservation-request.dto.ts`
- `src/modules/inventory/dto/reservation-response.dto.ts`
- `src/modules/inventory/dto/reservation-filter.dto.ts`
- `src/modules/inventory/dto/reservation-history.dto.ts`
- `src/modules/inventory/contracts/reservation-result.interface.ts`
- `src/modules/inventory/services/reservation.factory.ts`
- `src/modules/inventory/services/reservation.mapper.ts`
- `src/modules/inventory/services/reservation.validator.ts`
- `src/modules/inventory/services/reservation.service.ts`
- `src/modules/inventory/use-cases/create-reservation/` (4 use case files)
- `src/modules/inventory/use-cases/get-reservation/` (2 files)
- `src/modules/inventory/use-cases/list-reservations/` (6 files)
- `src/modules/inventory/use-cases/reservations.use-cases.spec.ts`

**Modified files:**
- `src/modules/inventory/repositories/physical-bag-reservations.repository.ts`
- `src/modules/inventory/controllers/inventory.controller.ts`
- `src/modules/inventory/inventory.module.ts`
