import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BagStatusEnum } from '@prisma/client';
import type { physical_bags } from '@prisma/client';
import { InventoryValidationRepository } from '../repositories/inventory-validation.repository';

@Injectable()
export class PhysicalBagMovementValidator {
  constructor(private readonly validationRepo: InventoryValidationRepository) {}

  async validateTransferToWarehouse(
    bag: physical_bags,
    toWarehouseId: bigint,
  ): Promise<void> {
    if (!bag.current_warehouse_id) {
      throw new UnprocessableEntityException(
        `Bag ${bag.bag_id} is not currently in a warehouse`,
      );
    }
    if (bag.current_warehouse_id === toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse must differ',
      );
    }
    const movableStatuses: BagStatusEnum[] = [
      BagStatusEnum.AVAILABLE,
      BagStatusEnum.RECEIVED,
      BagStatusEnum.RESERVED,
    ];
    if (!movableStatuses.includes(bag.status)) {
      throw new UnprocessableEntityException(
        `Bag ${bag.bag_id} cannot be transferred: current status is ${bag.status}`,
      );
    }
    const warehouseOk =
      await this.validationRepo.warehouseExistsAndActive(toWarehouseId);
    if (!warehouseOk) {
      throw new NotFoundException(
        `Destination warehouse ${toWarehouseId} not found or inactive`,
      );
    }
  }

  async validateAssignToOrder(
    bag: physical_bags,
    toOrderId: bigint,
  ): Promise<void> {
    if (!bag.current_warehouse_id) {
      throw new UnprocessableEntityException(
        `Bag ${bag.bag_id} is not currently in a warehouse`,
      );
    }
    if (bag.status !== BagStatusEnum.AVAILABLE) {
      throw new UnprocessableEntityException(
        `Bag ${bag.bag_id} must be AVAILABLE to assign to an order: current status is ${bag.status}`,
      );
    }
    const orderOk = await this.validationRepo.orderExists(toOrderId);
    if (!orderOk) {
      throw new NotFoundException(`Production order ${toOrderId} not found`);
    }
  }

  validateReturnFromOrder(bag: physical_bags): void {
    if (!bag.current_order_id) {
      throw new UnprocessableEntityException(
        `Bag ${bag.bag_id} is not currently assigned to an order`,
      );
    }
    if (bag.status !== BagStatusEnum.IN_WIP) {
      throw new UnprocessableEntityException(
        `Bag ${bag.bag_id} must be IN_WIP to return: current status is ${bag.status}`,
      );
    }
  }
}
