import type { PaginationMeta } from '../../../common/interfaces/paginated-result.interface';

// ─── Filter / Input DTOs ──────────────────────────────────────────────────────

export interface SummaryFilterDto {
  order_id: string;
}

export interface OrdersReportFilterDto {
  status?: string;
  model_id?: string;
  line_id?: string;
  release_type?: string;
  page?: number;
  limit?: number;
}

export interface StageReportFilterDto {
  order_id?: string;
  stage_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface WipReportFilterDto {
  order_id?: string;
  line_id?: string;
  page?: number;
  limit?: number;
}

export interface ScrapReportFilterDto {
  order_id?: string;
  stage_id?: string;
  page?: number;
  limit?: number;
}

export interface QualityReportFilterDto {
  order_id?: string;
  model_id?: string;
  page?: number;
  limit?: number;
}

export interface PackingReportFilterDto {
  status?: string;
  page?: number;
  limit?: number;
}

export interface FGReportFilterDto {
  model_id?: string;
  customer_id?: string;
  warehouse_id?: string;
  page?: number;
  limit?: number;
}

export interface SupplementaryReportFilterDto {
  order_id?: string;
  status?: string;
  reason_type?: string;
  page?: number;
  limit?: number;
}

export interface HistoricalReportFilterDto {
  date_from?: string;
  date_to?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ─── Response item DTOs ───────────────────────────────────────────────────────

export interface OrderSummaryItemDto {
  order_id: string;
  order_number: string;
  status: string;
  model_id: string;
  line_id: string;
  release_type: string;
  target_dozens: number | null;
  created_at: Date;
  closed_at: Date | null;
}

export interface PackingSummaryDto {
  packing_order_id: string;
  status: string;
  target_dozens: number;
  assembled_dozens: number;
  verified_dozens: number | null;
  posted_at: Date | null;
}

export interface ProductionDashboardDto {
  total_orders: number;
  by_status: Array<{ status: string; count: number }>;
  active_orders: number;
  total_wip_dozens: number;
  total_fg_dozens: number;
  total_scrap_dozens: number;
  recent_orders: OrderSummaryItemDto[];
}

export interface ProductionSummaryDto {
  order: OrderSummaryItemDto;
  stage_stats: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
  };
  wip_dozens: number;
  quality_dozens: number;
  scrap_dozens: number;
  incomplete_dozens: number;
  return_dozens: number;
  supplementary_count: number;
  packing: PackingSummaryDto | null;
}

export interface ProductionKPIDto {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  completion_rate_pct: number;
  total_target_dozens: number;
  total_scrap_dozens: number;
  scrap_rate_pct: number;
  total_wip_dozens: number;
  total_fg_dozens: number;
  total_returned_dozens: number;
}

export interface OrderReportItemDto {
  order_id: string;
  order_number: string;
  status: string;
  model_id: string;
  line_id: string;
  release_type: string;
  target_dozens: number | null;
  created_at: Date;
  closed_at: Date | null;
}

export interface StageReportItemDto {
  log_id: string;
  order_id: string;
  stage_id: string;
  line_id: string;
  status: string;
  input_dozens: number | null;
  output_dozens: number | null;
  scrap_dozens: number;
  incomplete_dozens: number;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface WipReportItemDto {
  wip_id: string;
  order_id: string;
  line_id: string;
  part_id: string;
  dozens_in_wip: number;
  last_updated: Date;
}

export interface ScrapReportItemDto {
  scrap_id: string;
  order_id: string;
  stage_id: string;
  scrap_type: string;
  dozens_scrapped: number;
  recorded_at: Date;
}

export interface ScrapReportResultDto {
  items: ScrapReportItemDto[];
  total_dozens_scrapped: number;
  meta: PaginationMeta;
}

export interface QualityReportItemDto {
  box_id: string;
  order_id: string;
  model_id: string;
  color_id: string;
  size_id: string;
  dozens_available: number;
  last_updated: Date;
}

export interface PackingReportItemDto {
  packing_order_id: string;
  packing_order_no: string;
  production_order_id: string;
  status: string;
  target_dozens: number;
  assembled_dozens: number;
  verified_dozens: number | null;
  created_at: Date;
  posted_at: Date | null;
}

export interface FGReportItemDto {
  fg_bag_id: string;
  model_id: string;
  customer_id: string;
  warehouse_id: string;
  dozens_qty: number;
  created_at: Date;
}

export interface FGReportResultDto {
  items: FGReportItemDto[];
  total_bags: number;
  total_dozens: number;
  meta: PaginationMeta;
}

export interface SupplementaryReportItemDto {
  request_id: string;
  request_number: string;
  order_id: string;
  reason_type: string;
  status: string;
  lines_count: number;
  requested_at: Date;
  transferred_at: Date | null;
}

export interface HistoricalReportItemDto {
  order_id: string;
  order_number: string;
  status: string;
  model_id: string;
  line_id: string;
  release_type: string;
  target_dozens: number | null;
  created_at: Date;
  closed_at: Date | null;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapOrderSummaryItem(o: {
  order_id: bigint;
  order_number: string;
  status: string;
  model_id: bigint;
  line_id: bigint;
  release_type: string;
  target_dozens?: { toString(): string } | null;
  created_at: Date;
  closed_at?: Date | null;
}): OrderSummaryItemDto {
  return {
    order_id: o.order_id.toString(),
    order_number: o.order_number,
    status: o.status,
    model_id: o.model_id.toString(),
    line_id: o.line_id.toString(),
    release_type: o.release_type,
    target_dozens: o.target_dozens != null ? Number(o.target_dozens) : null,
    created_at: o.created_at,
    closed_at: o.closed_at ?? null,
  };
}

export function mapStageReportItem(l: {
  log_id: bigint;
  order_id: bigint;
  stage_id: bigint;
  line_id: bigint;
  status: string;
  input_dozens?: { toString(): string } | null;
  output_dozens?: { toString(): string } | null;
  scrap_dozens: { toString(): string };
  incomplete_dozens: { toString(): string };
  started_at?: Date | null;
  completed_at?: Date | null;
}): StageReportItemDto {
  return {
    log_id: l.log_id.toString(),
    order_id: l.order_id.toString(),
    stage_id: l.stage_id.toString(),
    line_id: l.line_id.toString(),
    status: l.status,
    input_dozens: l.input_dozens != null ? Number(l.input_dozens) : null,
    output_dozens: l.output_dozens != null ? Number(l.output_dozens) : null,
    scrap_dozens: Number(l.scrap_dozens),
    incomplete_dozens: Number(l.incomplete_dozens),
    started_at: l.started_at ?? null,
    completed_at: l.completed_at ?? null,
  };
}

export function mapWipReportItem(w: {
  wip_id: bigint;
  order_id: bigint;
  line_id: bigint;
  part_id: bigint;
  dozens_in_wip: { toString(): string };
  last_updated: Date;
}): WipReportItemDto {
  return {
    wip_id: w.wip_id.toString(),
    order_id: w.order_id.toString(),
    line_id: w.line_id.toString(),
    part_id: w.part_id.toString(),
    dozens_in_wip: Number(w.dozens_in_wip),
    last_updated: w.last_updated,
  };
}

export function mapScrapReportItem(s: {
  scrap_id: bigint;
  order_id: bigint;
  stage_id: bigint;
  scrap_type: string;
  dozens_scrapped: { toString(): string };
  recorded_at: Date;
}): ScrapReportItemDto {
  return {
    scrap_id: s.scrap_id.toString(),
    order_id: s.order_id.toString(),
    stage_id: s.stage_id.toString(),
    scrap_type: s.scrap_type,
    dozens_scrapped: Number(s.dozens_scrapped),
    recorded_at: s.recorded_at,
  };
}

export function mapQualityReportItem(b: {
  box_id: bigint;
  order_id: bigint;
  model_id: bigint;
  color_id: bigint;
  size_id: bigint;
  dozens_available: { toString(): string };
  last_updated: Date;
}): QualityReportItemDto {
  return {
    box_id: b.box_id.toString(),
    order_id: b.order_id.toString(),
    model_id: b.model_id.toString(),
    color_id: b.color_id.toString(),
    size_id: b.size_id.toString(),
    dozens_available: Number(b.dozens_available),
    last_updated: b.last_updated,
  };
}

export function mapPackingReportItem(p: {
  packing_order_id: bigint;
  packing_order_no: string;
  production_order_id: bigint;
  status: string;
  target_dozens: { toString(): string };
  assembled_dozens: { toString(): string };
  verified_dozens?: { toString(): string } | null;
  created_at: Date;
  posted_at?: Date | null;
}): PackingReportItemDto {
  return {
    packing_order_id: p.packing_order_id.toString(),
    packing_order_no: p.packing_order_no,
    production_order_id: p.production_order_id.toString(),
    status: p.status,
    target_dozens: Number(p.target_dozens),
    assembled_dozens: Number(p.assembled_dozens),
    verified_dozens:
      p.verified_dozens != null ? Number(p.verified_dozens) : null,
    created_at: p.created_at,
    posted_at: p.posted_at ?? null,
  };
}

export function mapFGReportItem(f: {
  fg_bag_id: bigint;
  model_id: bigint;
  customer_id: bigint;
  warehouse_id: bigint;
  dozens_qty: { toString(): string };
  created_at: Date;
}): FGReportItemDto {
  return {
    fg_bag_id: f.fg_bag_id.toString(),
    model_id: f.model_id.toString(),
    customer_id: f.customer_id.toString(),
    warehouse_id: f.warehouse_id.toString(),
    dozens_qty: Number(f.dozens_qty),
    created_at: f.created_at,
  };
}

export function mapSupplementaryReportItem(r: {
  request_id: bigint;
  request_number: string;
  order_id: bigint;
  reason_type: string;
  status: string;
  requested_at: Date;
  transferred_at?: Date | null;
  _count: { supplementary_request_lines: number };
}): SupplementaryReportItemDto {
  return {
    request_id: r.request_id.toString(),
    request_number: r.request_number,
    order_id: r.order_id.toString(),
    reason_type: r.reason_type,
    status: r.status,
    lines_count: r._count.supplementary_request_lines,
    requested_at: r.requested_at,
    transferred_at: r.transferred_at ?? null,
  };
}
