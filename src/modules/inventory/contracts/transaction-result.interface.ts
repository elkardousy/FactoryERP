import type { TransactionResponseDto } from '../dto/transaction-response.dto';

export interface TransactionResult {
  success: true;
  transaction: TransactionResponseDto;
}

export interface TransferResult {
  success: true;
  outbound: TransactionResponseDto;
  inbound: TransactionResponseDto;
}
