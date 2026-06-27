import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BagStatusEnum } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class PhysicalBagFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'BAG-001' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BagStatusEnum })
  @IsOptional()
  @IsEnum(BagStatusEnum)
  status?: BagStatusEnum;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  model_id?: bigint;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  warehouse_id?: bigint;
}
