import type {
  supplementary_material_requests,
  supplementary_request_lines,
  supplementary_request_negligence,
  SupplementaryReasonEnum,
  SupplementaryStatusEnum,
  RootCauseCategoryEnum,
  AccountabilityClosureEnum,
} from '@prisma/client';

// ─── Compound types ───────────────────────────────────────────────────────────

export type SupplementaryWithRelations = supplementary_material_requests & {
  supplementary_request_lines: supplementary_request_lines[];
  supplementary_request_negligence: supplementary_request_negligence[];
};

export type SupplementaryForTransfer = supplementary_material_requests & {
  supplementary_request_lines: supplementary_request_lines[];
  production_orders: { model_id: bigint };
};

// ─── Command DTOs ─────────────────────────────────────────────────────────────

export interface CreateNegligenceDto {
  responsible_employee_id: string;
  negligence_type: string;
  stage_id: string;
  incident_description: string;
  warning_issued?: boolean;
  warning_reference?: string;
  root_cause_category?: string;
  corrective_action?: string;
  preventive_action?: string;
}

export interface CreateSupplementaryLineDto {
  order_part_id: string;
  part_id: string;
  source_warehouse_id: string;
  requested_dozens: number;
  line_notes?: string;
}

export interface CreateSupplementaryRequestDto {
  order_id: string;
  reason_type: string;
  justification: string;
  notes?: string;
  lines: CreateSupplementaryLineDto[];
  negligence?: CreateNegligenceDto;
}

export interface RejectSupplementaryRequestDto {
  rejection_notes?: string;
}

export interface CancelSupplementaryRequestDto {
  cancellation_notes?: string;
}

// ─── Query filter DTOs ────────────────────────────────────────────────────────

export interface SupplementaryFilterDto {
  order_id?: string;
  status?: string;
  reason_type?: string;
}

export interface SupplementaryHistoryFilterDto {
  page?: number;
  limit?: number;
}

export interface SupplementarySummaryFilterDto {
  order_id: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface SupplementaryLineResponseDto {
  line_id: string;
  request_id: string;
  order_part_id: string;
  part_id: string;
  source_warehouse_id: string;
  requested_dozens: number;
  approved_dozens: number | null;
  transferred_dozens: number | null;
  line_notes: string | null;
}

export interface NegligenceResponseDto {
  negligence_id: string;
  request_id: string;
  responsible_employee_id: string;
  negligence_type: string;
  stage_id: string;
  incident_description: string;
  warning_issued: boolean;
  warning_reference: string | null;
  reported_by: string;
  reported_at: Date;
  root_cause_category: RootCauseCategoryEnum | null;
  corrective_action: string | null;
  preventive_action: string | null;
  closure_status: AccountabilityClosureEnum;
  closed_by: string | null;
  closed_at: Date | null;
}

export interface SupplementaryRequestResponseDto {
  request_id: string;
  request_number: string;
  order_id: string;
  reason_type: SupplementaryReasonEnum;
  status: SupplementaryStatusEnum;
  justification: string;
  requested_by: string;
  requested_at: Date;
  transferred_by: string | null;
  transferred_at: Date | null;
  notes: string | null;
  lines: SupplementaryLineResponseDto[];
  negligence: NegligenceResponseDto | null;
}

export interface SupplementarySummaryDto {
  order_id: string;
  total_requests: number;
  pending: number;
  approved: number;
  transferred: number;
  rejected: number;
  cancelled: number;
  requests: SupplementaryRequestResponseDto[];
}

export interface SupplementaryDashboardDto {
  total_requests: number;
  by_status: Array<{ status: string; count: number }>;
  by_reason: Array<{ reason_type: string; count: number }>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapLine(
  line: supplementary_request_lines,
): SupplementaryLineResponseDto {
  return {
    line_id: line.line_id.toString(),
    request_id: line.request_id.toString(),
    order_part_id: line.order_part_id.toString(),
    part_id: line.part_id.toString(),
    source_warehouse_id: line.source_warehouse_id.toString(),
    requested_dozens: Number(line.requested_dozens),
    approved_dozens:
      line.approved_dozens !== null ? Number(line.approved_dozens) : null,
    transferred_dozens:
      line.transferred_dozens !== null ? Number(line.transferred_dozens) : null,
    line_notes: line.line_notes ?? null,
  };
}

function mapNegligence(
  neg: supplementary_request_negligence,
): NegligenceResponseDto {
  return {
    negligence_id: neg.negligence_id.toString(),
    request_id: neg.request_id.toString(),
    responsible_employee_id: neg.responsible_employee_id.toString(),
    negligence_type: neg.negligence_type,
    stage_id: neg.stage_id.toString(),
    incident_description: neg.incident_description,
    warning_issued: neg.warning_issued,
    warning_reference: neg.warning_reference ?? null,
    reported_by: neg.reported_by.toString(),
    reported_at: neg.reported_at,
    root_cause_category: neg.root_cause_category,
    corrective_action: neg.corrective_action ?? null,
    preventive_action: neg.preventive_action ?? null,
    closure_status: neg.closure_status,
    closed_by: neg.closed_by !== null ? neg.closed_by.toString() : null,
    closed_at: neg.closed_at ?? null,
  };
}

export function mapSupplementaryRequest(
  req: SupplementaryWithRelations,
): SupplementaryRequestResponseDto {
  const negligenceRecord = req.supplementary_request_negligence[0] ?? null;
  return {
    request_id: req.request_id.toString(),
    request_number: req.request_number,
    order_id: req.order_id.toString(),
    reason_type: req.reason_type,
    status: req.status,
    justification: req.justification,
    requested_by: req.requested_by.toString(),
    requested_at: req.requested_at,
    transferred_by:
      req.transferred_by !== null ? req.transferred_by.toString() : null,
    transferred_at: req.transferred_at ?? null,
    notes: req.notes ?? null,
    lines: req.supplementary_request_lines.map(mapLine),
    negligence: negligenceRecord ? mapNegligence(negligenceRecord) : null,
  };
}
