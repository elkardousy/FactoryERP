import { Injectable, NotFoundException } from '@nestjs/common';
import { BagStatusEnum } from '@prisma/client';
import type { physical_bag_movements } from '@prisma/client';
import { LoggerService } from '../../../core/logger/logger.service';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { PhysicalBagMovementValidator } from './physical-bag-movement.validator';
import { TransactionHistoryDto } from '../dto/transaction-history.dto';
import type { TransferBagToWarehouseCommand } from '../use-cases/transfer-bag-to-warehouse/commands/transfer-bag-to-warehouse.command';
import type { AssignBagToOrderCommand } from '../use-cases/assign-bag-to-order/commands/assign-bag-to-order.command';
import type { ReturnBagFromOrderCommand } from '../use-cases/return-bag-from-order/commands/return-bag-from-order.command';

@Injectable()
export class PhysicalBagMovementService {
  constructor(
    private readonly bagsRepo: PhysicalBagsRepository,
    private readonly validator: PhysicalBagMovementValidator,
    private readonly logger: LoggerService,
  ) {}

  async transferToWarehouse(
    cmd: TransferBagToWarehouseCommand,
  ): Promise<TransactionHistoryDto> {
    const bag = await this.bagsRepo.findById(cmd.bag_id);
    if (!bag) throw new NotFoundException(`Bag ${cmd.bag_id} not found`);

    await this.validator.validateTransferToWarehouse(bag, cmd.to_warehouse_id);

    const movement = await this.bagsRepo.executeInTransaction(async (tx) => {
      const m = await this.bagsRepo.createMovementInTx(tx, {
        bag_id: cmd.bag_id,
        from_status: bag.status,
        to_status: BagStatusEnum.AVAILABLE,
        from_warehouse_id: bag.current_warehouse_id,
        to_warehouse_id: cmd.to_warehouse_id,
        from_order_id: null,
        to_order_id: null,
        dozens_moved: cmd.dozens_moved,
        movement_reason: cmd.movement_reason,
        performed_by: cmd.performed_by,
        notes: cmd.notes,
      });
      await this.bagsRepo.updateBagLocationInTx(tx, cmd.bag_id, {
        current_warehouse_id: cmd.to_warehouse_id,
        current_order_id: null,
        status: BagStatusEnum.AVAILABLE,
      });
      return m;
    });

    this.logger.info(
      `Bag ${cmd.bag_id} transferred from warehouse ${bag.current_warehouse_id} to ${cmd.to_warehouse_id}`,
    );
    return this.toDto(movement);
  }

  async assignToOrder(
    cmd: AssignBagToOrderCommand,
  ): Promise<TransactionHistoryDto> {
    const bag = await this.bagsRepo.findById(cmd.bag_id);
    if (!bag) throw new NotFoundException(`Bag ${cmd.bag_id} not found`);

    await this.validator.validateAssignToOrder(bag, cmd.to_order_id);

    const movement = await this.bagsRepo.executeInTransaction(async (tx) => {
      const m = await this.bagsRepo.createMovementInTx(tx, {
        bag_id: cmd.bag_id,
        from_status: bag.status,
        to_status: BagStatusEnum.IN_WIP,
        from_warehouse_id: bag.current_warehouse_id,
        to_warehouse_id: null,
        from_order_id: null,
        to_order_id: cmd.to_order_id,
        dozens_moved: cmd.dozens_moved,
        movement_reason: cmd.movement_reason,
        performed_by: cmd.performed_by,
        notes: cmd.notes,
      });
      await this.bagsRepo.updateBagLocationInTx(tx, cmd.bag_id, {
        current_warehouse_id: null,
        current_order_id: cmd.to_order_id,
        status: BagStatusEnum.IN_WIP,
      });
      return m;
    });

    this.logger.info(`Bag ${cmd.bag_id} assigned to order ${cmd.to_order_id}`);
    return this.toDto(movement);
  }

  async returnFromOrder(
    cmd: ReturnBagFromOrderCommand,
  ): Promise<TransactionHistoryDto> {
    const bag = await this.bagsRepo.findById(cmd.bag_id);
    if (!bag) throw new NotFoundException(`Bag ${cmd.bag_id} not found`);

    this.validator.validateReturnFromOrder(bag);

    const movement = await this.bagsRepo.executeInTransaction(async (tx) => {
      const m = await this.bagsRepo.createMovementInTx(tx, {
        bag_id: cmd.bag_id,
        from_status: bag.status,
        to_status: BagStatusEnum.RETURNED,
        from_warehouse_id: null,
        to_warehouse_id: cmd.to_warehouse_id,
        from_order_id: bag.current_order_id,
        to_order_id: null,
        dozens_moved: null,
        movement_reason: cmd.movement_reason,
        performed_by: cmd.performed_by,
        notes: cmd.notes,
      });
      await this.bagsRepo.updateBagLocationInTx(tx, cmd.bag_id, {
        current_warehouse_id: cmd.to_warehouse_id,
        current_order_id: null,
        status: BagStatusEnum.RETURNED,
      });
      return m;
    });

    this.logger.info(
      `Bag ${cmd.bag_id} returned from order ${bag.current_order_id} to warehouse ${cmd.to_warehouse_id}`,
    );
    return this.toDto(movement);
  }

  private toDto(m: physical_bag_movements): TransactionHistoryDto {
    const dto = new TransactionHistoryDto();
    dto.movement_id = m.movement_id.toString();
    dto.bag_id = m.bag_id.toString();
    dto.from_status = m.from_status ?? null;
    dto.to_status = m.to_status;
    dto.from_warehouse_id = m.from_warehouse_id
      ? m.from_warehouse_id.toString()
      : null;
    dto.to_warehouse_id = m.to_warehouse_id
      ? m.to_warehouse_id.toString()
      : null;
    dto.from_order_id = m.from_order_id ? m.from_order_id.toString() : null;
    dto.to_order_id = m.to_order_id ? m.to_order_id.toString() : null;
    dto.dozens_moved = m.dozens_moved ? m.dozens_moved.toString() : null;
    dto.movement_reason = m.movement_reason;
    dto.performed_by = m.performed_by.toString();
    dto.performed_at = m.performed_at.toISOString();
    dto.notes = m.notes ?? null;
    return dto;
  }
}
