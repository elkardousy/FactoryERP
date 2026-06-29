import { ApiProperty } from '@nestjs/swagger';

export class WarehouseBalanceSummaryDto {
  @ApiProperty({ description: 'Warehouse ID' })
  warehouse_id: string;

  @ApiProperty({
    description: 'Total dozens on hand across all SKUs in this warehouse',
  })
  total_on_hand_dozens: string;

  @ApiProperty({
    description: 'Number of distinct SKU entries (model+part combinations)',
  })
  sku_count: number;
}
