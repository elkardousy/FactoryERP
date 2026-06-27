import { Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import { TransactionHistoryDto } from '../../dto/transaction-history.dto';
import type { GetTransactionsByBagQuery } from './queries/get-transactions-by-bag.query';

@Injectable()
export class GetBagTransactionHistoryUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(
    query: GetTransactionsByBagQuery,
  ): Promise<PaginatedResult<TransactionHistoryDto>> {
    return this.txnService.getBagHistory(query);
  }
}
