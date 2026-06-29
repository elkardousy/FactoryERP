import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type { warehouse_locations, Prisma } from '@prisma/client';

@Injectable()
export class WarehouseLocationRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    data: Prisma.warehouse_locationsUncheckedCreateInput,
  ): Promise<warehouse_locations> {
    return this.db.warehouse_locations.create({ data });
  }

  async findById(locationId: bigint): Promise<warehouse_locations | null> {
    return this.db.warehouse_locations.findUnique({
      where: { location_id: locationId },
    });
  }

  async findMany(filter: {
    warehouse_id?: bigint;
    zone_code?: string;
    is_active?: boolean;
  }): Promise<warehouse_locations[]> {
    const where: Prisma.warehouse_locationsWhereInput = {};
    if (filter.warehouse_id !== undefined)
      where.warehouse_id = filter.warehouse_id;
    if (filter.zone_code !== undefined) where.zone_code = filter.zone_code;
    if (filter.is_active !== undefined) where.is_active = filter.is_active;

    return this.db.warehouse_locations.findMany({
      where,
      orderBy: [
        { zone_code: 'asc' },
        { rack_code: 'asc' },
        { shelf_code: 'asc' },
        { bin_code: 'asc' },
      ],
    });
  }

  async updateStatus(
    locationId: bigint,
    isActive: boolean,
  ): Promise<warehouse_locations> {
    return this.db.warehouse_locations.update({
      where: { location_id: locationId },
      data: { is_active: isActive },
    });
  }

  async existsByCode(
    warehouseId: bigint,
    locationCode: string,
  ): Promise<boolean> {
    const count = await this.db.warehouse_locations.count({
      where: { warehouse_id: warehouseId, location_code: locationCode },
    });
    return count > 0;
  }

  async sumCapacityInUse(locationId: bigint): Promise<number> {
    const result = await this.db.physical_bags.aggregate({
      where: { location_id: locationId },
      _sum: { current_dozens: true },
    });
    return Number(result._sum.current_dozens ?? 0);
  }
}
