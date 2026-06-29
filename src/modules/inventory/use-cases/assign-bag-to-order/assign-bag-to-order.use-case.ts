import { Injectable } from '@nestjs/common';
import { PhysicalBagMovementService } from '../../services/physical-bag-movement.service';
import { TransactionHistoryDto } from '../../dto/transaction-history.dto';
import type { AssignBagToOrderCommand } from './commands/assign-bag-to-order.command';

@Injectable()
export class AssignBagToOrderUseCase {
  constructor(private readonly movementService: PhysicalBagMovementService) {}

  async execute(cmd: AssignBagToOrderCommand): Promise<TransactionHistoryDto> {
    return this.movementService.assignToOrder(cmd);
  }
}
