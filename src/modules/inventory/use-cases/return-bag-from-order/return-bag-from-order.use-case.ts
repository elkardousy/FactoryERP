import { Injectable } from '@nestjs/common';
import { PhysicalBagMovementService } from '../../services/physical-bag-movement.service';
import { TransactionHistoryDto } from '../../dto/transaction-history.dto';
import type { ReturnBagFromOrderCommand } from './commands/return-bag-from-order.command';

@Injectable()
export class ReturnBagFromOrderUseCase {
  constructor(private readonly movementService: PhysicalBagMovementService) {}

  async execute(
    cmd: ReturnBagFromOrderCommand,
  ): Promise<TransactionHistoryDto> {
    return this.movementService.returnFromOrder(cmd);
  }
}
