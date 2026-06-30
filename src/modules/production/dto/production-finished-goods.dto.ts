import type { finished_goods_bags } from '@prisma/client';

// ─── Domain types ─────────────────────────────────────────────────────────────

export type FGBagRecord = finished_goods_bags;

// ─── Command DTOs ─────────────────────────────────────────────────────────────

export interface CreateFinishedGoodsDto {
  packing_order_id: string;
  customer_id: string;
  warehouse_id: string;
  dozens_qty?: number;
}

// ─── Query filter DTOs ────────────────────────────────────────────────────────

export interface FinishedGoodsFilterDto {
  model_id?: string;
  customer_id?: string;
  warehouse_id?: string;
}

export interface FinishedGoodsHistoryFilterDto {
  page?: number;
  limit?: number;
}

export interface FinishedGoodsSummaryFilterDto {
  model_id: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface FinishedGoodsBagResponseDto {
  fg_bag_id: string;
  model_id: string;
  customer_id: string;
  warehouse_id: string;
  dozens_qty: number;
  cmo_line_id: string | null;
  session_id: string | null;
  created_at: Date;
}

export interface PaginatedFinishedGoodsDto {
  items: FinishedGoodsBagResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FinishedGoodsSummaryDto {
  model_id: string;
  total_bags: number;
  total_dozens: number;
  bags: FinishedGoodsBagResponseDto[];
}

export interface FinishedGoodsDashboardDto {
  total_bags: number;
  total_dozens: number;
  by_model: Array<{
    model_id: string;
    bag_count: number;
    total_dozens: number;
  }>;
  by_customer: Array<{
    customer_id: string;
    bag_count: number;
    total_dozens: number;
  }>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapFGBag(bag: FGBagRecord): FinishedGoodsBagResponseDto {
  return {
    fg_bag_id: bag.fg_bag_id.toString(),
    model_id: bag.model_id.toString(),
    customer_id: bag.customer_id.toString(),
    warehouse_id: bag.warehouse_id.toString(),
    dozens_qty: Number(bag.dozens_qty),
    cmo_line_id: bag.cmo_line_id ? bag.cmo_line_id.toString() : null,
    session_id: bag.session_id ? bag.session_id.toString() : null,
    created_at: bag.created_at,
  };
}
