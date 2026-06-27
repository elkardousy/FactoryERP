import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';

@Injectable()
export class InventoryValidationRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async warehouseExistsAndActive(warehouseId: bigint): Promise<boolean> {
    const warehouse = await this.db.warehouses.findUnique({
      where: { warehouse_id: warehouseId },
      select: { is_active: true },
    });
    return warehouse?.is_active === true;
  }

  async modelExistsAndActive(modelId: bigint): Promise<boolean> {
    const model = await this.db.models.findUnique({
      where: { model_id: modelId },
      select: { is_active: true },
    });
    return model?.is_active === true;
  }

  async partExistsForModel(partId: bigint, modelId: bigint): Promise<boolean> {
    const part = await this.db.model_parts.findFirst({
      where: { part_id: partId, model_id: modelId },
      select: { part_id: true },
    });
    return part !== null;
  }

  async orderExists(orderId: bigint): Promise<boolean> {
    const order = await this.db.production_orders.findUnique({
      where: { order_id: orderId },
      select: { order_id: true },
    });
    return order !== null;
  }
}
