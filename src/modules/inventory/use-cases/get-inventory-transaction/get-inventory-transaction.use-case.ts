import { Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { TransactionResponseDto } from '../../dto/transaction-response.dto';
import type { GetTransactionQuery } from './queries/get-transaction.query';

@Injectable()
export class GetInventoryTransactionUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(query: GetTransactionQuery): Promise<TransactionResponseDto> {
    return this.txnService.getById(query);
  }
}
