import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import type { inventory_transactions } from '@prisma/client';
import type { WipWithRelations } from '../repositories/production-wip.repository';

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export class WipFilterDto {
  @ApiPropertyOptional({ description: 'Filter by production order ID' })
  @IsOptional()
  @IsString()
  order_id?: string;

  @ApiPropertyOptional({ description: 'Filter by production line ID' })
  @IsOptional()
  @IsString()
  line_id?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class WipHistoryFilterDto {
  @ApiProperty({
    description: 'Production order ID (required for history query)',
  })
  @IsString()
  order_id: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class ProductionProgressFilterDto {
  @ApiProperty({ description: 'Production order ID' })
  @IsString()
  order_id: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class WipResponseDto {
  @ApiProperty()
  wip_id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  order_number: string;

  @ApiProperty()
  line_id: string;

  @ApiProperty()
  line_name: string;

  @ApiProperty()
  part_id: string;

  @ApiProperty()
  part_code: string;

  @ApiPropertyOptional()
  part_description: string | null;

  @ApiProperty()
  dozens_in_wip: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  last_updated: string;
}

export class WipHistoryDto {
  @ApiProperty()
  txn_id: string;

  @ApiProperty()
  txn_reference: string;

  @ApiProperty()
  part_id: string | null;

  @ApiProperty()
  dozens_qty: string;

  @ApiProperty()
  executed_by: string;

  @ApiProperty()
  executed_at: string;

  @ApiPropertyOptional()
  notes: string | null;
}

export class WipBalanceItemDto {
  @ApiProperty()
  part_id: string;

  @ApiProperty()
  part_code: string;

  @ApiPropertyOptional()
  part_description: string | null;

  @ApiProperty()
  dozens_in_wip: string;
}

export class CurrentStageDto {
  @ApiProperty()
  stage_id: string;

  @ApiProperty()
  stage_name: string;

  @ApiProperty()
  stage_code: string;

  @ApiProperty()
  status: string;
}

export class ProductionProgressDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  order_number: string;

  @ApiProperty()
  order_status: string;

  @ApiProperty()
  total_stages: number;

  @ApiProperty()
  completed_stages: number;

  @ApiProperty()
  progress_percent: number;

  @ApiPropertyOptional({ type: CurrentStageDto })
  current_stage: CurrentStageDto | null;

  @ApiProperty({ type: [WipBalanceItemDto] })
  wip_balances: WipBalanceItemDto[];
}

// ─── Pagination wrapper ───────────────────────────────────────────────────────

export class PaginationMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class PaginatedWipResponseDto {
  @ApiProperty({ type: [WipResponseDto] }) items: WipResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}

export class PaginatedWipHistoryDto {
  @ApiProperty({ type: [WipHistoryDto] }) items: WipHistoryDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapWip(wip: WipWithRelations): WipResponseDto {
  return {
    wip_id: wip.wip_id.toString(),
    order_id: wip.order_id.toString(),
    order_number: wip.production_orders.order_number,
    line_id: wip.line_id.toString(),
    line_name: wip.production_lines.line_name,
    part_id: wip.part_id.toString(),
    part_code: wip.model_parts.part_code,
    part_description: wip.model_parts.part_description ?? null,
    dozens_in_wip: wip.dozens_in_wip.toString(),
    version: wip.version.toString(),
    last_updated: wip.last_updated.toISOString(),
  };
}

export function mapWipHistory(txn: inventory_transactions): WipHistoryDto {
  return {
    txn_id: txn.txn_id.toString(),
    txn_reference: txn.txn_reference,
    part_id: txn.part_id?.toString() ?? null,
    dozens_qty: txn.dozens_qty.toString(),
    executed_by: txn.executed_by.toString(),
    executed_at: txn.executed_at.toISOString(),
    notes: txn.notes ?? null,
  };
}
