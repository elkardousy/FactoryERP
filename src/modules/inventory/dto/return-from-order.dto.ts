import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class ReturnFromOrderDto {
  @ApiProperty({ description: 'Warehouse ID to return bag to', example: '1' })
  @IsString()
  to_warehouse_id: string;

  @ApiProperty({
    description: 'Reason for the return',
    maxLength: 50,
    example: 'PRODUCTION_RETURN',
  })
  @IsString()
  @MaxLength(50)
  movement_reason: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
