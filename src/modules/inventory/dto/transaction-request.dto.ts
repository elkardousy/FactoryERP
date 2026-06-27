import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum TransactionOperationType {
  RECEIVE = 'RECEIVE',
  ISSUE = 'ISSUE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  OPENING_BALANCE = 'OPENING_BALANCE',
}

export class TransactionRequestDto {
  @ApiPropertyOptional({ enum: TransactionOperationType })
  @IsOptional()
  @IsEnum(TransactionOperationType)
  operation?: TransactionOperationType;

  @ApiProperty({ example: 'TXN-2026-001' })
  @IsString()
  @IsNotEmpty()
  txn_reference!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  model_id!: bigint;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  part_id?: bigint | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  from_warehouse_id?: bigint | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  to_warehouse_id?: bigint | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  to_order_id?: bigint | null;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Type(() => Number)
  dozens_qty!: number;

  @ApiPropertyOptional({ example: 'Received from container C-001' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
