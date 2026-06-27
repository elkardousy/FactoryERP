import { Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import type { ReceiveInventoryCommand } from './commands/receive-inventory.command';
import type { TransactionResult } from '../../contracts/transaction-result.interface';

@Injectable()
export class ReceiveInventoryUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(cmd: ReceiveInventoryCommand): Promise<TransactionResult> {
    return this.txnService.receive(cmd);
  }
}
