import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionHistoryDto {
  @ApiProperty({ example: '1' })
  movement_id!: string;

  @ApiProperty({ example: '1' })
  bag_id!: string;

  @ApiPropertyOptional({ example: 'AVAILABLE' })
  from_status!: string | null;

  @ApiProperty({ example: 'RESERVED' })
  to_status!: string;

  @ApiPropertyOptional({ example: '1' })
  from_warehouse_id!: string | null;

  @ApiPropertyOptional({ example: '2' })
  to_warehouse_id!: string | null;

  @ApiPropertyOptional({ example: '1' })
  from_order_id!: string | null;

  @ApiPropertyOptional({ example: '1' })
  to_order_id!: string | null;

  @ApiPropertyOptional({ example: '5.000' })
  dozens_moved!: string | null;

  @ApiProperty({ example: 'TRANSFER' })
  movement_reason!: string;

  @ApiProperty({ example: '1' })
  performed_by!: string;

  @ApiProperty({ example: '2026-06-27T10:00:00.000Z' })
  performed_at!: string;

  @ApiPropertyOptional({ example: 'Transferred to warehouse B' })
  notes!: string | null;
}
