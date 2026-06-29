import { Injectable } from '@nestjs/common';
import { BagStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { physical_bags, physical_bag_movements } from '@prisma/client';

export interface CreateMovementData {
  bag_id: bigint;
  from_status: BagStatusEnum | null;
  to_status: BagStatusEnum;
  from_warehouse_id: bigint | null;
  to_warehouse_id: bigint | null;
  from_order_id: bigint | null;
  to_order_id: bigint | null;
  dozens_moved: number | null;
  movement_reason: string;
  performed_by: bigint;
  notes: string | null;
}

export interface UpdateBagLocationData {
  current_warehouse_id?: bigint | null;
  current_order_id?: bigint | null;
  status: BagStatusEnum;
}

export interface PhysicalBagFilter {
  search?: string;
  status?: BagStatusEnum;
  customer_id?: bigint;
  model_id?: bigint;
  warehouse_id?: bigint;
}

@Injectable()
export class PhysicalBagsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(bagId: bigint): Promise<physical_bags | null> {
    return this.db.physical_bags.findUnique({ where: { bag_id: bagId } });
  }

  async findByCode(bagCode: string): Promise<physical_bags | null> {
    return this.db.physical_bags.findUnique({ where: { bag_code: bagCode } });
  }

  async findAllWithPagination(
    filter: PhysicalBagFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<physical_bags>> {
    const where = {
      ...(filter.status && { status: filter.status }),
      ...(filter.customer_id && { customer_id: filter.customer_id }),
      ...(filter.model_id && { model_id: filter.model_id }),
      ...(filter.warehouse_id && { current_warehouse_id: filter.warehouse_id }),
      ...(filter.search && {
        bag_code: { contains: filter.search, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.physical_bags.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.db.physical_bags.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async createMovementInTx(
    tx: PrismaService,
    data: CreateMovementData,
  ): Promise<physical_bag_movements> {
    return tx.physical_bag_movements.create({ data });
  }

  async updateBagLocationInTx(
    tx: PrismaService,
    bagId: bigint,
    data: UpdateBagLocationData,
  ): Promise<physical_bags> {
    return tx.physical_bags.update({
      where: { bag_id: bagId },
      data,
    });
  }

  async findMovementHistory(
    bagId: bigint,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<physical_bag_movements>> {
    const where = { bag_id: bagId };

    const [items, total] = await this.db.$transaction([
      this.db.physical_bag_movements.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { performed_at: 'desc' },
      }),
      this.db.physical_bag_movements.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
