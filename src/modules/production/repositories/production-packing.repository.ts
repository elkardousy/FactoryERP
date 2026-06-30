import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackingOrderStatusEnum, TxnTypeEnum } from '@prisma/client';
import type {
  packing_orders,
  packing_patterns,
  packing_pattern_lines,
  quality_output_boxes,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type { PackingOrderWithRelations } from '../dto/production-packing.dto';

// ─── Internal signal for transaction rollback on version conflict ─────────────
class VersionConflictSignal extends Error {
  constructor() {
    super('VERSION_CONFLICT');
  }
}

const MAX_RETRIES = 3;

// ─── Param / Result interfaces ────────────────────────────────────────────────

export interface PackingOrderCreateParams {
  productionOrderId: bigint;
  patternId: bigint;
  modelId: bigint;
  targetDozens: number;
  packingOrderNo: string;
  createdBy: bigint;
  now: Date;
  notes?: string;
}

export interface AssemblyLineInput {
  qualityBoxId: bigint;
  colorId: bigint;
  sizeId: bigint;
  patternLineId: bigint;
  piecesConsumed: number;
}

export interface AddAssemblyParams {
  packingOrderId: bigint;
  productionOrderId: bigint;
  lines: AssemblyLineInput[];
  dozensAssembled: number;
  assembledBy: bigint;
  now: Date;
  notes?: string;
}

export interface AddAssemblyResult {
  assemblyId: bigint;
  assemblySequence: number;
  dozensAssembled: number;
  updatedAssembledDozens: number;
}

export interface VerifyPackingParams {
  packingOrderId: bigint;
  systemDozens: number;
  physicalCountDozens: number;
  varianceNotes?: string;
  verifiedBy: bigint;
  now: Date;
}

export interface PostPackingParams {
  packingOrderId: bigint;
  productionOrderId: bigint;
  modelId: bigint;
  assembledDozens: number;
  postedBy: bigint;
  now: Date;
}

// ─── Include shape for packing orders ────────────────────────────────────────

const PACKING_INCLUDE = {
  packing_verifications: true,
} as const;

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class ProductionPackingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async findPackingOrderById(
    packingOrderId: bigint,
  ): Promise<PackingOrderWithRelations | null> {
    return this.db.packing_orders.findUnique({
      where: { packing_order_id: packingOrderId },
      include: PACKING_INCLUDE,
    });
  }

  async findPackingOrderByProductionOrderId(
    productionOrderId: bigint,
  ): Promise<packing_orders | null> {
    return this.db.packing_orders.findUnique({
      where: { production_order_id: productionOrderId },
    });
  }

  async findPackingOrders(filter: {
    production_order_id?: bigint;
    status?: string;
  }): Promise<PackingOrderWithRelations[]> {
    return this.db.packing_orders.findMany({
      where: {
        ...(filter.production_order_id !== undefined && {
          production_order_id: filter.production_order_id,
        }),
        ...(filter.status !== undefined && {
          status: filter.status as PackingOrderStatusEnum,
        }),
      },
      include: PACKING_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  async findPackingOrdersPage(
    page: number,
    limit: number,
  ): Promise<{ items: PackingOrderWithRelations[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.packing_orders.findMany({
        include: PACKING_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.db.packing_orders.count(),
    ]);
    return { items, total };
  }

  async findActivePatternForModel(modelId: bigint): Promise<
    | (packing_patterns & {
        packing_pattern_lines: packing_pattern_lines[];
      })
    | null
  > {
    return this.db.packing_patterns.findFirst({
      where: { model_id: modelId, is_active: true },
      include: { packing_pattern_lines: true },
      orderBy: { pattern_id: 'desc' },
    });
  }

  async sumAvailableDozensByOrder(orderId: bigint): Promise<number> {
    const agg = await this.db.quality_output_boxes.aggregate({
      where: { order_id: orderId, dozens_available: { gt: 0 } },
      _sum: { dozens_available: true },
    });
    return Number(agg._sum.dozens_available ?? 0);
  }

  async findQOBoxesByIds(boxIds: bigint[]): Promise<quality_output_boxes[]> {
    return this.db.quality_output_boxes.findMany({
      where: { box_id: { in: boxIds } },
    });
  }

  // ── Write — CreatePackingOrder ────────────────────────────────────────────

  async createPackingOrder(
    params: PackingOrderCreateParams,
  ): Promise<packing_orders> {
    return this.db.packing_orders.create({
      data: {
        packing_order_no: params.packingOrderNo,
        production_order_id: params.productionOrderId,
        pattern_id: params.patternId,
        target_dozens: params.targetDozens,
        assembled_dozens: 0,
        status: PackingOrderStatusEnum.DRAFT,
        created_by: params.createdBy,
        created_at: params.now,
        notes: params.notes ?? undefined,
      },
    });
  }

  // ── Write — AddAssembly (with QO optimistic lock) ─────────────────────────

  async addAssembly(params: AddAssemblyParams): Promise<AddAssemblyResult> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Re-read QO boxes on every attempt to get current versions
      const boxIds = params.lines.map((l) => l.qualityBoxId);
      const currentBoxes = await this.db.quality_output_boxes.findMany({
        where: { box_id: { in: boxIds } },
      });

      // Validate each box belongs to the right production order
      for (const line of params.lines) {
        const box = currentBoxes.find((b) => b.box_id === line.qualityBoxId);
        if (!box) {
          throw new NotFoundException(
            `Quality output box ${line.qualityBoxId} not found`,
          );
        }
        if (box.order_id !== params.productionOrderId) {
          throw new BadRequestException(
            `Quality output box ${box.box_id} does not belong to production order ${params.productionOrderId}`,
          );
        }
        const requiredDozens = line.piecesConsumed / 12.0;
        if (Number(box.dozens_available) < requiredDozens) {
          throw new BadRequestException(
            `Insufficient dozens in quality output box ${box.box_id}: available=${Number(box.dozens_available).toFixed(3)}, required=${requiredDozens.toFixed(3)}`,
          );
        }
      }

      const result = await this.tryAddAssemblyTransaction(params, currentBoxes);
      if (result !== null) return result;
    }

    throw new ConflictException(
      'Optimistic lock conflict on quality output boxes — please retry',
    );
  }

  private async tryAddAssemblyTransaction(
    params: AddAssemblyParams,
    currentBoxes: quality_output_boxes[],
  ): Promise<AddAssemblyResult | null> {
    const { packingOrderId, lines, dozensAssembled, assembledBy, now, notes } =
      params;

    try {
      return await this.executeInTransaction(async (tx) => {
        // Optimistic lock on each QO box
        for (const line of lines) {
          const box = currentBoxes.find((b) => b.box_id === line.qualityBoxId)!;
          const newAvailable = Math.max(
            0,
            Number(box.dozens_available) - line.piecesConsumed / 12.0,
          );
          const updateResult = await tx.quality_output_boxes.updateMany({
            where: { box_id: box.box_id, version: box.version },
            data: {
              dozens_available: newAvailable,
              version: box.version + 1n,
              last_updated: now,
            },
          });
          if (updateResult.count === 0) throw new VersionConflictSignal();
        }

        // Next assembly sequence within this packing order
        const agg = await tx.dozen_assemblies.aggregate({
          where: { packing_order_id: packingOrderId },
          _max: { assembly_sequence: true },
        });
        const nextSeq = (agg._max.assembly_sequence ?? 0) + 1;

        // Create dozen_assembly
        const assembly = await tx.dozen_assemblies.create({
          data: {
            packing_order_id: packingOrderId,
            assembly_sequence: nextSeq,
            dozens_assembled: dozensAssembled,
            assembled_by: assembledBy,
            assembled_at: now,
            notes: notes ?? undefined,
          },
        });

        // Create dozen_assembly_lines — never write dozens_consumed (BR-P03, ED-P08-005)
        for (const line of lines) {
          await tx.dozen_assembly_lines.create({
            data: {
              assembly_id: assembly.assembly_id,
              quality_box_id: line.qualityBoxId,
              color_id: line.colorId,
              size_id: line.sizeId,
              pattern_line_id: line.patternLineId,
              pieces_consumed: line.piecesConsumed,
            },
          });
        }

        // Increment packing_orders.assembled_dozens
        const updatedOrder = await tx.packing_orders.update({
          where: { packing_order_id: packingOrderId },
          data: { assembled_dozens: { increment: dozensAssembled } },
          select: { assembled_dozens: true },
        });

        // Auto-transition DRAFT → IN_PROCESS on first assembly (ED-P08-006)
        await tx.packing_orders.updateMany({
          where: {
            packing_order_id: packingOrderId,
            status: PackingOrderStatusEnum.DRAFT,
          },
          data: {
            status: PackingOrderStatusEnum.IN_PROCESS,
            started_by: assembledBy,
            started_at: now,
          },
        });

        return {
          assemblyId: assembly.assembly_id,
          assemblySequence: nextSeq,
          dozensAssembled,
          updatedAssembledDozens: Number(updatedOrder.assembled_dozens),
        };
      });
    } catch (e) {
      if (e instanceof VersionConflictSignal) return null;
      throw e;
    }
  }

  // ── Write — VerifyPacking ─────────────────────────────────────────────────

  async verifyPackingOrder(
    params: VerifyPackingParams,
  ): Promise<PackingOrderWithRelations> {
    const {
      packingOrderId,
      systemDozens,
      physicalCountDozens,
      varianceNotes,
      verifiedBy,
      now,
    } = params;

    await this.executeInTransaction(async (tx) => {
      // Create packing_verifications — variance_dozens is DB-generated (ED-P08-005)
      await tx.packing_verifications.create({
        data: {
          packing_order_id: packingOrderId,
          system_dozens: systemDozens,
          physical_count_dozens: physicalCountDozens,
          variance_accepted: true, // combined submit+approve (ED-P08-003)
          variance_notes: varianceNotes ?? undefined,
          verified_by: verifiedBy,
          verified_at: now,
        },
      });

      // Transition to VERIFIED
      await tx.packing_orders.update({
        where: { packing_order_id: packingOrderId },
        data: {
          status: PackingOrderStatusEnum.VERIFIED,
          verified_by: verifiedBy,
          verified_at: now,
          verified_dozens: physicalCountDozens,
        },
      });
    });

    const updated = await this.findPackingOrderById(packingOrderId);
    return updated!;
  }

  // ── Write — PostPacking ───────────────────────────────────────────────────

  async postPackingOrder(
    params: PostPackingParams,
  ): Promise<PackingOrderWithRelations> {
    const {
      packingOrderId,
      productionOrderId,
      modelId,
      assembledDozens,
      postedBy,
      now,
    } = params;

    await this.executeInTransaction(async (tx) => {
      // Create PACKING inventory transaction (BR-Inv02, ED-P08-007)
      await tx.inventory_transactions.create({
        data: {
          txn_reference: `PKG-${packingOrderId}`,
          txn_type: TxnTypeEnum.PACKING,
          model_id: modelId,
          from_location_type: 'PRODUCTION_ORDER',
          from_location_id: productionOrderId,
          // to_location_type/id deferred — FG warehouse unknown (ED-P08-004)
          dozens_qty: assembledDozens,
          executed_by: postedBy,
          executed_at: now,
          notes: 'Packing posted — FG bag creation deferred (ED-P08-004)',
        },
      });

      // Transition to POSTED
      await tx.packing_orders.update({
        where: { packing_order_id: packingOrderId },
        data: {
          status: PackingOrderStatusEnum.POSTED,
          posted_by: postedBy,
          posted_at: now,
        },
      });
    });

    const updated = await this.findPackingOrderById(packingOrderId);
    return updated!;
  }
}
