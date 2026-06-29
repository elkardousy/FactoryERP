import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BalanceSnapshotDto {
  @ApiProperty({ description: 'Ledger entry ID' })
  bag_id: string;

  @ApiProperty({ description: 'Warehouse ID' })
  warehouse_id: string;

  @ApiProperty({ description: 'Model ID' })
  model_id: string;

  @ApiProperty({ description: 'Part ID' })
  part_id: string;

  @ApiProperty({ description: 'Current dozens on hand' })
  on_hand_dozens: string;

  @ApiProperty({ description: 'Optimistic lock version' })
  version: string;

  @ApiProperty({ description: 'Timestamp of last ledger update' })
  last_updated: string;
}

export class BalanceSnapshotQueryDto {
  @ApiPropertyOptional({ description: 'Warehouse ID', example: 1 })
  @IsNumber()
  @Type(() => Number)
  warehouse_id: number;

  @ApiPropertyOptional({ description: 'Model ID', example: 1 })
  @IsNumber()
  @Type(() => Number)
  model_id: number;

  @ApiPropertyOptional({ description: 'Part ID', example: 1 })
  @IsNumber()
  @Type(() => Number)
  part_id: number;
}
