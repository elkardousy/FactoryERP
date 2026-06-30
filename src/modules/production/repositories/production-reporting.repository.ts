import { Injectable } from '@nestjs/common';
import {
  OrderStatusEnum,
  StageStatusEnum,
  ReleaseTypeEnum,
  PackingOrderStatusEnum,
  SupplementaryStatusEnum,
  SupplementaryReasonEnum,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  type PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const DASHBOARD_RECENT_LIMIT = 10;

// ─── Raw record shapes (partial selects) ─────────────────────────────────────

export type OrderRaw = {
  order_id: bigint;
  order_number: string;
  status: string;
  model_id: bigint;
  line_id: bigint;
  release_type: string;
  target_dozens: { toString(): string } | null;
  created_at: Date;
  closed_at: Date | null;
};

export type StageLogRaw = {
  log_id: bigint;
  order_id: bigint;
  stage_id: bigint;
  line_id: bigint;
  status: string;
  input_dozens: { toString(): string } | null;
  output_dozens: { toString(): string } | null;
  scrap_dozens: { toString(): string };
  incomplete_dozens: { toString(): string };
  started_at: Date | null;
  completed_at: Date | null;
};

export type WipRaw = {
  wip_id: bigint;
  order_id: bigint;
  line_id: bigint;
  part_id: bigint;
  dozens_in_wip: { toString(): string };
  last_updated: Date;
};

export type ScrapRaw = {
  scrap_id: bigint;
  order_id: bigint;
  stage_id: bigint;
  scrap_type: string;
  dozens_scrapped: { toString(): string };
  recorded_at: Date;
};

export type QualityBoxRaw = {
  box_id: bigint;
  order_id: bigint;
  model_id: bigint;
  color_id: bigint;
  size_id: bigint;
  dozens_available: { toString(): string };
  last_updated: Date;
};

export type PackingRaw = {
  packing_order_id: bigint;
  packing_order_no: string;
  production_order_id: bigint;
  status: string;
  target_dozens: { toString(): string };
  assembled_dozens: { toString(): string };
  verified_dozens: { toString(): string } | null;
  created_at: Date;
  posted_at: Date | null;
};

export type FGRaw = {
  fg_bag_id: bigint;
  model_id: bigint;
  customer_id: bigint;
  warehouse_id: bigint;
  dozens_qty: { toString(): string };
  created_at: Date;
};

export type SupplementaryRaw = {
  request_id: bigint;
  request_number: string;
  order_id: bigint;
  reason_type: string;
  status: string;
  requested_at: Date;
  transferred_at: Date | null;
  _count: { supplementary_request_lines: number };
};

// ─── Dashboard aggregate shape ────────────────────────────────────────────────

export interface DashboardRawData {
  ordersByStatus: Array<{
    status: OrderStatusEnum;
    _count: { order_id: number };
  }>;
  totalWipDozens: number;
  totalFGDozens: number;
  totalScrapDozens: number;
  recentOrders: OrderRaw[];
}

// ─── Summary aggregate shape ──────────────────────────────────────────────────

export interface OrderSummaryRaw {
  order: OrderRaw | null;
  stageCounts: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
  };
  wipDozens: number;
  qualityDozens: number;
  scrapDozens: number;
  incompleteDozens: number;
  returnDozens: number;
  supplementaryCount: number;
  packing: PackingRaw | null;
}

// ─── KPI aggregate shape ──────────────────────────────────────────────────────

export interface KPIRawData {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalTargetDozens: number;
  totalScrapDozens: number;
  totalWipDozens: number;
  totalFGDozens: number;
  totalReturnedDozens: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class ProductionReportingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboardData(): Promise<DashboardRawData> {
    const [ordersByStatus, wipAgg, fgAgg, scrapAgg, recentOrders] =
      await Promise.all([
        this.db.production_orders.groupBy({
          by: ['status'],
          _count: { order_id: true },
        }),
        this.db.wip_inventory.aggregate({ _sum: { dozens_in_wip: true } }),
        this.db.finished_goods_bags.aggregate({ _sum: { dozens_qty: true } }),
        this.db.production_stage_logs.aggregate({
          _sum: { scrap_dozens: true },
        }),
        this.db.production_orders.findMany({
          select: {
            order_id: true,
            order_number: true,
            status: true,
            model_id: true,
            line_id: true,
            release_type: true,
            target_dozens: true,
            created_at: true,
            closed_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: DASHBOARD_RECENT_LIMIT,
        }),
      ]);

    return {
      ordersByStatus,
      totalWipDozens: Number(wipAgg._sum.dozens_in_wip ?? 0),
      totalFGDozens: Number(fgAgg._sum.dozens_qty ?? 0),
      totalScrapDozens: Number(scrapAgg._sum.scrap_dozens ?? 0),
      recentOrders: recentOrders,
    };
  }

  // ── Order Summary (single order) ──────────────────────────────────────────

  async getOrderSummaryData(orderId: bigint): Promise<OrderSummaryRaw> {
    const [
      order,
      stageLogs,
      wipAgg,
      qualityAgg,
      stageAgg,
      returnAgg,
      supplementaryCount,
      packing,
    ] = await Promise.all([
      this.db.production_orders.findUnique({
        where: { order_id: orderId },
        select: {
          order_id: true,
          order_number: true,
          status: true,
          model_id: true,
          line_id: true,
          release_type: true,
          target_dozens: true,
          created_at: true,
          closed_at: true,
        },
      }),
      this.db.production_stage_logs.findMany({
        where: { order_id: orderId },
        select: { status: true },
      }),
      this.db.wip_inventory.aggregate({
        where: { order_id: orderId },
        _sum: { dozens_in_wip: true },
      }),
      this.db.quality_output_boxes.aggregate({
        where: { order_id: orderId },
        _sum: { dozens_available: true },
      }),
      this.db.production_stage_logs.aggregate({
        where: { order_id: orderId },
        _sum: { scrap_dozens: true, incomplete_dozens: true },
      }),
      this.db.return_transactions.aggregate({
        where: { order_id: orderId },
        _sum: { dozens_returned: true },
      }),
      this.db.supplementary_material_requests.count({
        where: { order_id: orderId },
      }),
      this.db.packing_orders.findUnique({
        where: { production_order_id: orderId },
        select: {
          packing_order_id: true,
          packing_order_no: true,
          production_order_id: true,
          status: true,
          target_dozens: true,
          assembled_dozens: true,
          verified_dozens: true,
          created_at: true,
          posted_at: true,
        },
      }),
    ]);

    const total = stageLogs.length;
    const completed = stageLogs.filter(
      (l) => l.status === StageStatusEnum.COMPLETE,
    ).length;
    const inProgress = stageLogs.filter(
      (l) => l.status === StageStatusEnum.IN_PROGRESS,
    ).length;
    const pending = total - completed - inProgress;

    return {
      order: order as OrderRaw | null,
      stageCounts: { total, completed, in_progress: inProgress, pending },
      wipDozens: Number(wipAgg._sum.dozens_in_wip ?? 0),
      qualityDozens: Number(qualityAgg._sum.dozens_available ?? 0),
      scrapDozens: Number(stageAgg._sum.scrap_dozens ?? 0),
      incompleteDozens: Number(stageAgg._sum.incomplete_dozens ?? 0),
      returnDozens: Number(returnAgg._sum.dozens_returned ?? 0),
      supplementaryCount,
      packing: packing as PackingRaw | null,
    };
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────

  async getKPIData(): Promise<KPIRawData> {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      targetAgg,
      scrapAgg,
      wipAgg,
      fgAgg,
      returnAgg,
    ] = await Promise.all([
      this.db.production_orders.count(),
      this.db.production_orders.count({
        where: { status: OrderStatusEnum.IN_PRODUCTION },
      }),
      this.db.production_orders.count({
        where: {
          status: {
            in: [OrderStatusEnum.PRODUCTION_COMPLETE, OrderStatusEnum.CLOSED],
          },
        },
      }),
      this.db.production_orders.aggregate({ _sum: { target_dozens: true } }),
      this.db.production_stage_logs.aggregate({ _sum: { scrap_dozens: true } }),
      this.db.wip_inventory.aggregate({ _sum: { dozens_in_wip: true } }),
      this.db.finished_goods_bags.aggregate({ _sum: { dozens_qty: true } }),
      this.db.return_transactions.aggregate({
        _sum: { dozens_returned: true },
      }),
    ]);

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalTargetDozens: Number(targetAgg._sum.target_dozens ?? 0),
      totalScrapDozens: Number(scrapAgg._sum.scrap_dozens ?? 0),
      totalWipDozens: Number(wipAgg._sum.dozens_in_wip ?? 0),
      totalFGDozens: Number(fgAgg._sum.dozens_qty ?? 0),
      totalReturnedDozens: Number(returnAgg._sum.dozens_returned ?? 0),
    };
  }

  // ── Orders Report ─────────────────────────────────────────────────────────

  async findOrdersReport(
    filter: {
      status?: OrderStatusEnum;
      model_id?: bigint;
      line_id?: bigint;
      release_type?: string;
    },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<OrderRaw>> {
    const where = {
      ...(filter.status && { status: filter.status }),
      ...(filter.model_id && { model_id: filter.model_id }),
      ...(filter.line_id && { line_id: filter.line_id }),
      ...(filter.release_type && {
        release_type: filter.release_type as ReleaseTypeEnum,
      }),
    };
    const select = {
      order_id: true,
      order_number: true,
      status: true,
      model_id: true,
      line_id: true,
      release_type: true,
      target_dozens: true,
      created_at: true,
      closed_at: true,
    };
    const [items, total] = await Promise.all([
      this.db.production_orders.findMany({
        where,
        select,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.production_orders.count({ where }),
    ]);
    return {
      items: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── Stage Performance Report ──────────────────────────────────────────────

  async findStageReport(
    filter: { order_id?: bigint; stage_id?: bigint; status?: StageStatusEnum },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<StageLogRaw>> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.stage_id && { stage_id: filter.stage_id }),
      ...(filter.status && { status: filter.status }),
    };
    const select = {
      log_id: true,
      order_id: true,
      stage_id: true,
      line_id: true,
      status: true,
      input_dozens: true,
      output_dozens: true,
      scrap_dozens: true,
      incomplete_dozens: true,
      started_at: true,
      completed_at: true,
    };
    const [items, total] = await Promise.all([
      this.db.production_stage_logs.findMany({
        where,
        select,
        orderBy: [{ order_id: 'desc' }, { log_id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.production_stage_logs.count({ where }),
    ]);
    return {
      items: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── WIP Report ────────────────────────────────────────────────────────────

  async findWipReport(
    filter: { order_id?: bigint; line_id?: bigint },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<WipRaw>> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.line_id && { line_id: filter.line_id }),
    };
    const select = {
      wip_id: true,
      order_id: true,
      line_id: true,
      part_id: true,
      dozens_in_wip: true,
      last_updated: true,
    };
    const [items, total] = await Promise.all([
      this.db.wip_inventory.findMany({
        where,
        select,
        orderBy: [{ order_id: 'desc' }, { part_id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.wip_inventory.count({ where }),
    ]);
    return {
      items: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── Scrap Report ──────────────────────────────────────────────────────────

  async findScrapReport(
    filter: { order_id?: bigint; stage_id?: bigint },
    page: number,
    limit: number,
  ): Promise<{
    items: ScrapRaw[];
    total_dozens: number;
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.stage_id && { stage_id: filter.stage_id }),
    };
    const select = {
      scrap_id: true,
      order_id: true,
      stage_id: true,
      scrap_type: true,
      dozens_scrapped: true,
      recorded_at: true,
    };
    const [items, total, totalAgg] = await Promise.all([
      this.db.scrap_records.findMany({
        where,
        select,
        orderBy: { recorded_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.scrap_records.count({ where }),
      this.db.scrap_records.aggregate({
        where,
        _sum: { dozens_scrapped: true },
      }),
    ]);
    return {
      items: items,
      total_dozens: Number(totalAgg._sum.dozens_scrapped ?? 0),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── Quality Report ────────────────────────────────────────────────────────

  async findQualityReport(
    filter: { order_id?: bigint; model_id?: bigint },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<QualityBoxRaw>> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.model_id && { model_id: filter.model_id }),
    };
    const select = {
      box_id: true,
      order_id: true,
      model_id: true,
      color_id: true,
      size_id: true,
      dozens_available: true,
      last_updated: true,
    };
    const [items, total] = await Promise.all([
      this.db.quality_output_boxes.findMany({
        where,
        select,
        orderBy: [{ order_id: 'desc' }, { box_id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.quality_output_boxes.count({ where }),
    ]);
    return {
      items: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── Packing Report ────────────────────────────────────────────────────────

  async findPackingReport(
    filter: { status?: string },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<PackingRaw>> {
    const where = {
      ...(filter.status && { status: filter.status as PackingOrderStatusEnum }),
    };
    const select = {
      packing_order_id: true,
      packing_order_no: true,
      production_order_id: true,
      status: true,
      target_dozens: true,
      assembled_dozens: true,
      verified_dozens: true,
      created_at: true,
      posted_at: true,
    };
    const [items, total] = await Promise.all([
      this.db.packing_orders.findMany({
        where,
        select,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.packing_orders.count({ where }),
    ]);
    return {
      items: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── FG Report ─────────────────────────────────────────────────────────────

  async findFGReport(
    filter: { model_id?: bigint; customer_id?: bigint; warehouse_id?: bigint },
    page: number,
    limit: number,
  ): Promise<{
    items: FGRaw[];
    total_bags: number;
    total_dozens: number;
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const where = {
      ...(filter.model_id && { model_id: filter.model_id }),
      ...(filter.customer_id && { customer_id: filter.customer_id }),
      ...(filter.warehouse_id && { warehouse_id: filter.warehouse_id }),
    };
    const select = {
      fg_bag_id: true,
      model_id: true,
      customer_id: true,
      warehouse_id: true,
      dozens_qty: true,
      created_at: true,
    };
    const [items, total, agg] = await Promise.all([
      this.db.finished_goods_bags.findMany({
        where,
        select,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.finished_goods_bags.count({ where }),
      this.db.finished_goods_bags.aggregate({
        where,
        _sum: { dozens_qty: true },
      }),
    ]);
    return {
      items: items,
      total_bags: total,
      total_dozens: Number(agg._sum.dozens_qty ?? 0),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── Supplementary Report ──────────────────────────────────────────────────

  async findSupplementaryReport(
    filter: { order_id?: bigint; status?: string; reason_type?: string },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<SupplementaryRaw>> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.status && {
        status: filter.status as SupplementaryStatusEnum,
      }),
      ...(filter.reason_type && {
        reason_type: filter.reason_type as SupplementaryReasonEnum,
      }),
    };
    const select = {
      request_id: true,
      request_number: true,
      order_id: true,
      reason_type: true,
      status: true,
      requested_at: true,
      transferred_at: true,
      _count: { select: { supplementary_request_lines: true } },
    };
    const [items, total] = await Promise.all([
      this.db.supplementary_material_requests.findMany({
        where,
        select,
        orderBy: { requested_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.supplementary_material_requests.count({ where }),
    ]);
    return {
      items: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // ── Historical Report ─────────────────────────────────────────────────────

  async findHistoricalReport(
    filter: { date_from?: Date; date_to?: Date; status?: OrderStatusEnum },
    page: number,
    limit: number,
  ): Promise<PaginatedResult<OrderRaw>> {
    const where = {
      ...(filter.status && { status: filter.status }),
      ...((filter.date_from || filter.date_to) && {
        created_at: {
          ...(filter.date_from && { gte: filter.date_from }),
          ...(filter.date_to && { lte: filter.date_to }),
        },
      }),
    };
    const select = {
      order_id: true,
      order_number: true,
      status: true,
      model_id: true,
      line_id: true,
      release_type: true,
      target_dozens: true,
      created_at: true,
      closed_at: true,
    };
    const [items, total] = await Promise.all([
      this.db.production_orders.findMany({
        where,
        select,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.production_orders.count({ where }),
    ]);
    return {
      items: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}

export { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE };
