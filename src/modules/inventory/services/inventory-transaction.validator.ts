import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryValidationRepository } from '../repositories/inventory-validation.repository';
import type { ReceiveInventoryCommand } from '../use-cases/create-inventory-transaction/commands/receive-inventory.command';
import type { IssueInventoryCommand } from '../use-cases/create-inventory-transaction/commands/issue-inventory.command';
import type { TransferInventoryCommand } from '../use-cases/create-inventory-transaction/commands/transfer-inventory.command';
import type { AdjustInventoryCommand } from '../use-cases/create-inventory-transaction/commands/adjust-inventory.command';

@Injectable()
export class InventoryTransactionValidator {
  constructor(private readonly validationRepo: InventoryValidationRepository) {}

  async validateReceive(cmd: ReceiveInventoryCommand): Promise<void> {
    this.assertPositiveQty(cmd.dozens_qty);
    this.assertReference(cmd.txn_reference);
    await this.assertModel(cmd.model_id);
    await this.assertPart(cmd.part_id, cmd.model_id);
    await this.assertWarehouse(cmd.warehouse_id);
  }

  async validateIssue(cmd: IssueInventoryCommand): Promise<void> {
    this.assertPositiveQty(cmd.dozens_qty);
    this.assertReference(cmd.txn_reference);
    await this.assertModel(cmd.model_id);
    await this.assertPart(cmd.part_id, cmd.model_id);
    await this.assertWarehouse(cmd.from_warehouse_id);
    await this.assertOrder(cmd.to_order_id);
  }

  async validateTransfer(cmd: TransferInventoryCommand): Promise<void> {
    this.assertPositiveQty(cmd.dozens_qty);
    this.assertReference(cmd.txn_reference);
    if (cmd.from_warehouse_id === cmd.to_warehouse_id) {
      throw new BadRequestException(
        'Source and destination warehouse must differ',
      );
    }
    await this.assertModel(cmd.model_id);
    await this.assertPart(cmd.part_id, cmd.model_id);
    await this.assertWarehouse(cmd.from_warehouse_id);
    await this.assertWarehouse(cmd.to_warehouse_id);
  }

  async validateAdjust(cmd: AdjustInventoryCommand): Promise<void> {
    if (cmd.dozens_qty === 0) {
      throw new BadRequestException('Adjustment quantity cannot be zero');
    }
    this.assertReference(cmd.txn_reference);
    await this.assertModel(cmd.model_id);
    await this.assertPart(cmd.part_id, cmd.model_id);
    await this.assertWarehouse(cmd.warehouse_id);
  }

  private assertPositiveQty(qty: number): void {
    if (qty <= 0)
      throw new BadRequestException('Quantity must be greater than zero');
  }

  private assertReference(ref: string): void {
    if (!ref || !ref.trim())
      throw new BadRequestException('Transaction reference is required');
  }

  private async assertModel(modelId: bigint): Promise<void> {
    const ok = await this.validationRepo.modelExistsAndActive(modelId);
    if (!ok)
      throw new NotFoundException(`Model ${modelId} not found or inactive`);
  }

  private async assertPart(
    partId: bigint | null,
    modelId: bigint,
  ): Promise<void> {
    if (!partId) return;
    const ok = await this.validationRepo.partExistsForModel(partId, modelId);
    if (!ok)
      throw new NotFoundException(
        `Part ${partId} not found for model ${modelId}`,
      );
  }

  private async assertWarehouse(warehouseId: bigint): Promise<void> {
    const ok = await this.validationRepo.warehouseExistsAndActive(warehouseId);
    if (!ok)
      throw new NotFoundException(
        `Warehouse ${warehouseId} not found or inactive`,
      );
  }

  private async assertOrder(orderId: bigint): Promise<void> {
    const ok = await this.validationRepo.orderExists(orderId);
    if (!ok)
      throw new NotFoundException(`Production order ${orderId} not found`);
  }
}
