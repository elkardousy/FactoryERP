import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TxnTypeEnum } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class InventoryTransactionFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TxnTypeEnum })
  @IsOptional()
  @IsEnum(TxnTypeEnum)
  txn_type?: TxnTypeEnum;

  @ApiPropertyOptional({ example: 'TXN-2026-001' })
  @IsOptional()
  @IsString()
  txn_reference?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  model_id?: bigint;
}
