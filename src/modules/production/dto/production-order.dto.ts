import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OrderStatusEnum,
  ReleaseTypeEnum,
  type production_orders,
  type production_order_parts,
} from '@prisma/client';

export class CreateProductionOrderDto {
  @ApiProperty({ description: 'Garment model ID' })
  @IsString()
  @IsNotEmpty()
  model_id: string;

  @ApiProperty({ description: 'Production line ID' })
  @IsString()
  @IsNotEmpty()
  line_id: string;

  @ApiProperty({
    enum: ReleaseTypeEnum,
    description: 'FULL or PARTIAL release',
  })
  @IsEnum(ReleaseTypeEnum)
  release_type: ReleaseTypeEnum;

  @ApiPropertyOptional({
    description: 'CMO line ID — required when release_type is FULL',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cmo_line_id?: string;

  @ApiPropertyOptional({ description: 'Target output dozens' })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  target_dozens?: number;

  @ApiPropertyOptional({ description: 'Free-text notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'model_parts IDs to include (minimum 1)',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  part_ids: string[];
}

export class UpdateProductionOrderDto {
  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Updated target dozens' })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  target_dozens?: number;
}

export class ProductionOrderFilterDto {
  @ApiPropertyOptional({ enum: OrderStatusEnum })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @ApiPropertyOptional({ description: 'Production line ID filter' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  line_id?: string;

  @ApiPropertyOptional({ description: 'Garment model ID filter' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  model_id?: string;
}

export class ProductionOrderPartResponseDto {
  @ApiProperty()
  order_part_id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  part_id: string;

  @ApiProperty({ enum: ['PENDING', 'RELEASED', 'COMPLETE', 'RETURNED'] })
  status: string;

  @ApiProperty({ nullable: true })
  released_at: string | null;
}

export class ProductionOrderResponseDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  order_number: string;

  @ApiProperty()
  model_id: string;

  @ApiProperty()
  line_id: string;

  @ApiProperty({ enum: ReleaseTypeEnum })
  release_type: string;

  @ApiProperty({ enum: OrderStatusEnum })
  status: string;

  @ApiProperty({ nullable: true })
  target_dozens: string | null;

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty()
  created_by: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty({ nullable: true })
  closed_by: string | null;

  @ApiProperty({ nullable: true })
  closed_at: string | null;

  @ApiProperty({ nullable: true })
  cmo_line_id: string | null;

  @ApiProperty({ type: [ProductionOrderPartResponseDto] })
  parts: ProductionOrderPartResponseDto[];
}

export class ProductionOrderSummaryDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  order_number: string;

  @ApiProperty()
  model_id: string;

  @ApiProperty()
  line_id: string;

  @ApiProperty({ enum: ReleaseTypeEnum })
  release_type: string;

  @ApiProperty({ enum: OrderStatusEnum })
  status: string;

  @ApiProperty({ nullable: true })
  target_dozens: string | null;

  @ApiProperty()
  created_at: string;

  @ApiProperty({ nullable: true })
  cmo_line_id: string | null;
}

type OrderWithParts = production_orders & {
  production_order_parts: production_order_parts[];
};

export function mapPart(
  part: production_order_parts,
): ProductionOrderPartResponseDto {
  return {
    order_part_id: part.order_part_id.toString(),
    order_id: part.order_id.toString(),
    part_id: part.part_id.toString(),
    status: part.status,
    released_at: part.released_at?.toISOString() ?? null,
  };
}

export function mapOrder(order: OrderWithParts): ProductionOrderResponseDto {
  return {
    order_id: order.order_id.toString(),
    order_number: order.order_number,
    model_id: order.model_id.toString(),
    line_id: order.line_id.toString(),
    release_type: order.release_type,
    status: order.status,
    target_dozens: order.target_dozens?.toString() ?? null,
    notes: order.notes ?? null,
    created_by: order.created_by.toString(),
    created_at: order.created_at.toISOString(),
    closed_by: order.closed_by?.toString() ?? null,
    closed_at: order.closed_at?.toISOString() ?? null,
    cmo_line_id: order.cmo_line_id?.toString() ?? null,
    parts: order.production_order_parts.map(mapPart),
  };
}

export function mapOrderSummary(
  order: production_orders,
): ProductionOrderSummaryDto {
  return {
    order_id: order.order_id.toString(),
    order_number: order.order_number,
    model_id: order.model_id.toString(),
    line_id: order.line_id.toString(),
    release_type: order.release_type,
    status: order.status,
    target_dozens: order.target_dozens?.toString() ?? null,
    created_at: order.created_at.toISOString(),
    cmo_line_id: order.cmo_line_id?.toString() ?? null,
  };
}
