import { Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import type { TransferInventoryCommand } from './commands/transfer-inventory.command';
import type { TransferResult } from '../../contracts/transaction-result.interface';

@Injectable()
export class TransferInventoryUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(cmd: TransferInventoryCommand): Promise<TransferResult> {
    return this.txnService.transfer(cmd);
  }
}
