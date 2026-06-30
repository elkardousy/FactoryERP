import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { packing_orders, packing_verifications } from '@prisma/client';

// ─── Relation Types ───────────────────────────────────────────────────────────

export type PackingOrderWithRelations = packing_orders & {
  packing_verifications: packing_verifications[];
};

// ─── Command DTOs ─────────────────────────────────────────────────────────────

export class CreatePackingOrderDto {
  @IsString()
  production_order_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddAssemblyLineDto {
  @IsString()
  quality_box_id: string;

  @IsString()
  color_id: string;

  @IsString()
  size_id: string;

  @IsString()
  pattern_line_id: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pieces_consumed: number;
}

export class AddAssemblyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddAssemblyLineDto)
  lines: AddAssemblyLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyPackingDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  physical_count_dozens: number;

  @IsOptional()
  @IsString()
  variance_notes?: string;
}

// ─── Query DTOs ───────────────────────────────────────────────────────────────

export class PackingOrderFilterDto {
  @IsOptional()
  @IsString()
  production_order_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class PackingHistoryFilterDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class PackingSummaryFilterDto {
  @IsString()
  production_order_id: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class PackingVerificationResponseDto {
  verification_id: string;
  packing_order_id: string;
  system_dozens: string;
  physical_count_dozens: string;
  variance_dozens: string | null;
  variance_accepted: boolean;
  variance_notes: string | null;
  verified_by: string;
  verified_at: string;
}

export class PackingOrderResponseDto {
  packing_order_id: string;
  packing_order_no: string;
  production_order_id: string;
  pattern_id: string;
  target_dozens: string;
  assembled_dozens: string;
  verified_dozens: string | null;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  started_by: string | null;
  started_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  posted_by: string | null;
  posted_at: string | null;
  verification: PackingVerificationResponseDto | null;
}

export class PackingSummaryDto {
  packing_order_id: string;
  packing_order_no: string;
  production_order_id: string;
  status: string;
  target_dozens: string;
  assembled_dozens: string;
  verified_dozens: string | null;
  verification: PackingVerificationResponseDto | null;
}

export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class PaginatedPackingHistoryDto {
  items: PackingOrderResponseDto[];
  meta: PaginationMetaDto;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapPackingVerification(
  v: packing_verifications,
): PackingVerificationResponseDto {
  return {
    verification_id: v.verification_id.toString(),
    packing_order_id: v.packing_order_id.toString(),
    system_dozens: v.system_dozens.toString(),
    physical_count_dozens: v.physical_count_dozens.toString(),
    variance_dozens: v.variance_dozens?.toString() ?? null,
    variance_accepted: v.variance_accepted,
    variance_notes: v.variance_notes ?? null,
    verified_by: v.verified_by.toString(),
    verified_at: v.verified_at.toISOString(),
  };
}

export function mapPackingOrder(
  p: PackingOrderWithRelations,
): PackingOrderResponseDto {
  const verification = p.packing_verifications?.[0] ?? null;
  return {
    packing_order_id: p.packing_order_id.toString(),
    packing_order_no: p.packing_order_no,
    production_order_id: p.production_order_id.toString(),
    pattern_id: p.pattern_id.toString(),
    target_dozens: p.target_dozens.toString(),
    assembled_dozens: p.assembled_dozens.toString(),
    verified_dozens: p.verified_dozens?.toString() ?? null,
    status: p.status,
    notes: p.notes ?? null,
    created_by: p.created_by.toString(),
    created_at: p.created_at.toISOString(),
    started_by: p.started_by?.toString() ?? null,
    started_at: p.started_at?.toISOString() ?? null,
    verified_by: p.verified_by?.toString() ?? null,
    verified_at: p.verified_at?.toISOString() ?? null,
    posted_by: p.posted_by?.toString() ?? null,
    posted_at: p.posted_at?.toISOString() ?? null,
    verification: verification ? mapPackingVerification(verification) : null,
  };
}
