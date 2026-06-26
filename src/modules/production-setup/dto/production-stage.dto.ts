import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateProductionStageDto {
  @ApiProperty({ example: 'CUTTING' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  stage_code!: string;

  @ApiProperty({ example: 'Cutting' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  stage_name!: string;

  @ApiProperty({
    example: 1,
    description: 'Unique sequential order within the production flow',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence_order!: number;
}

export class UpdateProductionStageDto extends PartialType(
  CreateProductionStageDto,
) {}

export class ProductionStageFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'cut' })
  @IsOptional()
  @IsString()
  search?: string;
}
