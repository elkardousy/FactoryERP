import { Injectable } from '@nestjs/common';
import {
  AccountabilityClosureEnum,
  InvestigationTypeEnum,
  TxnTypeEnum,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';

export interface StockHealthAgg {
  total_skus: number;
  zero_stock_skus: number;
}

export interface CycleCountMetricsAgg {
  total: number;
  open: number;
  closed: number;
}

export interface TxnActivityAgg {
  txn_type: TxnTypeEnum;
  count: number;
}

export interface BagStatusAgg {
  status: string;
  count: number;
}

@Injectable()
export class InventoryPerformanceRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getStockHealth(): Promise<StockHealthAgg> {
    const [total, zeroStock] = await Promise.all([
      this.db.inventory_bags.count(),
      this.db.inventory_bags.count({ where: { dozens_on_hand: { lte: 0 } } }),
    ]);
    return { total_skus: total, zero_stock_skus: zeroStock };
  }

  async getCycleCountMetrics(): Promise<CycleCountMetricsAgg> {
    const [total, open, closed] = await Promise.all([
      this.db.inventory_investigations.count({
        where: { investigation_type: InvestigationTypeEnum.INVENTORY_VARIANCE },
      }),
      this.db.inventory_investigations.count({
        where: {
          investigation_type: InvestigationTypeEnum.INVENTORY_VARIANCE,
          closure_status: AccountabilityClosureEnum.OPEN,
        },
      }),
      this.db.inventory_investigations.count({
        where: {
          investigation_type: InvestigationTypeEnum.INVENTORY_VARIANCE,
          closure_status: AccountabilityClosureEnum.CLOSED,
        },
      }),
    ]);
    return { total, open, closed };
  }

  async getTransactionActivity30d(): Promise<TxnActivityAgg[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await this.db.inventory_transactions.groupBy({
      by: ['txn_type'],
      _count: { txn_type: true },
      where: { executed_at: { gte: thirtyDaysAgo } },
    });

    return rows.map((r) => ({
      txn_type: r.txn_type,
      count: r._count.txn_type,
    }));
  }

  async getBagStatusDistribution(): Promise<BagStatusAgg[]> {
    const rows = await this.db.physical_bags.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count.status }));
  }
}
