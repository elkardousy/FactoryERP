import { ApiProperty } from '@nestjs/swagger';

export class TransactionActivityDto {
  @ApiProperty() txn_type: string;
  @ApiProperty() count: number;
}

export class BagStatusDistributionDto {
  @ApiProperty() status: string;
  @ApiProperty() count: number;
}

export class StockHealthDto {
  @ApiProperty({ description: 'Total SKU-warehouse combinations tracked' })
  total_skus: number;

  @ApiProperty({ description: 'SKUs with zero on-hand balance' })
  zero_stock_skus: number;
}

export class CycleCountMetricsDto {
  @ApiProperty() total_investigations: number;
  @ApiProperty() open_investigations: number;
  @ApiProperty() closed_investigations: number;
  @ApiProperty({ description: 'Percentage of investigations resolved (0-100)' })
  resolution_rate: number;
}

export class InventoryPerformanceSummaryDto {
  @ApiProperty({ type: StockHealthDto }) stock_health: StockHealthDto;
  @ApiProperty({ type: CycleCountMetricsDto })
  cycle_count_metrics: CycleCountMetricsDto;
  @ApiProperty({
    type: [TransactionActivityDto],
    description: 'Transaction counts over the last 30 days',
  })
  transaction_activity_30d: TransactionActivityDto[];
  @ApiProperty() computed_at: string;
}
