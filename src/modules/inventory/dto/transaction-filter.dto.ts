import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { TxnTypeEnum } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class TransactionFilterDto extends PaginationDto {
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
  @IsNumber()
  @Type(() => Number)
  model_id?: bigint;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from_date?: Date;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to_date?: Date;
}
