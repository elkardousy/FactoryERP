import { Injectable } from '@nestjs/common';
import {
  AccountabilityClosureEnum,
  InvestigationTypeEnum,
  TxnTypeEnum,
} from '@prisma/client';
import type { inventory_bags, inventory_investigations } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';

export interface TxnVolumeRow {
  txn_type: TxnTypeEnum;
  count: number;
}

@Injectable()
export class InventoryReportingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getTransactionVolume(
    fromDate: Date,
    toDate: Date,
  ): Promise<TxnVolumeRow[]> {
    const rows = await this.db.inventory_transactions.groupBy({
      by: ['txn_type'],
      _count: { txn_type: true },
      where: { executed_at: { gte: fromDate, lte: toDate } },
    });
    return rows.map((r) => ({
      txn_type: r.txn_type,
      count: r._count.txn_type,
    }));
  }

  async getStockPosition(warehouseId?: bigint): Promise<inventory_bags[]> {
    return this.db.inventory_bags.findMany({
      where: { ...(warehouseId && { warehouse_id: warehouseId }) },
      orderBy: [
        { warehouse_id: 'asc' },
        { model_id: 'asc' },
        { part_id: 'asc' },
      ],
    });
  }

  async getVarianceReport(
    closureStatus?: AccountabilityClosureEnum,
  ): Promise<inventory_investigations[]> {
    return this.db.inventory_investigations.findMany({
      where: {
        investigation_type: InvestigationTypeEnum.INVENTORY_VARIANCE,
        ...(closureStatus && { closure_status: closureStatus }),
      },
      orderBy: { reported_at: 'desc' },
    });
  }
}
