import { Injectable } from '@nestjs/common';
import {
  OrderStatusEnum,
  PartStatusEnum,
  ReleaseTypeEnum,
  StageStatusEnum,
  type production_orders,
  type production_order_parts,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  type PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';

interface CreateProductionOrderData {
  order_number: string;
  model_id: bigint;
  line_id: bigint;
  release_type: ReleaseTypeEnum;
  cmo_line_id?: bigint;
  target_dozens?: number;
  notes?: string;
  created_by: bigint;
}

interface ProductionOrderFilter {
  status?: OrderStatusEnum;
  line_id?: bigint;
  model_id?: bigint;
}

type OrderWithParts = production_orders & {
  production_order_parts: production_order_parts[];
};

@Injectable()
export class ProductionOrdersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateProductionOrderData): Promise<production_orders> {
    return this.db.production_orders.create({
      data: {
        order_number: data.order_number,
        model_id: data.model_id,
        line_id: data.line_id,
        release_type: data.release_type,
        cmo_line_id: data.cmo_line_id ?? null,
        target_dozens: data.target_dozens ?? null,
        notes: data.notes ?? null,
        created_by: data.created_by,
      },
    });
  }

  async createParts(
    orderId: bigint,
    partIds: bigint[],
  ): Promise<production_order_parts[]> {
    await this.db.production_order_parts.createMany({
      data: partIds.map((part_id) => ({ order_id: orderId, part_id })),
    });
    return this.db.production_order_parts.findMany({
      where: { order_id: orderId },
      orderBy: { part_id: 'asc' },
    });
  }

  async findById(id: bigint): Promise<OrderWithParts | null> {
    return this.db.production_orders.findUnique({
      where: { order_id: id },
      include: {
        production_order_parts: {
          orderBy: { part_id: 'asc' },
        },
      },
    });
  }

  async update(
    id: bigint,
    data: { notes?: string; target_dozens?: number | null },
  ): Promise<production_orders> {
    return this.db.production_orders.update({
      where: { order_id: id },
      data: {
        notes: data.notes,
        target_dozens: data.target_dozens,
      },
    });
  }

  async updateStatus(
    id: bigint,
    status: OrderStatusEnum,
    meta?: { closedBy?: bigint; closedAt?: Date },
  ): Promise<production_orders> {
    return this.db.production_orders.update({
      where: { order_id: id },
      data: {
        status,
        closed_by: meta?.closedBy ?? undefined,
        closed_at: meta?.closedAt ?? undefined,
      },
    });
  }

  async findMany(
    filter: ProductionOrderFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<production_orders>> {
    const where = {
      status: filter.status,
      line_id: filter.line_id,
      model_id: filter.model_id,
    };
    const [items, total] = await this.db.$transaction([
      this.db.production_orders.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.production_orders.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async countPartsByStatus(
    orderId: bigint,
    status: PartStatusEnum,
  ): Promise<number> {
    return this.db.production_order_parts.count({
      where: { order_id: orderId, status },
    });
  }

  async countParts(orderId: bigint): Promise<number> {
    return this.db.production_order_parts.count({
      where: { order_id: orderId },
    });
  }

  async countNonReleasedParts(orderId: bigint): Promise<number> {
    return this.db.production_order_parts.count({
      where: {
        order_id: orderId,
        status: { not: PartStatusEnum.RELEASED },
      },
    });
  }

  async countNonCompleteStages(orderId: bigint): Promise<number> {
    return this.db.production_stage_logs.count({
      where: {
        order_id: orderId,
        status: { not: StageStatusEnum.COMPLETE },
      },
    });
  }

  async countStageLogs(orderId: bigint): Promise<number> {
    return this.db.production_stage_logs.count({
      where: { order_id: orderId },
    });
  }

  async isPackingPosted(orderId: bigint): Promise<boolean> {
    const packing = await this.db.packing_orders.findFirst({
      where: { production_order_id: orderId },
      select: { status: true },
    });
    return packing?.status === 'POSTED';
  }

  async initializeStageLogsInTx(
    tx: PrismaService,
    orderId: bigint,
    lineId: bigint,
  ): Promise<void> {
    const stages = await tx.production_stages.findMany({
      orderBy: { sequence_order: 'asc' },
      select: { stage_id: true },
    });
    if (stages.length === 0) return;
    await tx.production_stage_logs.createMany({
      data: stages.map((s) => ({
        order_id: orderId,
        stage_id: s.stage_id,
        line_id: lineId,
      })),
      skipDuplicates: true,
    });
  }

  async validatePartsExistForModel(
    modelId: bigint,
    partIds: bigint[],
  ): Promise<boolean> {
    const count = await this.db.model_parts.count({
      where: {
        model_id: modelId,
        part_id: { in: partIds },
      },
    });
    return count === partIds.length;
  }
}
