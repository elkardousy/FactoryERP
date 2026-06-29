import { Injectable, NotFoundException } from '@nestjs/common';
import type { inventory_bags } from '@prisma/client';
import { LoggerService } from '../../../core/logger/logger.service';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from '../repositories/physical-bag-reservations.repository';
import { InventoryBagsRepository } from '../repositories/inventory-bags.repository';
import { BagAvailabilityDto } from '../dto/bag-availability.dto';
import { LedgerAvailabilityDto } from '../dto/ledger-availability.dto';

@Injectable()
export class InventoryAvailabilityService {
  constructor(
    private readonly bagsRepo: PhysicalBagsRepository,
    private readonly reservationsRepo: PhysicalBagReservationsRepository,
    private readonly inventoryBagsRepo: InventoryBagsRepository,
    private readonly logger: LoggerService,
  ) {}

  async getBagAvailability(bagId: bigint): Promise<BagAvailabilityDto> {
    const bag = await this.bagsRepo.findById(bagId);
    if (!bag) {
      throw new NotFoundException(`Bag ${bagId} not found`);
    }

    const reservedDozens =
      await this.reservationsRepo.sumActiveReservedDozens(bagId);
    const currentDozens = Number(bag.current_dozens);
    const freeDozens = Math.max(0, currentDozens - reservedDozens);

    this.logger.info(`Bag availability queried for bag ${bagId}`);

    const dto = new BagAvailabilityDto();
    dto.bag_id = bag.bag_id.toString();
    dto.bag_code = bag.bag_code;
    dto.current_dozens = bag.current_dozens.toString();
    dto.reserved_dozens = reservedDozens.toFixed(3);
    dto.free_dozens = freeDozens.toFixed(3);
    dto.status = bag.status;
    return dto;
  }

  async getWarehouseAvailability(
    warehouseId: bigint,
  ): Promise<LedgerAvailabilityDto[]> {
    const rows = await this.inventoryBagsRepo.findAllByWarehouse(warehouseId);
    this.logger.info(
      `Warehouse availability queried for warehouse ${warehouseId}`,
    );
    return rows.map((r) => this.toLedgerDto(r));
  }

  async getModelAvailability(
    modelId: bigint,
  ): Promise<LedgerAvailabilityDto[]> {
    const rows = await this.inventoryBagsRepo.findAllByModel(modelId);
    this.logger.info(`Model availability queried for model ${modelId}`);
    return rows.map((r) => this.toLedgerDto(r));
  }

  private toLedgerDto(r: inventory_bags): LedgerAvailabilityDto {
    const dto = new LedgerAvailabilityDto();
    dto.bag_id = r.bag_id.toString();
    dto.warehouse_id = r.warehouse_id.toString();
    dto.model_id = r.model_id.toString();
    dto.part_id = r.part_id.toString();
    dto.on_hand_dozens = r.dozens_on_hand.toString();
    dto.last_updated = r.last_updated.toISOString();
    return dto;
  }
}
