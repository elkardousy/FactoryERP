import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateModelDto {
  @ApiProperty({ example: 1, description: 'Customer ID this model belongs to' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id!: number;

  @ApiProperty({ example: 'DRESS-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  model_code!: string;

  @ApiPropertyOptional({ example: 'Summer Dress 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  model_name?: string;
}

export class UpdateModelDto extends PartialType(
  OmitType(CreateModelDto, ['customer_id'] as const),
) {}

export class ModelFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id?: number;

  @ApiPropertyOptional({ example: 'dress' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
