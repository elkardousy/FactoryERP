import { Injectable } from '@nestjs/common';
import { PackingOrderStatusEnum } from '@prisma/client';
import type { packing_orders, production_orders } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type {
  FGBagRecord,
  FinishedGoodsDashboardDto,
} from '../dto/production-finished-goods.dto';

// ─── Compound types ───────────────────────────────────────────────────────────

export type PackingOrderWithProduction = packing_orders & {
  production_orders: production_orders;
};

// ─── Param interfaces ─────────────────────────────────────────────────────────

export interface CreateFGBagParams {
  modelId: bigint;
  customerId: bigint;
  warehouseId: bigint;
  dozensQty: number;
  cmoLineId?: bigint;
  createdAt: Date;
}

export interface FGBagFilter {
  model_id?: bigint;
  customer_id?: bigint;
  warehouse_id?: bigint;
}

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class ProductionFinishedGoodsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // ── Packing order lookup (for CreateFinishedGoods validation) ─────────────

  async findPackingOrderWithProduction(
    packingOrderId: bigint,
  ): Promise<PackingOrderWithProduction | null> {
    return this.db.packing_orders.findUnique({
      where: {
        packing_order_id: packingOrderId,
        status: PackingOrderStatusEnum.POSTED,
      },
      include: { production_orders: true },
    });
  }

  async findPackingOrderStatusById(
    packingOrderId: bigint,
  ): Promise<{ packing_order_id: bigint; status: string } | null> {
    return this.db.packing_orders.findUnique({
      where: { packing_order_id: packingOrderId },
      select: { packing_order_id: true, status: true },
    });
  }

  // ── Foreign key existence checks ──────────────────────────────────────────

  async findCustomerById(
    customerId: bigint,
  ): Promise<{ customer_id: bigint } | null> {
    return this.db.customers.findUnique({
      where: { customer_id: customerId },
      select: { customer_id: true },
    });
  }

  async findWarehouseById(
    warehouseId: bigint,
  ): Promise<{ warehouse_id: bigint } | null> {
    return this.db.warehouses.findUnique({
      where: { warehouse_id: warehouseId },
      select: { warehouse_id: true },
    });
  }

  async findCMOCustomerId(cmoLineId: bigint): Promise<bigint | null> {
    const line = await this.db.customer_manufacturing_order_lines.findUnique({
      where: { cmo_line_id: cmoLineId },
      include: {
        customer_manufacturing_orders: { select: { customer_id: true } },
      },
    });
    return line?.customer_manufacturing_orders.customer_id ?? null;
  }

  // ── Write — CreateFGBag ───────────────────────────────────────────────────

  async createFGBag(params: CreateFGBagParams): Promise<FGBagRecord> {
    return this.db.finished_goods_bags.create({
      data: {
        model_id: params.modelId,
        customer_id: params.customerId,
        warehouse_id: params.warehouseId,
        dozens_qty: params.dozensQty,
        cmo_line_id: params.cmoLineId ?? undefined,
        created_at: params.createdAt,
      },
    });
  }

  // ── Read — single ─────────────────────────────────────────────────────────

  async findFGBagById(fgBagId: bigint): Promise<FGBagRecord | null> {
    return this.db.finished_goods_bags.findUnique({
      where: { fg_bag_id: fgBagId },
    });
  }

  // ── Read — list with optional filters ────────────────────────────────────

  async findFGBags(filter: FGBagFilter): Promise<FGBagRecord[]> {
    return this.db.finished_goods_bags.findMany({
      where: {
        ...(filter.model_id !== undefined && { model_id: filter.model_id }),
        ...(filter.customer_id !== undefined && {
          customer_id: filter.customer_id,
        }),
        ...(filter.warehouse_id !== undefined && {
          warehouse_id: filter.warehouse_id,
        }),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── Read — paginated ──────────────────────────────────────────────────────

  async findFGBagsPage(
    page: number,
    limit: number,
  ): Promise<{ items: FGBagRecord[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.finished_goods_bags.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.db.finished_goods_bags.count(),
    ]);
    return { items, total };
  }

  // ── Read — by model (for summary) ────────────────────────────────────────

  async findFGBagsByModelId(modelId: bigint): Promise<FGBagRecord[]> {
    return this.db.finished_goods_bags.findMany({
      where: { model_id: modelId },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── Read — dashboard aggregates ───────────────────────────────────────────

  async getDashboardAggregates(): Promise<
    Omit<FinishedGoodsDashboardDto, never>
  > {
    const [totals, byModelRaw, byCustomerRaw] = await Promise.all([
      this.db.finished_goods_bags.aggregate({
        _count: { fg_bag_id: true },
        _sum: { dozens_qty: true },
      }),
      this.db.finished_goods_bags.groupBy({
        by: ['model_id'],
        _count: { fg_bag_id: true },
        _sum: { dozens_qty: true },
        orderBy: { _sum: { dozens_qty: 'desc' } },
      }),
      this.db.finished_goods_bags.groupBy({
        by: ['customer_id'],
        _count: { fg_bag_id: true },
        _sum: { dozens_qty: true },
        orderBy: { _sum: { dozens_qty: 'desc' } },
      }),
    ]);

    return {
      total_bags: totals._count.fg_bag_id,
      total_dozens: Number(totals._sum.dozens_qty ?? 0),
      by_model: byModelRaw.map((r) => ({
        model_id: r.model_id.toString(),
        bag_count: r._count.fg_bag_id,
        total_dozens: Number(r._sum.dozens_qty ?? 0),
      })),
      by_customer: byCustomerRaw.map((r) => ({
        customer_id: r.customer_id.toString(),
        bag_count: r._count.fg_bag_id,
        total_dozens: Number(r._sum.dozens_qty ?? 0),
      })),
    };
  }
}
