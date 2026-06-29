import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AssignToOrderDto {
  @ApiProperty({
    description: 'Production order ID to assign bag to',
    example: '5',
  })
  @IsString()
  to_order_id: string;

  @ApiPropertyOptional({
    description: 'Dozens being moved to order (optional)',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dozens_moved?: number;

  @ApiProperty({
    description: 'Reason for the assignment',
    maxLength: 50,
    example: 'PRODUCTION_ASSIGNMENT',
  })
  @IsString()
  @MaxLength(50)
  movement_reason: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
