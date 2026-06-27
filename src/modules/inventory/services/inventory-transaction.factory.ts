import { Injectable } from '@nestjs/common';
import { TxnTypeEnum } from '@prisma/client';
import type { CreateTransactionData } from '../repositories/inventory-transactions.repository';
import type { ReceiveInventoryCommand } from '../use-cases/create-inventory-transaction/commands/receive-inventory.command';
import type { IssueInventoryCommand } from '../use-cases/create-inventory-transaction/commands/issue-inventory.command';
import type { TransferInventoryCommand } from '../use-cases/create-inventory-transaction/commands/transfer-inventory.command';
import type { AdjustInventoryCommand } from '../use-cases/create-inventory-transaction/commands/adjust-inventory.command';

@Injectable()
export class InventoryTransactionFactory {
  fromReceive(cmd: ReceiveInventoryCommand): CreateTransactionData {
    return {
      txn_reference: cmd.txn_reference,
      txn_type: TxnTypeEnum.RECEIVING,
      model_id: cmd.model_id,
      part_id: cmd.part_id,
      from_location_type: null,
      from_location_id: null,
      to_location_type: 'WAREHOUSE',
      to_location_id: cmd.warehouse_id,
      dozens_qty: cmd.dozens_qty,
      executed_by: cmd.executed_by,
      notes: cmd.notes,
    };
  }

  fromIssue(cmd: IssueInventoryCommand): CreateTransactionData {
    return {
      txn_reference: cmd.txn_reference,
      txn_type: TxnTypeEnum.RELEASE,
      model_id: cmd.model_id,
      part_id: cmd.part_id,
      from_location_type: 'WAREHOUSE',
      from_location_id: cmd.from_warehouse_id,
      to_location_type: 'PRODUCTION_ORDER',
      to_location_id: cmd.to_order_id,
      dozens_qty: cmd.dozens_qty,
      executed_by: cmd.executed_by,
      notes: cmd.notes,
    };
  }

  fromTransfer(cmd: TransferInventoryCommand): [CreateTransactionData, CreateTransactionData] {
    const base = {
      txn_reference: cmd.txn_reference,
      model_id: cmd.model_id,
      part_id: cmd.part_id,
      from_location_type: 'WAREHOUSE',
      from_location_id: cmd.from_warehouse_id,
      to_location_type: 'WAREHOUSE',
      to_location_id: cmd.to_warehouse_id,
      dozens_qty: cmd.dozens_qty,
      executed_by: cmd.executed_by,
      notes: cmd.notes,
    };

    return [
      { ...base, txn_type: TxnTypeEnum.RELEASE },
      { ...base, txn_type: TxnTypeEnum.RECEIVING },
    ];
  }

  fromAdjust(cmd: AdjustInventoryCommand): CreateTransactionData {
    return {
      txn_reference: cmd.txn_reference,
      txn_type: TxnTypeEnum.ADJUSTMENT,
      model_id: cmd.model_id,
      part_id: cmd.part_id,
      from_location_type: null,
      from_location_id: null,
      to_location_type: 'WAREHOUSE',
      to_location_id: cmd.warehouse_id,
      dozens_qty: cmd.dozens_qty,
      executed_by: cmd.executed_by,
      notes: cmd.notes,
    };
  }

  fromOpeningBalance(cmd: ReceiveInventoryCommand): CreateTransactionData {
    return {
      txn_reference: cmd.txn_reference,
      txn_type: TxnTypeEnum.RECEIVING,
      model_id: cmd.model_id,
      part_id: cmd.part_id,
      from_location_type: null,
      from_location_id: null,
      to_location_type: 'WAREHOUSE',
      to_location_id: cmd.warehouse_id,
      dozens_qty: cmd.dozens_qty,
      executed_by: cmd.executed_by,
      notes: cmd.notes,
    };
  }
}
