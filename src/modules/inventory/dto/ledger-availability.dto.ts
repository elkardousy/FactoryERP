import { ApiProperty } from '@nestjs/swagger';

export class LedgerAvailabilityDto {
  @ApiProperty({ description: 'Inventory ledger entry ID' })
  bag_id: string;

  @ApiProperty({ description: 'Warehouse ID' })
  warehouse_id: string;

  @ApiProperty({ description: 'Model ID' })
  model_id: string;

  @ApiProperty({ description: 'Part ID' })
  part_id: string;

  @ApiProperty({ description: 'Total dozens on hand in this ledger entry' })
  on_hand_dozens: string;

  @ApiProperty({ description: 'Timestamp of last ledger update' })
  last_updated: string;
}
