import { Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import type { IssueInventoryCommand } from './commands/issue-inventory.command';
import type { TransactionResult } from '../../contracts/transaction-result.interface';

@Injectable()
export class IssueInventoryUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(cmd: IssueInventoryCommand): Promise<TransactionResult> {
    return this.txnService.issue(cmd);
  }
}
