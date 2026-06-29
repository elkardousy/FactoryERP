import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { InventoryBagsRepository } from '../repositories/inventory-bags.repository';
import { WarehouseBalanceSummaryDto } from '../dto/warehouse-balance-summary.dto';
import { ModelBalanceSummaryDto } from '../dto/model-balance-summary.dto';
import { BalanceSnapshotDto } from '../dto/balance-snapshot.dto';

@Injectable()
export class InventoryBalanceService {
  constructor(
    private readonly inventoryBagsRepo: InventoryBagsRepository,
    private readonly logger: LoggerService,
  ) {}

  async getWarehouseSummary(
    warehouseId: bigint,
  ): Promise<WarehouseBalanceSummaryDto> {
    const rows = await this.inventoryBagsRepo.findAllByWarehouse(warehouseId);

    const totalOnHand = rows.reduce(
      (sum, row) => sum + Number(row.dozens_on_hand),
      0,
    );

    this.logger.info(
      `Warehouse balance summary queried for warehouse ${warehouseId}`,
    );

    const dto = new WarehouseBalanceSummaryDto();
    dto.warehouse_id = warehouseId.toString();
    dto.total_on_hand_dozens = totalOnHand.toFixed(3);
    dto.sku_count = rows.length;
    return dto;
  }

  async getModelSummary(modelId: bigint): Promise<ModelBalanceSummaryDto> {
    const rows = await this.inventoryBagsRepo.findAllByModel(modelId);

    const totalOnHand = rows.reduce(
      (sum, row) => sum + Number(row.dozens_on_hand),
      0,
    );

    const distinctWarehouses = new Set(
      rows.map((r) => r.warehouse_id.toString()),
    );

    this.logger.info(`Model balance summary queried for model ${modelId}`);

    const dto = new ModelBalanceSummaryDto();
    dto.model_id = modelId.toString();
    dto.total_on_hand_dozens = totalOnHand.toFixed(3);
    dto.sku_count = rows.length;
    dto.warehouse_count = distinctWarehouses.size;
    return dto;
  }

  async getSnapshot(
    warehouseId: bigint,
    modelId: bigint,
    partId: bigint,
  ): Promise<BalanceSnapshotDto> {
    const row = await this.inventoryBagsRepo.findByKey(
      warehouseId,
      modelId,
      partId,
    );

    if (!row) {
      throw new NotFoundException(
        `No inventory ledger entry found for warehouse=${warehouseId} model=${modelId} part=${partId}`,
      );
    }

    this.logger.info(
      `Balance snapshot queried for warehouse=${warehouseId} model=${modelId} part=${partId}`,
    );

    const dto = new BalanceSnapshotDto();
    dto.bag_id = row.bag_id.toString();
    dto.warehouse_id = row.warehouse_id.toString();
    dto.model_id = row.model_id.toString();
    dto.part_id = row.part_id.toString();
    dto.on_hand_dozens = row.dozens_on_hand.toString();
    dto.version = row.version.toString();
    dto.last_updated = row.last_updated.toISOString();
    return dto;
  }
}
