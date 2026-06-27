import { Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import type { AdjustInventoryCommand } from './commands/adjust-inventory.command';
import type { TransactionResult } from '../../contracts/transaction-result.interface';

@Injectable()
export class AdjustInventoryUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(cmd: AdjustInventoryCommand): Promise<TransactionResult> {
    return this.txnService.adjust(cmd);
  }
}
