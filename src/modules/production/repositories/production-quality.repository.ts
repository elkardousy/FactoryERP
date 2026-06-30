import { ConflictException, Injectable } from '@nestjs/common';
import { TxnTypeEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type {
  quality_output_boxes,
  inventory_transactions,
} from '@prisma/client';
import {
  buildPaginationMeta,
  type PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { QualityBoxWithRelations } from '../dto/production-quality.dto';

export interface QoFilter {
  order_id?: bigint;
  color_id?: bigint;
  size_id?: bigint;
}

export interface QoUpsertParams {
  orderId: bigint;
  modelId: bigint;
  colorId: bigint;
  sizeId: bigint;
  dozensToAdd: number;
  executedBy: bigint;
  now: Date;
}

const QO_INCLUDE = {
  models: { select: { model_code: true, model_name: true } },
  colors: { select: { color_code: true, color_name: true } },
  sizes: { select: { size_code: true } },
} as const;

@Injectable()
export class ProductionQualityRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findBoxById(boxId: bigint): Promise<QualityBoxWithRelations | null> {
    return this.db.quality_output_boxes.findUnique({
      where: { box_id: boxId },
      include: QO_INCLUDE,
    });
  }

  async findBoxesByOrder(orderId: bigint): Promise<QualityBoxWithRelations[]> {
    return this.db.quality_output_boxes.findMany({
      where: { order_id: orderId },
      include: QO_INCLUDE,
      orderBy: [
        { colors: { color_code: 'asc' } },
        { sizes: { sort_order: 'asc' } },
      ],
    });
  }

  async findMany(filter: QoFilter): Promise<QualityBoxWithRelations[]> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.color_id && { color_id: filter.color_id }),
      ...(filter.size_id && { size_id: filter.size_id }),
    };
    return this.db.quality_output_boxes.findMany({
      where,
      include: QO_INCLUDE,
      orderBy: [
        { order_id: 'asc' },
        { colors: { color_code: 'asc' } },
        { sizes: { sort_order: 'asc' } },
      ],
    });
  }

  async getTotalAvailableForOrder(orderId: bigint): Promise<number> {
    const result = await this.db.quality_output_boxes.aggregate({
      where: { order_id: orderId },
      _sum: { dozens_available: true },
    });
    return Number(result._sum.dozens_available ?? 0);
  }

  async findQoTransactionsByOrder(
    orderId: bigint,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<inventory_transactions>> {
    const where = {
      txn_type: TxnTypeEnum.QUALITY_OUTPUT,
      from_location_type: 'PRODUCTION_ORDER',
      from_location_id: orderId,
    };
    const [items, total] = await this.db.$transaction([
      this.db.inventory_transactions.findMany({
        where,
        orderBy: { executed_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.inventory_transactions.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  // BR-Q01: optimistic lock upsert with up to 3 retries
  // BR-Q02: accumulation — each recording adds to dozens_available, not replaces
  // Atomic: QO balance update + inventory transaction in one transaction
  async upsertAndRecordTransaction(
    params: QoUpsertParams,
  ): Promise<quality_output_boxes> {
    const { orderId, modelId, colorId, sizeId, dozensToAdd, executedBy, now } =
      params;
    const txnRef = `QO-${orderId.toString()}-C${colorId.toString()}-S${sizeId.toString()}`;

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const existing = await this.db.quality_output_boxes.findFirst({
        where: { order_id: orderId, color_id: colorId, size_id: sizeId },
      });

      if (!existing) {
        try {
          const result = await this.executeInTransaction(async (tx) => {
            const box = await tx.quality_output_boxes.create({
              data: {
                order_id: orderId,
                model_id: modelId,
                color_id: colorId,
                size_id: sizeId,
                dozens_available: dozensToAdd,
                version: 1n,
                last_updated: now,
              },
            });
            await tx.inventory_transactions.create({
              data: {
                txn_reference: txnRef,
                txn_type: TxnTypeEnum.QUALITY_OUTPUT,
                model_id: modelId,
                color_id: colorId,
                size_id: sizeId,
                from_location_type: 'PRODUCTION_ORDER',
                from_location_id: orderId,
                to_location_type: 'PRODUCTION_ORDER',
                to_location_id: orderId,
                dozens_qty: dozensToAdd,
                executed_by: executedBy,
                executed_at: now,
                notes: `QO recording for order ${orderId.toString()} color ${colorId.toString()} size ${sizeId.toString()}`,
              },
            });
            return box;
          });
          return result;
        } catch {
          if (attempt < MAX_RETRIES - 1) continue;
          throw new ConflictException(
            `QO creation conflict for order ${orderId} color ${colorId} size ${sizeId}`,
          );
        }
      }

      // Existing box — accumulate with optimistic lock
      const currentVersion = existing.version;
      const newVersion = currentVersion + 1n;
      const newDozens = Number(existing.dozens_available) + dozensToAdd;

      const result = await this.executeInTransaction(async (tx) => {
        const updateResult = await tx.quality_output_boxes.updateMany({
          where: {
            order_id: orderId,
            color_id: colorId,
            size_id: sizeId,
            version: currentVersion,
          },
          data: {
            dozens_available: newDozens,
            version: newVersion,
            last_updated: now,
          },
        });
        if (updateResult.count === 0) return null;
        await tx.inventory_transactions.create({
          data: {
            txn_reference: txnRef,
            txn_type: TxnTypeEnum.QUALITY_OUTPUT,
            model_id: modelId,
            color_id: colorId,
            size_id: sizeId,
            from_location_type: 'PRODUCTION_ORDER',
            from_location_id: orderId,
            to_location_type: 'PRODUCTION_ORDER',
            to_location_id: orderId,
            dozens_qty: dozensToAdd,
            executed_by: executedBy,
            executed_at: now,
            notes: `QO recording for order ${orderId.toString()} color ${colorId.toString()} size ${sizeId.toString()}`,
          },
        });
        return tx.quality_output_boxes.findFirst({
          where: { order_id: orderId, color_id: colorId, size_id: sizeId },
        });
      });

      if (result !== null) return result;
      // null means version conflict — retry
    }

    throw new ConflictException(
      `QO optimistic lock exhausted after 3 retries for order ${orderId} color ${colorId} size ${sizeId}`,
    );
  }
}
