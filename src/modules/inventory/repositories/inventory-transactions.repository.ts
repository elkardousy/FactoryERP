import { Injectable } from '@nestjs/common';
import { TxnTypeEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { inventory_transactions } from '@prisma/client';

export interface InventoryTransactionFilter {
  model_id?: bigint;
  txn_type?: TxnTypeEnum;
  txn_reference?: string;
  from_date?: Date;
  to_date?: Date;
}

export interface CreateTransactionData {
  txn_reference: string;
  txn_type: TxnTypeEnum;
  model_id: bigint;
  part_id?: bigint | null;
  from_location_type?: string | null;
  from_location_id?: bigint | null;
  to_location_type?: string | null;
  to_location_id?: bigint | null;
  dozens_qty: number;
  executed_by: bigint;
  notes?: string | null;
}

@Injectable()
export class InventoryTransactionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAllWithPagination(
    filter: InventoryTransactionFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<inventory_transactions>> {
    const where = {
      ...(filter.model_id && { model_id: filter.model_id }),
      ...(filter.txn_type && { txn_type: filter.txn_type }),
      ...(filter.txn_reference && { txn_reference: filter.txn_reference }),
      ...((filter.from_date || filter.to_date) && {
        executed_at: {
          ...(filter.from_date && { gte: filter.from_date }),
          ...(filter.to_date && { lte: filter.to_date }),
        },
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.inventory_transactions.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { executed_at: 'desc' },
      }),
      this.db.inventory_transactions.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findByReference(txnReference: string): Promise<inventory_transactions[]> {
    return this.db.inventory_transactions.findMany({
      where: { txn_reference: txnReference },
      orderBy: { executed_at: 'asc' },
    });
  }

  async create(data: CreateTransactionData): Promise<inventory_transactions> {
    return this.db.inventory_transactions.create({ data });
  }

  async createInTx(
    tx: PrismaService,
    data: CreateTransactionData,
  ): Promise<inventory_transactions> {
    return tx.inventory_transactions.create({ data });
  }

  async findById(txnId: bigint): Promise<inventory_transactions | null> {
    return this.db.inventory_transactions.findFirst({ where: { txn_id: txnId } });
  }

  async findByWarehouseId(
    warehouseId: bigint,
    page: number,
    limit: number,
    from_date?: Date,
    to_date?: Date,
  ): Promise<PaginatedResult<inventory_transactions>> {
    const dateFilter =
      from_date || to_date
        ? {
            executed_at: {
              ...(from_date && { gte: from_date }),
              ...(to_date && { lte: to_date }),
            },
          }
        : {};

    const where = {
      OR: [
        { from_location_type: 'WAREHOUSE', from_location_id: warehouseId },
        { to_location_type: 'WAREHOUSE', to_location_id: warehouseId },
      ],
      ...dateFilter,
    };

    const [items, total] = await this.db.$transaction([
      this.db.inventory_transactions.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { executed_at: 'desc' },
      }),
      this.db.inventory_transactions.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
