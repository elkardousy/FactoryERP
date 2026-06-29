import { Injectable } from '@nestjs/common';
import { InventoryPerformanceRepository } from '../repositories/inventory-performance.repository';
import {
  BagStatusDistributionDto,
  InventoryPerformanceSummaryDto,
} from '../dto/inventory-performance.dto';

@Injectable()
export class InventoryPerformanceService {
  constructor(private readonly perfRepo: InventoryPerformanceRepository) {}

  async getSummary(): Promise<InventoryPerformanceSummaryDto> {
    const [stockHealth, cycleCountMetrics, txnActivity] = await Promise.all([
      this.perfRepo.getStockHealth(),
      this.perfRepo.getCycleCountMetrics(),
      this.perfRepo.getTransactionActivity30d(),
    ]);

    const resolutionRate =
      cycleCountMetrics.total > 0
        ? Math.round((cycleCountMetrics.closed / cycleCountMetrics.total) * 100)
        : 100;

    const dto = new InventoryPerformanceSummaryDto();
    dto.stock_health = {
      total_skus: stockHealth.total_skus,
      zero_stock_skus: stockHealth.zero_stock_skus,
    };
    dto.cycle_count_metrics = {
      total_investigations: cycleCountMetrics.total,
      open_investigations: cycleCountMetrics.open,
      closed_investigations: cycleCountMetrics.closed,
      resolution_rate: resolutionRate,
    };
    dto.transaction_activity_30d = txnActivity.map((t) => ({
      txn_type: t.txn_type,
      count: t.count,
    }));
    dto.computed_at = new Date().toISOString();
    return dto;
  }

  async getBagStatusDistribution(): Promise<BagStatusDistributionDto[]> {
    const rows = await this.perfRepo.getBagStatusDistribution();
    return rows.map((r) => ({ status: r.status, count: r.count }));
  }
}
