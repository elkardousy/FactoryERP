import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateProductionLineDto {
  @ApiProperty({ example: 'L01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  line_code!: string;

  @ApiProperty({ example: 'Production Line 01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  line_name!: string;
}

export class UpdateProductionLineDto extends PartialType(
  CreateProductionLineDto,
) {}

export class ProductionLineFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'L01' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
