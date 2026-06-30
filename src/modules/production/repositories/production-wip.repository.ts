import { ConflictException, Injectable } from '@nestjs/common';
import { TxnTypeEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type {
  wip_inventory,
  production_orders,
  model_parts,
  production_lines,
  inventory_transactions,
} from '@prisma/client';
import {
  buildPaginationMeta,
  type PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';

export type WipWithRelations = wip_inventory & {
  production_orders: Pick<
    production_orders,
    'order_number' | 'model_id' | 'status'
  >;
  model_parts: Pick<model_parts, 'part_code' | 'part_description'>;
  production_lines: Pick<production_lines, 'line_code' | 'line_name'>;
};

export interface WipFilter {
  order_id?: bigint;
  line_id?: bigint;
}

export interface WipUpsertParams {
  orderId: bigint;
  lineId: bigint;
  partId: bigint;
  modelId: bigint;
  dozensInWip: number;
  stageId: bigint;
  executedBy: bigint;
  now: Date;
}

const WIP_INCLUDE = {
  production_orders: {
    select: { order_number: true, model_id: true, status: true },
  },
  model_parts: {
    select: { part_code: true, part_description: true },
  },
  production_lines: {
    select: { line_code: true, line_name: true },
  },
} as const;

@Injectable()
export class ProductionWipRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByWipId(wipId: bigint): Promise<WipWithRelations | null> {
    return this.db.wip_inventory.findUnique({
      where: { wip_id: wipId },
      include: WIP_INCLUDE,
    });
  }

  async findByOrder(orderId: bigint): Promise<WipWithRelations[]> {
    return this.db.wip_inventory.findMany({
      where: { order_id: orderId },
      include: WIP_INCLUDE,
      orderBy: { model_parts: { sort_order: 'asc' } },
    });
  }

  async findMany(
    filter: WipFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<WipWithRelations>> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.line_id && { line_id: filter.line_id }),
    };
    const [items, total] = await this.db.$transaction([
      this.db.wip_inventory.findMany({
        where,
        include: WIP_INCLUDE,
        orderBy: [{ order_id: 'asc' }, { model_parts: { sort_order: 'asc' } }],
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

  async findWipTransactionsByOrder(
    orderId: bigint,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<inventory_transactions>> {
    const where = {
      txn_type: TxnTypeEnum.WIP_CONSUMPTION,
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

  // BR-W01: optimistic lock upsert with up to 3 retries
  // BR-W03: create on first stage, update on subsequent stages
  // BR-Inv03: WIP balance update + inventory transaction are atomic
  async upsertAndRecordTransaction(
    params: WipUpsertParams,
  ): Promise<wip_inventory> {
    const {
      orderId,
      lineId,
      partId,
      modelId,
      dozensInWip,
      stageId,
      executedBy,
      now,
    } = params;
    const txnRef = `WIP-${orderId.toString()}-S${stageId.toString()}`;

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const existing = await this.db.wip_inventory.findFirst({
        where: { order_id: orderId, part_id: partId },
      });

      if (!existing) {
        // First stage completion for this (order, part) pair — create
        try {
          const result = await this.executeInTransaction(async (tx) => {
            const wip = await tx.wip_inventory.create({
              data: {
                order_id: orderId,
                line_id: lineId,
                part_id: partId,
                dozens_in_wip: dozensInWip,
                version: 1n,
                last_updated: now,
              },
            });
            await tx.inventory_transactions.create({
              data: {
                txn_reference: txnRef,
                txn_type: TxnTypeEnum.WIP_CONSUMPTION,
                model_id: modelId,
                part_id: partId,
                from_location_type: 'PRODUCTION_ORDER',
                from_location_id: orderId,
                to_location_type: 'PRODUCTION_ORDER',
                to_location_id: orderId,
                dozens_qty: dozensInWip,
                executed_by: executedBy,
                executed_at: now,
                notes: `Stage ${stageId.toString()} WIP update for order ${orderId.toString()}`,
              },
            });
            return wip;
          });
          return result;
        } catch {
          // Unique constraint from concurrent creation — retry
          if (attempt < MAX_RETRIES - 1) continue;
          throw new ConflictException(
            `WIP creation conflict for order ${orderId} part ${partId}`,
          );
        }
      }

      // Subsequent stage completion — update with optimistic lock
      const currentVersion = existing.version;
      const newVersion = currentVersion + 1n;

      const result = await this.executeInTransaction(async (tx) => {
        const updateResult = await tx.wip_inventory.updateMany({
          where: {
            order_id: orderId,
            part_id: partId,
            version: currentVersion,
          },
          data: {
            dozens_in_wip: dozensInWip,
            version: newVersion,
            last_updated: now,
          },
        });
        if (updateResult.count === 0) return null; // version conflict
        await tx.inventory_transactions.create({
          data: {
            txn_reference: txnRef,
            txn_type: TxnTypeEnum.WIP_CONSUMPTION,
            model_id: modelId,
            part_id: partId,
            from_location_type: 'PRODUCTION_ORDER',
            from_location_id: orderId,
            to_location_type: 'PRODUCTION_ORDER',
            to_location_id: orderId,
            dozens_qty: dozensInWip,
            executed_by: executedBy,
            executed_at: now,
            notes: `Stage ${stageId.toString()} WIP update for order ${orderId.toString()}`,
          },
        });
        return tx.wip_inventory.findFirst({
          where: { order_id: orderId, part_id: partId },
        });
      });

      if (result !== null) return result;
      // null means version conflict, retry
    }

    throw new ConflictException(
      `WIP optimistic lock exhausted after 3 retries for order ${orderId} part ${partId}`,
    );
  }
}
