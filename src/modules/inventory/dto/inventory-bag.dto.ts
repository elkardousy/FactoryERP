import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class InventoryBagFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  warehouse_id?: bigint;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  model_id?: bigint;
}
