import { Module } from '@nestjs/common';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { PhysicalBagsRepository } from './repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from './repositories/physical-bag-reservations.repository';
import { InventoryBagsRepository } from './repositories/inventory-bags.repository';
import { InventoryTransactionsRepository } from './repositories/inventory-transactions.repository';
import { InventoryValidationRepository } from './repositories/inventory-validation.repository';

import { InventoryTransactionFactory } from './services/inventory-transaction.factory';
import { InventoryTransactionMapper } from './services/inventory-transaction.mapper';
import { InventoryTransactionValidator } from './services/inventory-transaction.validator';
import { InventoryTransactionService } from './services/inventory-transaction.service';

import { CreateInventoryTransactionUseCase } from './use-cases/create-inventory-transaction/create-inventory-transaction.use-case';
import { ReceiveInventoryUseCase } from './use-cases/create-inventory-transaction/receive-inventory.use-case';
import { IssueInventoryUseCase } from './use-cases/create-inventory-transaction/issue-inventory.use-case';
import { TransferInventoryUseCase } from './use-cases/create-inventory-transaction/transfer-inventory.use-case';
import { AdjustInventoryUseCase } from './use-cases/create-inventory-transaction/adjust-inventory.use-case';
import { ListInventoryTransactionsUseCase } from './use-cases/list-inventory-transactions/list-inventory-transactions.use-case';
import { GetInventoryTransactionUseCase } from './use-cases/get-inventory-transaction/get-inventory-transaction.use-case';
import { GetBagTransactionHistoryUseCase } from './use-cases/get-bag-transaction-history/get-bag-transaction-history.use-case';

@Module({
  controllers: [InventoryController],
  providers: [
    // Repositories
    PhysicalBagsRepository,
    PhysicalBagReservationsRepository,
    InventoryBagsRepository,
    InventoryTransactionsRepository,
    InventoryValidationRepository,
    // Services
    InventoryService,
    InventoryTransactionFactory,
    InventoryTransactionMapper,
    InventoryTransactionValidator,
    InventoryTransactionService,
    // Use cases
    CreateInventoryTransactionUseCase,
    ReceiveInventoryUseCase,
    IssueInventoryUseCase,
    TransferInventoryUseCase,
    AdjustInventoryUseCase,
    ListInventoryTransactionsUseCase,
    GetInventoryTransactionUseCase,
    GetBagTransactionHistoryUseCase,
  ],
  exports: [
    PhysicalBagsRepository,
    PhysicalBagReservationsRepository,
    InventoryBagsRepository,
    InventoryTransactionsRepository,
    InventoryTransactionService,
  ],
})
export class InventoryModule {}
