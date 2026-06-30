import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PartStatusEnum, TxnTypeEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type {
  return_transactions,
  inventory_transactions,
} from '@prisma/client';
import {
  buildPaginationMeta,
  type PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { ReturnWithRelations } from '../dto/production-returns.dto';

export interface ReturnFilter {
  order_id?: bigint;
  part_id?: bigint;
}

export interface ReturnCreateParams {
  orderId: bigint;
  partId: bigint;
  modelId: bigint;
  destinationWarehouseId: bigint;
  dozensReturned: number;
  returnedBy: bigint;
  now: Date;
}

export interface ReturnCreateResult {
  returnTxn: return_transactions;
  wipRemaining: number;
  partStatusUpdated: boolean;
}

const RETURN_INCLUDE = {
  model_parts: { select: { part_code: true, part_description: true } },
  warehouses: { select: { warehouse_name: true } },
} as const;

@Injectable()
export class ProductionReturnsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(returnId: bigint): Promise<ReturnWithRelations | null> {
    return this.db.return_transactions.findUnique({
      where: { return_id: returnId },
      include: RETURN_INCLUDE,
    });
  }

  async findMany(filter: ReturnFilter): Promise<ReturnWithRelations[]> {
    const where = {
      ...(filter.order_id && { order_id: filter.order_id }),
      ...(filter.part_id && { part_id: filter.part_id }),
    };
    return this.db.return_transactions.findMany({
      where,
      include: RETURN_INCLUDE,
      orderBy: { returned_at: 'desc' },
    });
  }

  async findByOrder(orderId: bigint): Promise<ReturnWithRelations[]> {
    return this.db.return_transactions.findMany({
      where: { order_id: orderId },
      include: RETURN_INCLUDE,
      orderBy: { returned_at: 'asc' },
    });
  }

  async findReturnTransactionsByOrder(
    orderId: bigint,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<inventory_transactions>> {
    const where = {
      txn_type: TxnTypeEnum.RETURN,
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

  // BR-Rt03: create RETURN inventory transaction atomically with return record
  // BR-Rt05: set part status to RETURNED when WIP reaches 0
  // ED-P07-007: optimistic lock on wip_inventory with up to 3 retries
  async createReturnAndRecord(
    params: ReturnCreateParams,
  ): Promise<ReturnCreateResult> {
    const {
      orderId,
      partId,
      modelId,
      destinationWarehouseId,
      dozensReturned,
      returnedBy,
      now,
    } = params;

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Re-read WIP on each attempt for optimistic lock
      const wip = await this.db.wip_inventory.findFirst({
        where: { order_id: orderId, part_id: partId },
      });

      if (!wip) {
        throw new BadRequestException(
          `No WIP found for order ${orderId} part ${partId} — material may not have been released`,
        );
      }

      const currentWip = Number(wip.dozens_in_wip);
      if (currentWip < dozensReturned) {
        throw new BadRequestException(
          `Insufficient WIP to return: available=${currentWip}, requested=${dozensReturned}`,
        );
      }

      const currentVersion = wip.version;
      const newWip = Math.max(0, currentWip - dozensReturned);

      const result = await this.executeInTransaction(async (tx) => {
        // Optimistic lock on wip_inventory
        const updateResult = await tx.wip_inventory.updateMany({
          where: { wip_id: wip.wip_id, version: currentVersion },
          data: {
            dozens_in_wip: newWip,
            version: currentVersion + 1n,
            last_updated: now,
          },
        });
        if (updateResult.count === 0) return null; // version conflict — retry

        // Create the return record
        const returnTxn = await tx.return_transactions.create({
          data: {
            order_id: orderId,
            destination_warehouse_id: destinationWarehouseId,
            part_id: partId,
            dozens_returned: dozensReturned,
            returned_by: returnedBy,
            returned_at: now,
          },
        });

        // BR-Rt03: create RETURN inventory transaction
        const txnRef = `RTN-${orderId.toString()}-P${partId.toString()}-R${returnTxn.return_id.toString()}`;
        await tx.inventory_transactions.create({
          data: {
            txn_reference: txnRef,
            txn_type: TxnTypeEnum.RETURN,
            model_id: modelId,
            part_id: partId,
            from_location_type: 'PRODUCTION_ORDER',
            from_location_id: orderId,
            to_location_type: 'WAREHOUSE',
            to_location_id: destinationWarehouseId,
            dozens_qty: dozensReturned,
            executed_by: returnedBy,
            executed_at: now,
            notes: `Return of part ${partId.toString()} from order ${orderId.toString()} to warehouse ${destinationWarehouseId.toString()}`,
          },
        });

        // BR-Rt05: update part status to RETURNED when WIP is zeroed
        let partStatusUpdated = false;
        if (newWip <= 0) {
          await tx.production_order_parts.updateMany({
            where: { order_id: orderId, part_id: partId },
            data: { status: PartStatusEnum.RETURNED },
          });
          partStatusUpdated = true;
        }

        return { returnTxn, wipRemaining: newWip, partStatusUpdated };
      });

      if (result !== null) return result;
      // null means optimistic lock conflict — retry
    }

    throw new ConflictException(
      `Return optimistic lock exhausted after 3 retries for order ${orderId} part ${partId}`,
    );
  }
}
