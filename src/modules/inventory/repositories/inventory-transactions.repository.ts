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
}
