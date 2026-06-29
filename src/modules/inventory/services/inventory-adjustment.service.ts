import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TxnTypeEnum } from '@prisma/client';
import { LoggerService } from '../../../core/logger/logger.service';
import { InventoryBagsRepository } from '../repositories/inventory-bags.repository';
import { InventoryTransactionsRepository } from '../repositories/inventory-transactions.repository';
import { InventoryValidationRepository } from '../repositories/inventory-validation.repository';
import { InventoryTransactionMapper } from './inventory-transaction.mapper';
import { AdjustmentReasonEnum } from '../dto/apply-adjustment.dto';
import type { TransactionResult } from '../contracts/transaction-result.interface';
import type { ApplyInventoryAdjustmentCommand } from '../use-cases/apply-inventory-adjustment/commands/apply-inventory-adjustment.command';

@Injectable()
export class InventoryAdjustmentService {
  constructor(
    private readonly bagsRepo: InventoryBagsRepository,
    private readonly txnRepo: InventoryTransactionsRepository,
    private readonly validationRepo: InventoryValidationRepository,
    private readonly mapper: InventoryTransactionMapper,
    private readonly logger: LoggerService,
  ) {}

  async applyAdjustment(
    cmd: ApplyInventoryAdjustmentCommand,
  ): Promise<TransactionResult> {
    this.validateSignByReason(cmd.reason, cmd.dozens_delta);

    if (!cmd.txn_reference?.trim()) {
      throw new BadRequestException('Transaction reference is required');
    }

    const modelOk = await this.validationRepo.modelExistsAndActive(
      cmd.model_id,
    );
    if (!modelOk) {
      throw new NotFoundException(
        `Model ${cmd.model_id} not found or inactive`,
      );
    }

    const partOk = await this.validationRepo.partExistsForModel(
      cmd.part_id,
      cmd.model_id,
    );
    if (!partOk) {
      throw new NotFoundException(
        `Part ${cmd.part_id} not found for model ${cmd.model_id}`,
      );
    }

    const warehouseOk = await this.validationRepo.warehouseExistsAndActive(
      cmd.warehouse_id,
    );
    if (!warehouseOk) {
      throw new NotFoundException(
        `Warehouse ${cmd.warehouse_id} not found or inactive`,
      );
    }

    const notePrefix = `[${cmd.reason}]`;
    const fullNotes = cmd.notes ? `${notePrefix} ${cmd.notes}` : notePrefix;

    const txn = await this.bagsRepo.executeInTransaction(async (tx) => {
      await this.bagsRepo.upsertOnHandInTx(
        tx,
        cmd.warehouse_id,
        cmd.model_id,
        cmd.part_id,
        cmd.dozens_delta,
      );
      return this.txnRepo.createInTx(tx, {
        txn_reference: cmd.txn_reference,
        txn_type: TxnTypeEnum.ADJUSTMENT,
        model_id: cmd.model_id,
        part_id: cmd.part_id,
        from_location_type: null,
        from_location_id: null,
        to_location_type: 'WAREHOUSE',
        to_location_id: cmd.warehouse_id,
        dozens_qty: cmd.dozens_delta,
        executed_by: cmd.executed_by,
        notes: fullNotes,
      });
    });

    this.logger.info(
      `Adjustment applied: ref=${cmd.txn_reference}, reason=${cmd.reason}, delta=${cmd.dozens_delta}`,
    );
    return { success: true, transaction: this.mapper.toResponse(txn) };
  }

  private validateSignByReason(
    reason: AdjustmentReasonEnum,
    delta: number,
  ): void {
    if (delta === 0) {
      throw new BadRequestException('Adjustment delta cannot be zero');
    }
    if (reason === AdjustmentReasonEnum.DAMAGE && delta > 0) {
      throw new BadRequestException(
        'DAMAGE adjustment must be a negative quantity',
      );
    }
    if (reason === AdjustmentReasonEnum.LOSS && delta > 0) {
      throw new BadRequestException(
        'LOSS adjustment must be a negative quantity',
      );
    }
  }
}
