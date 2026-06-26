import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WarehouseTypeEnum } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'WH-RAW-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  warehouse_code!: string;

  @ApiProperty({ example: 'Raw Materials Warehouse 01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  warehouse_name!: string;

  @ApiProperty({ enum: WarehouseTypeEnum, example: WarehouseTypeEnum.RAW })
  @IsEnum(WarehouseTypeEnum)
  warehouse_type!: WarehouseTypeEnum;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

export class WarehouseFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'raw' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WarehouseTypeEnum })
  @IsOptional()
  @IsEnum(WarehouseTypeEnum)
  warehouse_type?: WarehouseTypeEnum;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
