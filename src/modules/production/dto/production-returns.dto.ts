import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type {
  return_transactions,
  model_parts,
  warehouses,
} from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReturnWithRelations = return_transactions & {
  model_parts: Pick<model_parts, 'part_code' | 'part_description'>;
  warehouses: Pick<warehouses, 'warehouse_name'>;
};

// ─── Command DTO ──────────────────────────────────────────────────────────────

export class CreateReturnDto {
  @ApiProperty({ description: 'Production order ID' })
  @IsString()
  order_id: string;

  @ApiProperty({ description: 'Part ID to return' })
  @IsString()
  part_id: string;

  @ApiProperty({ description: 'Destination warehouse ID' })
  @IsString()
  destination_warehouse_id: string;

  @ApiProperty({ description: 'Dozens to return', minimum: 0.001 })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  dozens_returned: number;
}

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export class ReturnFilterDto {
  @ApiPropertyOptional({ description: 'Filter by production order ID' })
  @IsOptional()
  @IsString()
  order_id?: string;

  @ApiPropertyOptional({ description: 'Filter by part ID' })
  @IsOptional()
  @IsString()
  part_id?: string;
}

export class ReturnHistoryFilterDto {
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

export class ReturnSummaryFilterDto {
  @ApiProperty({ description: 'Production order ID (required)' })
  @IsString()
  order_id: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class ReturnResponseDto {
  @ApiProperty()
  return_id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  part_id: string;

  @ApiProperty()
  part_code: string;

  @ApiProperty({ nullable: true })
  part_description: string | null;

  @ApiProperty()
  destination_warehouse_id: string;

  @ApiProperty()
  warehouse_name: string;

  @ApiProperty()
  dozens_returned: string;

  @ApiProperty()
  returned_by: string;

  @ApiProperty()
  returned_at: string;
}

export class ReturnSummaryItemDto {
  @ApiProperty()
  part_id: string;

  @ApiProperty()
  part_code: string;

  @ApiProperty({ nullable: true })
  part_description: string | null;

  @ApiProperty()
  total_dozens_returned: string;

  @ApiProperty()
  transaction_count: number;
}

export class ReturnSummaryDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  total_dozens_returned: string;

  @ApiProperty()
  transaction_count: number;

  @ApiProperty({ type: [ReturnSummaryItemDto] })
  by_part: ReturnSummaryItemDto[];
}

export class PaginationMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class PaginatedReturnHistoryDto {
  @ApiProperty({ type: [ReturnResponseDto] })
  items: ReturnResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapReturn(r: ReturnWithRelations): ReturnResponseDto {
  return {
    return_id: r.return_id.toString(),
    order_id: r.order_id.toString(),
    part_id: r.part_id.toString(),
    part_code: r.model_parts.part_code,
    part_description: r.model_parts.part_description ?? null,
    destination_warehouse_id: r.destination_warehouse_id.toString(),
    warehouse_name: r.warehouses.warehouse_name,
    dozens_returned: r.dozens_returned.toString(),
    returned_by: r.returned_by.toString(),
    returned_at: r.returned_at.toISOString(),
  };
}
