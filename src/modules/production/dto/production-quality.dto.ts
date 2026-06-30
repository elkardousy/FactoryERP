import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type {
  quality_output_boxes,
  models,
  colors,
  sizes,
  inventory_transactions,
} from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QualityBoxWithRelations = quality_output_boxes & {
  models: Pick<models, 'model_code' | 'model_name'>;
  colors: Pick<colors, 'color_code' | 'color_name'>;
  sizes: Pick<sizes, 'size_code'>;
};

// ─── Command DTO ──────────────────────────────────────────────────────────────

export class RecordQualityOutputDto {
  @ApiProperty({ description: 'Production order ID' })
  @IsString()
  order_id: string;

  @ApiProperty({ description: 'Color ID for this quality output box' })
  @IsString()
  color_id: string;

  @ApiProperty({ description: 'Size ID for this quality output box' })
  @IsString()
  size_id: string;

  @ApiProperty({
    description: 'Dozens that passed quality inspection',
    minimum: 0.001,
  })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  dozens_passed: number;

  @ApiPropertyOptional({ description: 'Inspector notes' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export class QualityFilterDto {
  @ApiPropertyOptional({ description: 'Filter by production order ID' })
  @IsOptional()
  @IsString()
  order_id?: string;

  @ApiPropertyOptional({ description: 'Filter by color ID' })
  @IsOptional()
  @IsString()
  color_id?: string;

  @ApiPropertyOptional({ description: 'Filter by size ID' })
  @IsOptional()
  @IsString()
  size_id?: string;
}

export class QualityHistoryFilterDto {
  @ApiProperty({ description: 'Production order ID (required)' })
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

export class QualitySummaryFilterDto {
  @ApiProperty({ description: 'Production order ID (required)' })
  @IsString()
  order_id: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class QualityBoxResponseDto {
  @ApiProperty()
  box_id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  model_id: string;

  @ApiProperty()
  model_code: string;

  @ApiProperty()
  model_name: string | null;

  @ApiProperty()
  color_id: string;

  @ApiProperty()
  color_code: string;

  @ApiProperty()
  color_name: string;

  @ApiProperty()
  size_id: string;

  @ApiProperty()
  size_code: string;

  @ApiProperty()
  dozens_available: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  last_updated: string;
}

export class QualityHistoryItemDto {
  @ApiProperty()
  txn_id: string;

  @ApiProperty()
  txn_reference: string;

  @ApiPropertyOptional()
  color_id: string | null;

  @ApiPropertyOptional()
  size_id: string | null;

  @ApiProperty()
  dozens_qty: string;

  @ApiProperty()
  executed_by: string;

  @ApiProperty()
  executed_at: string;

  @ApiPropertyOptional()
  notes: string | null;
}

export class QualityBoxSummaryItemDto {
  @ApiProperty()
  color_id: string;

  @ApiProperty()
  color_code: string;

  @ApiProperty()
  color_name: string;

  @ApiProperty()
  size_id: string;

  @ApiProperty()
  size_code: string;

  @ApiProperty()
  dozens_available: string;
}

export class QualitySummaryDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  total_dozens_available: string;

  @ApiProperty()
  box_count: number;

  @ApiProperty({ type: [QualityBoxSummaryItemDto] })
  by_color_size: QualityBoxSummaryItemDto[];
}

export class PaginationMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class PaginatedQualityHistoryDto {
  @ApiProperty({ type: [QualityHistoryItemDto] })
  items: QualityHistoryItemDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapQualityBox(
  box: QualityBoxWithRelations,
): QualityBoxResponseDto {
  return {
    box_id: box.box_id.toString(),
    order_id: box.order_id.toString(),
    model_id: box.model_id.toString(),
    model_code: box.models.model_code,
    model_name: box.models.model_name,
    color_id: box.color_id.toString(),
    color_code: box.colors.color_code,
    color_name: box.colors.color_name,
    size_id: box.size_id.toString(),
    size_code: box.sizes.size_code,
    dozens_available: box.dozens_available.toString(),
    version: box.version.toString(),
    last_updated: box.last_updated.toISOString(),
  };
}

export function mapQualityHistoryItem(
  txn: inventory_transactions,
): QualityHistoryItemDto {
  return {
    txn_id: txn.txn_id.toString(),
    txn_reference: txn.txn_reference,
    color_id: txn.color_id?.toString() ?? null,
    size_id: txn.size_id?.toString() ?? null,
    dozens_qty: txn.dozens_qty.toString(),
    executed_by: txn.executed_by.toString(),
    executed_at: txn.executed_at.toISOString(),
    notes: txn.notes ?? null,
  };
}
