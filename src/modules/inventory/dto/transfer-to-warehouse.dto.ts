import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferToWarehouseDto {
  @ApiProperty({ description: 'Destination warehouse ID', example: '2' })
  @IsString()
  to_warehouse_id: string;

  @ApiPropertyOptional({
    description: 'Dozens being moved (optional)',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dozens_moved?: number;

  @ApiProperty({
    description: 'Reason for the transfer',
    maxLength: 50,
    example: 'WAREHOUSE_TRANSFER',
  })
  @IsString()
  @MaxLength(50)
  movement_reason: string;

  @ApiPropertyOptional({
    description: 'Optional notes',
    example: 'Transferred due to reorg',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
