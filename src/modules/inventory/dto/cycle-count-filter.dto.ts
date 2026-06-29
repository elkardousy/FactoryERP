import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountabilityClosureEnum } from '@prisma/client';

export class CycleCountFilterDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  model_id?: string;

  @ApiPropertyOptional({ enum: AccountabilityClosureEnum })
  @IsOptional()
  @IsEnum(AccountabilityClosureEnum)
  closure_status?: AccountabilityClosureEnum;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
