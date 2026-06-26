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

export class CreateSizeDto {
  @ApiProperty({ example: 'S' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  size_code!: string;

  @ApiProperty({ example: 1, description: 'Display/sort order for this size' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order!: number;
}

export class UpdateSizeDto extends PartialType(CreateSizeDto) {}

export class SizeFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'S' })
  @IsOptional()
  @IsString()
  search?: string;
}
