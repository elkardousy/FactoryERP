import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AdjustmentReasonEnum {
  POSITIVE_CORRECTION = 'POSITIVE_CORRECTION',
  NEGATIVE_CORRECTION = 'NEGATIVE_CORRECTION',
  DAMAGE = 'DAMAGE',
  LOSS = 'LOSS',
  AUDIT_VARIANCE = 'AUDIT_VARIANCE',
}

export class ApplyAdjustmentDto {
  @ApiProperty({ example: '1' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ example: '1' })
  @IsString()
  model_id: string;

  @ApiProperty({ example: '1' })
  @IsString()
  part_id: string;

  @ApiProperty({ enum: AdjustmentReasonEnum })
  @IsEnum(AdjustmentReasonEnum)
  reason: AdjustmentReasonEnum;

  @ApiProperty({
    description:
      'Positive to add stock, negative to deduct. DAMAGE and LOSS must be negative.',
    example: -5.5,
  })
  @IsNumber()
  @Type(() => Number)
  dozens_delta: number;

  @ApiProperty({ example: 'ADJ-2026-001' })
  @IsString()
  @IsNotEmpty()
  txn_reference: string;

  @ApiPropertyOptional({ example: 'Physical count after warehouse inspection' })
  @IsOptional()
  @IsString()
  notes?: string;
}
