import { Injectable } from '@nestjs/common';
import type { inventory_transactions } from '@prisma/client';
import { TransactionResponseDto } from '../dto/transaction-response.dto';

@Injectable()
export class InventoryTransactionMapper {
  toResponse(txn: inventory_transactions): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.txn_id = txn.txn_id.toString();
    dto.txn_reference = txn.txn_reference;
    dto.txn_type = txn.txn_type;
    dto.model_id = txn.model_id.toString();
    dto.part_id = txn.part_id ? txn.part_id.toString() : null;
    dto.from_location_type = txn.from_location_type ?? null;
    dto.from_location_id = txn.from_location_id ? txn.from_location_id.toString() : null;
    dto.to_location_type = txn.to_location_type ?? null;
    dto.to_location_id = txn.to_location_id ? txn.to_location_id.toString() : null;
    dto.dozens_qty = txn.dozens_qty.toString();
    dto.executed_by = txn.executed_by.toString();
    dto.executed_at = txn.executed_at.toISOString();
    dto.notes = txn.notes ?? null;
    return dto;
  }

  toResponseList(txns: inventory_transactions[]): TransactionResponseDto[] {
    return txns.map((t) => this.toResponse(t));
  }
}
