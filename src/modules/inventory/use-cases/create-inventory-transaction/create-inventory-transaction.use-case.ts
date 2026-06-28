import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { TransactionOperationType } from '../../dto/transaction-request.dto';
import type { CreateInventoryTransactionCommand } from './commands/create-inventory-transaction.command';
import type {
  TransactionResult,
  TransferResult,
} from '../../contracts/transaction-result.interface';
import { ReceiveInventoryCommand } from './commands/receive-inventory.command';
import { IssueInventoryCommand } from './commands/issue-inventory.command';
import { TransferInventoryCommand } from './commands/transfer-inventory.command';
import { AdjustInventoryCommand } from './commands/adjust-inventory.command';

@Injectable()
export class CreateInventoryTransactionUseCase {
  constructor(private readonly txnService: InventoryTransactionService) {}

  async execute(
    cmd: CreateInventoryTransactionCommand,
  ): Promise<TransactionResult | TransferResult> {
    switch (cmd.operation) {
      case TransactionOperationType.RECEIVE:
      case TransactionOperationType.OPENING_BALANCE: {
        if (!cmd.to_warehouse_id)
          throw new BadRequestException(
            'to_warehouse_id required for RECEIVE/OPENING_BALANCE',
          );
        return this.txnService.receive(
          new ReceiveInventoryCommand(
            cmd.txn_reference,
            cmd.model_id,
            cmd.part_id,
            cmd.to_warehouse_id,
            cmd.dozens_qty,
            cmd.executed_by,
            cmd.notes,
          ),
        );
      }

      case TransactionOperationType.ISSUE: {
        if (!cmd.from_warehouse_id)
          throw new BadRequestException('from_warehouse_id required for ISSUE');
        if (!cmd.to_order_id)
          throw new BadRequestException('to_order_id required for ISSUE');
        return this.txnService.issue(
          new IssueInventoryCommand(
            cmd.txn_reference,
            cmd.model_id,
            cmd.part_id,
            cmd.from_warehouse_id,
            cmd.to_order_id,
            cmd.dozens_qty,
            cmd.executed_by,
            cmd.notes,
          ),
        );
      }

      case TransactionOperationType.TRANSFER: {
        if (!cmd.from_warehouse_id)
          throw new BadRequestException(
            'from_warehouse_id required for TRANSFER',
          );
        if (!cmd.to_warehouse_id)
          throw new BadRequestException(
            'to_warehouse_id required for TRANSFER',
          );
        return this.txnService.transfer(
          new TransferInventoryCommand(
            cmd.txn_reference,
            cmd.model_id,
            cmd.part_id,
            cmd.from_warehouse_id,
            cmd.to_warehouse_id,
            cmd.dozens_qty,
            cmd.executed_by,
            cmd.notes,
          ),
        );
      }

      case TransactionOperationType.ADJUSTMENT: {
        if (!cmd.to_warehouse_id)
          throw new BadRequestException(
            'to_warehouse_id required for ADJUSTMENT',
          );
        return this.txnService.adjust(
          new AdjustInventoryCommand(
            cmd.txn_reference,
            cmd.model_id,
            cmd.part_id,
            cmd.to_warehouse_id,
            cmd.dozens_qty,
            cmd.executed_by,
            cmd.notes,
          ),
        );
      }

      default:
        throw new BadRequestException('Unknown operation type');
    }
  }
}
