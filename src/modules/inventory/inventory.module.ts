import { Module } from '@nestjs/common';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { PhysicalBagsRepository } from './repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from './repositories/physical-bag-reservations.repository';
import { InventoryBagsRepository } from './repositories/inventory-bags.repository';
import { InventoryTransactionsRepository } from './repositories/inventory-transactions.repository';
import { InventoryValidationRepository } from './repositories/inventory-validation.repository';

import { PhysicalBagMovementService } from './services/physical-bag-movement.service';
import { PhysicalBagMovementValidator } from './services/physical-bag-movement.validator';
import { TransferBagToWarehouseUseCase } from './use-cases/transfer-bag-to-warehouse/transfer-bag-to-warehouse.use-case';
import { AssignBagToOrderUseCase } from './use-cases/assign-bag-to-order/assign-bag-to-order.use-case';
import { ReturnBagFromOrderUseCase } from './use-cases/return-bag-from-order/return-bag-from-order.use-case';

import { InventoryAvailabilityService } from './services/inventory-availability.service';
import { GetBagAvailabilityUseCase } from './use-cases/get-bag-availability/get-bag-availability.use-case';
import { GetWarehouseAvailabilityUseCase } from './use-cases/get-warehouse-availability/get-warehouse-availability.use-case';
import { GetModelAvailabilityUseCase } from './use-cases/get-model-availability/get-model-availability.use-case';
import { InventoryBalanceService } from './services/inventory-balance.service';
import { GetWarehouseBalanceSummaryUseCase } from './use-cases/get-warehouse-balance-summary/get-warehouse-balance-summary.use-case';
import { GetModelBalanceSummaryUseCase } from './use-cases/get-model-balance-summary/get-model-balance-summary.use-case';
import { GetBalanceSnapshotUseCase } from './use-cases/get-balance-snapshot/get-balance-snapshot.use-case';

import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { ApplyInventoryAdjustmentUseCase } from './use-cases/apply-inventory-adjustment/apply-inventory-adjustment.use-case';

import { CycleCountRepository } from './repositories/cycle-count.repository';
import { CycleCountService } from './services/cycle-count.service';
import { OpenCycleCountUseCase } from './use-cases/open-cycle-count/open-cycle-count.use-case';
import { ListCycleCountsUseCase } from './use-cases/list-cycle-counts/list-cycle-counts.use-case';
import { GetCycleCountUseCase } from './use-cases/get-cycle-count/get-cycle-count.use-case';
import { AddCycleCountActionUseCase } from './use-cases/add-cycle-count-action/add-cycle-count-action.use-case';
import { CloseCycleCountUseCase } from './use-cases/close-cycle-count/close-cycle-count.use-case';

import { InventoryTransactionFactory } from './services/inventory-transaction.factory';
import { InventoryTransactionMapper } from './services/inventory-transaction.mapper';
import { InventoryTransactionValidator } from './services/inventory-transaction.validator';
import { InventoryTransactionService } from './services/inventory-transaction.service';
import { ReservationFactory } from './services/reservation.factory';
import { ReservationMapper } from './services/reservation.mapper';
import { ReservationValidator } from './services/reservation.validator';
import { ReservationService } from './services/reservation.service';

import { CreateInventoryTransactionUseCase } from './use-cases/create-inventory-transaction/create-inventory-transaction.use-case';
import { ReceiveInventoryUseCase } from './use-cases/create-inventory-transaction/receive-inventory.use-case';
import { IssueInventoryUseCase } from './use-cases/create-inventory-transaction/issue-inventory.use-case';
import { TransferInventoryUseCase } from './use-cases/create-inventory-transaction/transfer-inventory.use-case';
import { AdjustInventoryUseCase } from './use-cases/create-inventory-transaction/adjust-inventory.use-case';
import { ListInventoryTransactionsUseCase } from './use-cases/list-inventory-transactions/list-inventory-transactions.use-case';
import { GetInventoryTransactionUseCase } from './use-cases/get-inventory-transaction/get-inventory-transaction.use-case';
import { GetBagTransactionHistoryUseCase } from './use-cases/get-bag-transaction-history/get-bag-transaction-history.use-case';
import { CreateReservationUseCase } from './use-cases/create-reservation/create-reservation.use-case';
import { ReleaseReservationUseCase } from './use-cases/create-reservation/release-reservation.use-case';
import { CancelReservationUseCase } from './use-cases/create-reservation/cancel-reservation.use-case';
import { ExpireReservationUseCase } from './use-cases/create-reservation/expire-reservation.use-case';
import { GetReservationUseCase } from './use-cases/get-reservation/get-reservation.use-case';
import { ListReservationsUseCase } from './use-cases/list-reservations/list-reservations.use-case';
import { ListReservationsByBagUseCase } from './use-cases/list-reservations/list-reservations-by-bag.use-case';
import { ListReservationsByOrderUseCase } from './use-cases/list-reservations/list-reservations-by-order.use-case';

@Module({
  controllers: [InventoryController],
  providers: [
    // Repositories
    PhysicalBagsRepository,
    PhysicalBagReservationsRepository,
    InventoryBagsRepository,
    InventoryTransactionsRepository,
    InventoryValidationRepository,
    // Movement services and use cases
    PhysicalBagMovementService,
    PhysicalBagMovementValidator,
    TransferBagToWarehouseUseCase,
    AssignBagToOrderUseCase,
    ReturnBagFromOrderUseCase,
    // Availability services and use cases
    InventoryAvailabilityService,
    GetBagAvailabilityUseCase,
    GetWarehouseAvailabilityUseCase,
    GetModelAvailabilityUseCase,
    // Balance services and use cases
    InventoryBalanceService,
    GetWarehouseBalanceSummaryUseCase,
    GetModelBalanceSummaryUseCase,
    GetBalanceSnapshotUseCase,
    // Adjustment services and use cases
    InventoryAdjustmentService,
    ApplyInventoryAdjustmentUseCase,
    // Cycle Count services and use cases
    CycleCountRepository,
    CycleCountService,
    OpenCycleCountUseCase,
    ListCycleCountsUseCase,
    GetCycleCountUseCase,
    AddCycleCountActionUseCase,
    CloseCycleCountUseCase,
    // Transaction services
    InventoryService,
    InventoryTransactionFactory,
    InventoryTransactionMapper,
    InventoryTransactionValidator,
    InventoryTransactionService,
    // Reservation services
    ReservationFactory,
    ReservationMapper,
    ReservationValidator,
    ReservationService,
    // Transaction use cases
    CreateInventoryTransactionUseCase,
    ReceiveInventoryUseCase,
    IssueInventoryUseCase,
    TransferInventoryUseCase,
    AdjustInventoryUseCase,
    ListInventoryTransactionsUseCase,
    GetInventoryTransactionUseCase,
    GetBagTransactionHistoryUseCase,
    // Reservation use cases
    CreateReservationUseCase,
    ReleaseReservationUseCase,
    CancelReservationUseCase,
    ExpireReservationUseCase,
    GetReservationUseCase,
    ListReservationsUseCase,
    ListReservationsByBagUseCase,
    ListReservationsByOrderUseCase,
  ],
  exports: [
    PhysicalBagsRepository,
    PhysicalBagReservationsRepository,
    InventoryBagsRepository,
    InventoryTransactionsRepository,
    InventoryTransactionService,
    ReservationService,
  ],
})
export class InventoryModule {}
