import { Injectable } from '@nestjs/common';
import { WarehouseTypeEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { warehouses } from '@prisma/client';

interface CreateWarehouseData {
  warehouse_code: string;
  warehouse_name: string;
  warehouse_type: WarehouseTypeEnum;
}

type UpdateWarehouseData = Partial<CreateWarehouseData>;

interface WarehouseFilter {
  search?: string;
  warehouse_type?: WarehouseTypeEnum;
  is_active?: boolean;
}

@Injectable()
export class WarehousesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateWarehouseData): Promise<warehouses> {
    return this.db.warehouses.create({ data });
  }

  async update(
    warehouseId: bigint,
    data: UpdateWarehouseData,
  ): Promise<warehouses> {
    return this.db.warehouses.update({
      where: { warehouse_id: warehouseId },
      data,
    });
  }

  async findById(warehouseId: bigint): Promise<warehouses | null> {
    return this.db.warehouses.findUnique({
      where: { warehouse_id: warehouseId },
    });
  }

  async findByCode(warehouseCode: string): Promise<warehouses | null> {
    return this.db.warehouses.findUnique({
      where: { warehouse_code: warehouseCode },
    });
  }

  async findAllWithPagination(
    filter: WarehouseFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<warehouses>> {
    const where = {
      ...(filter.is_active !== undefined && { is_active: filter.is_active }),
      ...(filter.warehouse_type && { warehouse_type: filter.warehouse_type }),
      ...(filter.search && {
        OR: [
          {
            warehouse_code: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            warehouse_name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.warehouses.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { warehouse_code: 'asc' },
      }),
      this.db.warehouses.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async softDelete(warehouseId: bigint): Promise<warehouses> {
    return this.db.warehouses.update({
      where: { warehouse_id: warehouseId },
      data: { is_active: false },
    });
  }

  async restore(warehouseId: bigint): Promise<warehouses> {
    return this.db.warehouses.update({
      where: { warehouse_id: warehouseId },
      data: { is_active: true },
    });
  }
}
