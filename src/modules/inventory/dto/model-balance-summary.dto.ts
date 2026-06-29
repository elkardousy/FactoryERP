import { ApiProperty } from '@nestjs/swagger';

export class ModelBalanceSummaryDto {
  @ApiProperty({ description: 'Model ID' })
  model_id: string;

  @ApiProperty({
    description: 'Total dozens on hand across all warehouses for this model',
  })
  total_on_hand_dozens: string;

  @ApiProperty({
    description: 'Number of distinct SKU entries (part+warehouse combinations)',
  })
  sku_count: number;

  @ApiProperty({ description: 'Number of warehouses holding this model' })
  warehouse_count: number;
}
