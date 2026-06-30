import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatusEnum, StageStatusEnum } from '@prisma/client';
import {
  ProductionReportingRepository,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../repositories/production-reporting.repository';
import {
  type SummaryFilterDto,
  type OrdersReportFilterDto,
  type StageReportFilterDto,
  type WipReportFilterDto,
  type ScrapReportFilterDto,
  type QualityReportFilterDto,
  type PackingReportFilterDto,
  type FGReportFilterDto,
  type SupplementaryReportFilterDto,
  type HistoricalReportFilterDto,
  type ProductionDashboardDto,
  type ProductionSummaryDto,
  type ProductionKPIDto,
  type ScrapReportResultDto,
  type FGReportResultDto,
  mapOrderSummaryItem,
  mapStageReportItem,
  mapWipReportItem,
  mapScrapReportItem,
  mapQualityReportItem,
  mapPackingReportItem,
  mapFGReportItem,
  mapSupplementaryReportItem,
} from '../dto/production-reporting.dto';
import type { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import type {
  OrderReportItemDto,
  StageReportItemDto,
  WipReportItemDto,
  QualityReportItemDto,
  PackingReportItemDto,
  SupplementaryReportItemDto,
  HistoricalReportItemDto,
} from '../dto/production-reporting.dto';

@Injectable()
export class ProductionReportingService {
  constructor(private readonly repo: ProductionReportingRepository) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(): Promise<ProductionDashboardDto> {
    const data = await this.repo.getDashboardData();

    const byStatus = data.ordersByStatus.map((row) => ({
      status: row.status,
      count: row._count.order_id,
    }));

    const activeCount =
      data.ordersByStatus.find(
        (r) => r.status === OrderStatusEnum.IN_PRODUCTION,
      )?._count.order_id ?? 0;

    return {
      total_orders: byStatus.reduce((sum, s) => sum + s.count, 0),
      by_status: byStatus,
      active_orders: activeCount,
      total_wip_dozens: data.totalWipDozens,
      total_fg_dozens: data.totalFGDozens,
      total_scrap_dozens: data.totalScrapDozens,
      recent_orders: data.recentOrders.map(mapOrderSummaryItem),
    };
  }

  // ── Summary (single order) ────────────────────────────────────────────────

  async getSummary(filter: SummaryFilterDto): Promise<ProductionSummaryDto> {
    const orderId = BigInt(filter.order_id);
    const data = await this.repo.getOrderSummaryData(orderId);

    if (!data.order) {
      throw new NotFoundException(
        `Production order ${filter.order_id} not found`,
      );
    }

    return {
      order: mapOrderSummaryItem(data.order),
      stage_stats: data.stageCounts,
      wip_dozens: data.wipDozens,
      quality_dozens: data.qualityDozens,
      scrap_dozens: data.scrapDozens,
      incomplete_dozens: data.incompleteDozens,
      return_dozens: data.returnDozens,
      supplementary_count: data.supplementaryCount,
      packing: data.packing
        ? {
            packing_order_id: data.packing.packing_order_id.toString(),
            status: data.packing.status,
            target_dozens: Number(data.packing.target_dozens),
            assembled_dozens: Number(data.packing.assembled_dozens),
            verified_dozens:
              data.packing.verified_dozens != null
                ? Number(data.packing.verified_dozens)
                : null,
            posted_at: data.packing.posted_at ?? null,
          }
        : null,
    };
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────

  async getKPIs(): Promise<ProductionKPIDto> {
    const d = await this.repo.getKPIData();

    const completionRate =
      d.totalOrders > 0
        ? Math.round((d.completedOrders / d.totalOrders) * 10000) / 100
        : 0;

    const scrapRate =
      d.totalTargetDozens > 0
        ? Math.round((d.totalScrapDozens / d.totalTargetDozens) * 10000) / 100
        : 0;

    return {
      total_orders: d.totalOrders,
      active_orders: d.activeOrders,
      completed_orders: d.completedOrders,
      completion_rate_pct: completionRate,
      total_target_dozens: d.totalTargetDozens,
      total_scrap_dozens: d.totalScrapDozens,
      scrap_rate_pct: scrapRate,
      total_wip_dozens: d.totalWipDozens,
      total_fg_dozens: d.totalFGDozens,
      total_returned_dozens: d.totalReturnedDozens,
    };
  }

  // ── Orders Report ─────────────────────────────────────────────────────────

  async getOrdersReport(
    filter: OrdersReportFilterDto,
  ): Promise<PaginatedResult<OrderReportItemDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findOrdersReport(
      {
        status: filter.status as OrderStatusEnum | undefined,
        model_id: filter.model_id ? BigInt(filter.model_id) : undefined,
        line_id: filter.line_id ? BigInt(filter.line_id) : undefined,
        release_type: filter.release_type,
      },
      page,
      limit,
    );

    return { items: result.items.map(mapOrderSummaryItem), meta: result.meta };
  }

  // ── Stage Performance Report ──────────────────────────────────────────────

  async getStageReport(
    filter: StageReportFilterDto,
  ): Promise<PaginatedResult<StageReportItemDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findStageReport(
      {
        order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
        stage_id: filter.stage_id ? BigInt(filter.stage_id) : undefined,
        status: filter.status as StageStatusEnum | undefined,
      },
      page,
      limit,
    );

    return { items: result.items.map(mapStageReportItem), meta: result.meta };
  }

  // ── WIP Report ────────────────────────────────────────────────────────────

  async getWipReport(
    filter: WipReportFilterDto,
  ): Promise<PaginatedResult<WipReportItemDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findWipReport(
      {
        order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
        line_id: filter.line_id ? BigInt(filter.line_id) : undefined,
      },
      page,
      limit,
    );

    return { items: result.items.map(mapWipReportItem), meta: result.meta };
  }

  // ── Scrap Report ──────────────────────────────────────────────────────────

  async getScrapReport(
    filter: ScrapReportFilterDto,
  ): Promise<ScrapReportResultDto> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findScrapReport(
      {
        order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
        stage_id: filter.stage_id ? BigInt(filter.stage_id) : undefined,
      },
      page,
      limit,
    );

    return {
      items: result.items.map(mapScrapReportItem),
      total_dozens_scrapped: result.total_dozens,
      meta: result.meta,
    };
  }

  // ── Quality Report ────────────────────────────────────────────────────────

  async getQualityReport(
    filter: QualityReportFilterDto,
  ): Promise<PaginatedResult<QualityReportItemDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findQualityReport(
      {
        order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
        model_id: filter.model_id ? BigInt(filter.model_id) : undefined,
      },
      page,
      limit,
    );

    return { items: result.items.map(mapQualityReportItem), meta: result.meta };
  }

  // ── Packing Report ────────────────────────────────────────────────────────

  async getPackingReport(
    filter: PackingReportFilterDto,
  ): Promise<PaginatedResult<PackingReportItemDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findPackingReport(
      { status: filter.status },
      page,
      limit,
    );

    return { items: result.items.map(mapPackingReportItem), meta: result.meta };
  }

  // ── FG Report ─────────────────────────────────────────────────────────────

  async getFGReport(filter: FGReportFilterDto): Promise<FGReportResultDto> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findFGReport(
      {
        model_id: filter.model_id ? BigInt(filter.model_id) : undefined,
        customer_id: filter.customer_id
          ? BigInt(filter.customer_id)
          : undefined,
        warehouse_id: filter.warehouse_id
          ? BigInt(filter.warehouse_id)
          : undefined,
      },
      page,
      limit,
    );

    return {
      items: result.items.map(mapFGReportItem),
      total_bags: result.total_bags,
      total_dozens: result.total_dozens,
      meta: result.meta,
    };
  }

  // ── Supplementary Report ──────────────────────────────────────────────────

  async getSupplementaryReport(
    filter: SupplementaryReportFilterDto,
  ): Promise<PaginatedResult<SupplementaryReportItemDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findSupplementaryReport(
      {
        order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
        status: filter.status,
        reason_type: filter.reason_type,
      },
      page,
      limit,
    );

    return {
      items: result.items.map(mapSupplementaryReportItem),
      meta: result.meta,
    };
  }

  // ── Historical Report ─────────────────────────────────────────────────────

  async getHistoricalReport(
    filter: HistoricalReportFilterDto,
  ): Promise<PaginatedResult<HistoricalReportItemDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, filter.limit ?? DEFAULT_PAGE_SIZE),
    );

    const result = await this.repo.findHistoricalReport(
      {
        date_from: filter.date_from ? new Date(filter.date_from) : undefined,
        date_to: filter.date_to ? new Date(filter.date_to) : undefined,
        status: filter.status as OrderStatusEnum | undefined,
      },
      page,
      limit,
    );

    return { items: result.items.map(mapOrderSummaryItem), meta: result.meta };
  }
}
