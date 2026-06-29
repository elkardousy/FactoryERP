import { Injectable } from '@nestjs/common';
import { InventoryAdjustmentService } from '../../services/inventory-adjustment.service';
import type { TransactionResult } from '../../contracts/transaction-result.interface';
import type { ApplyInventoryAdjustmentCommand } from './commands/apply-inventory-adjustment.command';

@Injectable()
export class ApplyInventoryAdjustmentUseCase {
  constructor(private readonly adjustmentService: InventoryAdjustmentService) {}

  async execute(
    cmd: ApplyInventoryAdjustmentCommand,
  ): Promise<TransactionResult> {
    return this.adjustmentService.applyAdjustment(cmd);
  }
}
