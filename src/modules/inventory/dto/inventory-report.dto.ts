import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AccountabilityClosureEnum } from '@prisma/client';

export class TransactionVolumeItemDto {
  @ApiProperty() txn_type: string;
  @ApiProperty() count: number;
}

export class TransactionVolumeReportDto {
  @ApiProperty() from_date: string;
  @ApiProperty() to_date: string;
  @ApiProperty({ type: [TransactionVolumeItemDto] })
  volumes: TransactionVolumeItemDto[];
  @ApiProperty() total_transactions: number;
}

export class StockPositionItemDto {
  @ApiProperty() warehouse_id: string;
  @ApiProperty() model_id: string;
  @ApiProperty() part_id: string;
  @ApiProperty() dozens_on_hand: string;
  @ApiProperty() last_updated: string;
}

export class StockPositionReportDto {
  @ApiProperty({ type: [StockPositionItemDto] })
  positions: StockPositionItemDto[];
  @ApiProperty() total_skus: number;
  @ApiProperty() total_dozens_on_hand: string;
}

export class VarianceReportDto {
  @ApiProperty() investigation_id: string;
  @ApiProperty() investigation_number: string;
  @ApiProperty() warehouse_id: string | null;
  @ApiProperty() model_id: string | null;
  @ApiProperty() part_id: string | null;
  @ApiProperty() description: string;
  @ApiProperty() closure_status: string;
  @ApiProperty() reported_at: string;
}

export class VarianceSummaryReportDto {
  @ApiProperty({ type: [VarianceReportDto] }) variances: VarianceReportDto[];
  @ApiProperty() total: number;
  @ApiProperty() open: number;
  @ApiProperty() closed: number;
}

export class TransactionVolumeQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  to_date?: string;
}

export class VarianceReportQueryDto {
  @ApiPropertyOptional({ enum: AccountabilityClosureEnum })
  @IsOptional()
  @IsEnum(AccountabilityClosureEnum)
  closure_status?: AccountabilityClosureEnum;
}

export class StockPositionQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  warehouse_id?: string;
}
