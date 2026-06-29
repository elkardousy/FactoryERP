import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenCycleCountDto {
  @ApiProperty({ example: 'CC-2026-001' })
  @IsString()
  @IsNotEmpty()
  investigation_number: string;

  @ApiProperty({ example: '1' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ example: '1' })
  @IsString()
  model_id: string;

  @ApiProperty({ example: '1' })
  @IsString()
  part_id: string;

  @ApiProperty({
    description: 'Actual physically counted quantity in dozens',
    example: 94.5,
  })
  @IsNumber()
  @Type(() => Number)
  actual_dozens: number;

  @ApiPropertyOptional({ example: 'Post-production count of bay A3' })
  @IsOptional()
  @IsString()
  notes?: string;
}
