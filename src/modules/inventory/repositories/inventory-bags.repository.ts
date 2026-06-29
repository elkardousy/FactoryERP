import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type { inventory_bags } from '@prisma/client';

@Injectable()
export class InventoryBagsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByKey(
    warehouseId: bigint,
    modelId: bigint,
    partId: bigint,
  ): Promise<inventory_bags | null> {
    return this.db.inventory_bags.findUnique({
      where: {
        warehouse_id_model_id_part_id: {
          warehouse_id: warehouseId,
          model_id: modelId,
          part_id: partId,
        },
      },
    });
  }

  async findAllByWarehouse(warehouseId: bigint): Promise<inventory_bags[]> {
    return this.db.inventory_bags.findMany({
      where: { warehouse_id: warehouseId },
      orderBy: [{ model_id: 'asc' }, { part_id: 'asc' }],
    });
  }

  async findAllByModel(modelId: bigint): Promise<inventory_bags[]> {
    return this.db.inventory_bags.findMany({
      where: { model_id: modelId },
      orderBy: [{ warehouse_id: 'asc' }, { part_id: 'asc' }],
    });
  }

  async upsertOnHandInTx(
    tx: PrismaService,
    warehouseId: bigint,
    modelId: bigint,
    partId: bigint,
    delta: number,
  ): Promise<void> {
    await tx.inventory_bags.upsert({
      where: {
        warehouse_id_model_id_part_id: {
          warehouse_id: warehouseId,
          model_id: modelId,
          part_id: partId,
        },
      },
      create: {
        warehouse_id: warehouseId,
        model_id: modelId,
        part_id: partId,
        dozens_on_hand: delta,
      },
      update: {
        dozens_on_hand: { increment: delta },
        last_updated: new Date(),
      },
    });
  }
}
