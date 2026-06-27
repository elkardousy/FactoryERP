import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ example: '1' })
  txn_id!: string;

  @ApiProperty({ example: 'TXN-2026-001' })
  txn_reference!: string;

  @ApiProperty({ example: 'RECEIVING' })
  txn_type!: string;

  @ApiProperty({ example: '1' })
  model_id!: string;

  @ApiPropertyOptional({ example: '1' })
  part_id!: string | null;

  @ApiPropertyOptional({ example: 'WAREHOUSE' })
  from_location_type!: string | null;

  @ApiPropertyOptional({ example: '1' })
  from_location_id!: string | null;

  @ApiPropertyOptional({ example: 'WAREHOUSE' })
  to_location_type!: string | null;

  @ApiPropertyOptional({ example: '2' })
  to_location_id!: string | null;

  @ApiProperty({ example: '10.000' })
  dozens_qty!: string;

  @ApiProperty({ example: '1' })
  executed_by!: string;

  @ApiProperty({ example: '2026-06-27T10:00:00.000Z' })
  executed_at!: string;

  @ApiPropertyOptional({ example: 'Received from container C-001' })
  notes!: string | null;
}
