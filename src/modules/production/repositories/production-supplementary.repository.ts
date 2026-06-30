import { Injectable } from '@nestjs/common';
import {
  RootCauseCategoryEnum,
  SupplementaryReasonEnum,
  SupplementaryStatusEnum,
  TxnTypeEnum,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  type PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type {
  SupplementaryWithRelations,
  SupplementaryDashboardDto,
} from '../dto/production-supplementary.dto';

// ─── Param interfaces ─────────────────────────────────────────────────────────

export interface CreateNegligenceParams {
  responsibleEmployeeId: bigint;
  negligenceType: string;
  stageId: bigint;
  incidentDescription: string;
  warningIssued?: boolean;
  warningReference?: string;
  rootCauseCategory?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  reportedBy: bigint;
  reportedAt: Date;
}

export interface CreateSupplementaryLineParams {
  orderPartId: bigint;
  partId: bigint;
  sourceWarehouseId: bigint;
  requestedDozens: number;
  lineNotes?: string;
}

export interface CreateSupplementaryParams {
  requestNumber: string;
  orderId: bigint;
  reasonType: SupplementaryReasonEnum;
  justification: string;
  notes?: string;
  requestedBy: bigint;
  requestedAt: Date;
  lines: CreateSupplementaryLineParams[];
  negligence?: CreateNegligenceParams;
}

export interface SupplementaryFilter {
  order_id?: bigint;
  status?: SupplementaryStatusEnum;
  reason_type?: SupplementaryReasonEnum;
}

// ─── Include shapes ───────────────────────────────────────────────────────────

const SUP_INCLUDE = {
  supplementary_request_lines: true,
  supplementary_request_negligence: true,
} as const;

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class ProductionSupplementaryRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // ── Production order validation ───────────────────────────────────────────

  async findProductionOrderById(orderId: bigint): Promise<{
    order_id: bigint;
    status: string;
    model_id: bigint;
  } | null> {
    return this.db.production_orders.findUnique({
      where: { order_id: orderId },
      select: { order_id: true, status: true, model_id: true },
    });
  }

  // ── Write — Create ────────────────────────────────────────────────────────

  async createSupplementaryRequest(
    params: CreateSupplementaryParams,
  ): Promise<SupplementaryWithRelations> {
    return this.executeInTransaction(async (tx) => {
      const request = await tx.supplementary_material_requests.create({
        data: {
          request_number: params.requestNumber,
          order_id: params.orderId,
          reason_type: params.reasonType,
          status: SupplementaryStatusEnum.PENDING_APPROVAL,
          justification: params.justification,
          notes: params.notes ?? undefined,
          requested_by: params.requestedBy,
          requested_at: params.requestedAt,
        },
      });

      await Promise.all(
        params.lines.map((line) =>
          tx.supplementary_request_lines.create({
            data: {
              request_id: request.request_id,
              order_part_id: line.orderPartId,
              part_id: line.partId,
              source_warehouse_id: line.sourceWarehouseId,
              requested_dozens: line.requestedDozens,
              line_notes: line.lineNotes ?? undefined,
            },
          }),
        ),
      );

      if (params.negligence) {
        const neg = params.negligence;
        await tx.supplementary_request_negligence.create({
          data: {
            request_id: request.request_id,
            responsible_employee_id: neg.responsibleEmployeeId,
            negligence_type: neg.negligenceType,
            stage_id: neg.stageId,
            incident_description: neg.incidentDescription,
            warning_issued: neg.warningIssued ?? false,
            warning_reference: neg.warningReference ?? undefined,
            root_cause_category: neg.rootCauseCategory
              ? (neg.rootCauseCategory as RootCauseCategoryEnum)
              : undefined,
            corrective_action: neg.correctiveAction ?? undefined,
            preventive_action: neg.preventiveAction ?? undefined,
            reported_by: neg.reportedBy,
            reported_at: neg.reportedAt,
          },
        });
      }

      return tx.supplementary_material_requests.findUniqueOrThrow({
        where: { request_id: request.request_id },
        include: SUP_INCLUDE,
      });
    });
  }

  // ── Write — Approve ───────────────────────────────────────────────────────

  async approveSupplementaryRequest(
    requestId: bigint,
  ): Promise<SupplementaryWithRelations> {
    return this.executeInTransaction(async (tx) => {
      // ED-P10-006: approved_dozens = requested_dozens for all lines
      await tx.supplementary_request_lines.updateMany({
        where: { request_id: requestId },
        data: { approved_dozens: undefined }, // set via raw update below
      });

      // Use update per-line to copy requested_dozens → approved_dozens
      const lines = await tx.supplementary_request_lines.findMany({
        where: { request_id: requestId },
        select: { line_id: true, requested_dozens: true },
      });
      await Promise.all(
        lines.map((line) =>
          tx.supplementary_request_lines.update({
            where: { line_id: line.line_id },
            data: { approved_dozens: line.requested_dozens },
          }),
        ),
      );

      await tx.supplementary_material_requests.update({
        where: { request_id: requestId },
        data: { status: SupplementaryStatusEnum.APPROVED },
      });

      return tx.supplementary_material_requests.findUniqueOrThrow({
        where: { request_id: requestId },
        include: SUP_INCLUDE,
      });
    });
  }

  // ── Write — Reject ────────────────────────────────────────────────────────

  async rejectSupplementaryRequest(
    requestId: bigint,
  ): Promise<SupplementaryWithRelations> {
    return this.db.supplementary_material_requests.update({
      where: { request_id: requestId },
      data: { status: SupplementaryStatusEnum.REJECTED },
      include: SUP_INCLUDE,
    });
  }

  // ── Write — Cancel ────────────────────────────────────────────────────────

  async cancelSupplementaryRequest(
    requestId: bigint,
  ): Promise<SupplementaryWithRelations> {
    return this.db.supplementary_material_requests.update({
      where: { request_id: requestId },
      data: { status: SupplementaryStatusEnum.CANCELLED },
      include: SUP_INCLUDE,
    });
  }

  // ── Write — Transfer ──────────────────────────────────────────────────────

  async transferSupplementaryMaterial(
    requestId: bigint,
    transferredBy: bigint,
    now: Date,
  ): Promise<SupplementaryWithRelations> {
    return this.executeInTransaction(async (tx) => {
      const request =
        await tx.supplementary_material_requests.findUniqueOrThrow({
          where: { request_id: requestId },
          include: {
            supplementary_request_lines: true,
            production_orders: { select: { model_id: true } },
          },
        });

      const modelId = request.production_orders.model_id;
      const requestNumber = request.request_number;
      const orderId = request.order_id;

      // BR-Sup05: SUPPLEMENTARY_RELEASE per line (ED-P10-005)
      await Promise.all(
        request.supplementary_request_lines.map(async (line) => {
          const approvedDozens = Number(
            line.approved_dozens ?? line.requested_dozens,
          );
          const txnRef = `SUP-${requestId.toString()}-L${line.line_id.toString()}`;

          await tx.inventory_transactions.create({
            data: {
              txn_reference: txnRef,
              txn_type: TxnTypeEnum.SUPPLEMENTARY_RELEASE,
              model_id: modelId,
              part_id: line.part_id,
              from_location_type: 'WAREHOUSE',
              from_location_id: line.source_warehouse_id,
              to_location_type: 'PRODUCTION_ORDER',
              to_location_id: orderId,
              dozens_qty: approvedDozens,
              executed_by: transferredBy,
              executed_at: now,
              notes: `Supplementary transfer for request ${requestNumber}`,
            },
          });

          await tx.supplementary_request_lines.update({
            where: { line_id: line.line_id },
            data: { transferred_dozens: approvedDozens },
          });
        }),
      );

      await tx.supplementary_material_requests.update({
        where: { request_id: requestId },
        data: {
          status: SupplementaryStatusEnum.TRANSFERRED,
          transferred_by: transferredBy,
          transferred_at: now,
        },
      });

      return tx.supplementary_material_requests.findUniqueOrThrow({
        where: { request_id: requestId },
        include: SUP_INCLUDE,
      });
    });
  }

  // ── Read — single ─────────────────────────────────────────────────────────

  async findById(
    requestId: bigint,
  ): Promise<SupplementaryWithRelations | null> {
    return this.db.supplementary_material_requests.findUnique({
      where: { request_id: requestId },
      include: SUP_INCLUDE,
    });
  }

  // ── Read — list with optional filters ────────────────────────────────────

  async findMany(
    filter: SupplementaryFilter,
  ): Promise<SupplementaryWithRelations[]> {
    return this.db.supplementary_material_requests.findMany({
      where: {
        ...(filter.order_id !== undefined && { order_id: filter.order_id }),
        ...(filter.status !== undefined && { status: filter.status }),
        ...(filter.reason_type !== undefined && {
          reason_type: filter.reason_type,
        }),
      },
      include: SUP_INCLUDE,
      orderBy: { requested_at: 'desc' },
    });
  }

  // ── Read — paginated ──────────────────────────────────────────────────────

  async findPage(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<SupplementaryWithRelations>> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.supplementary_material_requests.findMany({
        include: SUP_INCLUDE,
        orderBy: { requested_at: 'desc' },
        skip,
        take: limit,
      }),
      this.db.supplementary_material_requests.count(),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  // ── Read — by order (for summary) ────────────────────────────────────────

  async findByOrder(orderId: bigint): Promise<SupplementaryWithRelations[]> {
    return this.db.supplementary_material_requests.findMany({
      where: { order_id: orderId },
      include: SUP_INCLUDE,
      orderBy: { requested_at: 'asc' },
    });
  }

  // ── Read — dashboard aggregates ───────────────────────────────────────────

  async getDashboardAggregates(): Promise<SupplementaryDashboardDto> {
    const [total, byStatusRaw, byReasonRaw] = await Promise.all([
      this.db.supplementary_material_requests.count(),
      this.db.supplementary_material_requests.groupBy({
        by: ['status'],
        _count: { request_id: true },
        orderBy: { _count: { request_id: 'desc' } },
      }),
      this.db.supplementary_material_requests.groupBy({
        by: ['reason_type'],
        _count: { request_id: true },
        orderBy: { _count: { request_id: 'desc' } },
      }),
    ]);

    return {
      total_requests: total,
      by_status: byStatusRaw.map((r) => ({
        status: r.status,
        count: r._count.request_id,
      })),
      by_reason: byReasonRaw.map((r) => ({
        reason_type: r.reason_type,
        count: r._count.request_id,
      })),
    };
  }
}
