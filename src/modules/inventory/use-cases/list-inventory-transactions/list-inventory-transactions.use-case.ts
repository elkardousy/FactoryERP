import { Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import { TransactionResponseDto } from '../../dto/transaction-response.dto';
import type { GetTransactionsQuery } from './queries/get-transactions.query';

@Injectable()
export class ListInventoryTransactionsUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(
    query: GetTransactionsQuery,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    return this.txnService.listTransactions(query);
  }
}
