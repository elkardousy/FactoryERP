import { Injectable } from '@nestjs/common';
import { PhysicalBagMovementService } from '../../services/physical-bag-movement.service';
import { TransactionHistoryDto } from '../../dto/transaction-history.dto';
import type { TransferBagToWarehouseCommand } from './commands/transfer-bag-to-warehouse.command';

@Injectable()
export class TransferBagToWarehouseUseCase {
  constructor(private readonly movementService: PhysicalBagMovementService) {}

  async execute(
    cmd: TransferBagToWarehouseCommand,
  ): Promise<TransactionHistoryDto> {
    return this.movementService.transferToWarehouse(cmd);
  }
}
