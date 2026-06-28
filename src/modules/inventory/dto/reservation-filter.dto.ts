import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ReservationStatusEnum } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class ReservationFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReservationStatusEnum })
  @IsOptional()
  @IsEnum(ReservationStatusEnum)
  status?: ReservationStatusEnum;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  bag_id?: bigint;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  order_id?: bigint;
}
