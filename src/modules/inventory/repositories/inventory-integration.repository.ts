import { Injectable } from '@nestjs/common';
import type { physical_bags, wip_inventory } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';

@Injectable()
export class InventoryIntegrationRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findPhysicalBagsForOrder(orderId: bigint): Promise<physical_bags[]> {
    return this.db.physical_bags.findMany({
      where: { current_order_id: orderId },
      orderBy: { bag_code: 'asc' },
    });
  }

  async findWipPositionsForOrder(orderId: bigint): Promise<wip_inventory[]> {
    return this.db.wip_inventory.findMany({
      where: { order_id: orderId },
      orderBy: { part_id: 'asc' },
    });
  }

  async findAllWipPositions(orderId?: bigint): Promise<wip_inventory[]> {
    return this.db.wip_inventory.findMany({
      where: { ...(orderId && { order_id: orderId }) },
      orderBy: [{ order_id: 'asc' }, { part_id: 'asc' }],
      take: 500,
    });
  }
}
