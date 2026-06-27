import { Module } from '@nestjs/common';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { PhysicalBagsRepository } from './repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from './repositories/physical-bag-reservations.repository';
import { InventoryBagsRepository } from './repositories/inventory-bags.repository';
import { InventoryTransactionsRepository } from './repositories/inventory-transactions.repository';

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService,
    PhysicalBagsRepository,
    PhysicalBagReservationsRepository,
    InventoryBagsRepository,
    InventoryTransactionsRepository,
  ],
  exports: [
    PhysicalBagsRepository,
    PhysicalBagReservationsRepository,
    InventoryBagsRepository,
    InventoryTransactionsRepository,
  ],
})
export class InventoryModule {}
