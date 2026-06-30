import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ScrapTypeEnum,
  IncompleteReasonEnum,
  StageStatusEnum,
} from '@prisma/client';
import type {
  production_stage_logs,
  production_stages,
  scrap_records,
  incomplete_item_records,
} from '@prisma/client';

// ─── Input DTOs ──────────────────────────────────────────────────────────────

export class ScrapRecordInputDto {
  @ApiProperty({ enum: ScrapTypeEnum })
  @IsEnum(ScrapTypeEnum)
  scrap_type: ScrapTypeEnum;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  dozens_scrapped: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  size_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class IncompleteRecordInputDto {
  @ApiProperty({ enum: IncompleteReasonEnum })
  @IsEnum(IncompleteReasonEnum)
  reason: IncompleteReasonEnum;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  dozens_incomplete: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class RecordStageOutputDto {
  @ApiProperty({
    description: 'Dozens that passed through this stage successfully',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  output_dozens: number;

  @ApiProperty({
    type: [ScrapRecordInputDto],
    description: 'Required if scrap > 0',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScrapRecordInputDto)
  scrap_records: ScrapRecordInputDto[];

  @ApiProperty({
    type: [IncompleteRecordInputDto],
    description: 'Required if incomplete > 0',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncompleteRecordInputDto)
  incomplete_records: IncompleteRecordInputDto[];
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class ScrapRecordResponseDto {
  @ApiProperty()
  scrap_id: string;

  @ApiProperty()
  log_id: string;

  @ApiProperty({ enum: ScrapTypeEnum })
  scrap_type: ScrapTypeEnum;

  @ApiProperty()
  dozens_scrapped: string;

  @ApiPropertyOptional()
  color_id: string | null;

  @ApiPropertyOptional()
  size_id: string | null;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiProperty()
  recorded_at: string;
}

export class IncompleteRecordResponseDto {
  @ApiProperty()
  incomplete_id: string;

  @ApiProperty()
  log_id: string;

  @ApiProperty({ enum: IncompleteReasonEnum })
  reason_type: IncompleteReasonEnum;

  @ApiProperty()
  dozens_incomplete: string;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiProperty()
  recorded_at: string;
}

export class StageLogSummaryDto {
  @ApiProperty()
  log_id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  stage_id: string;

  @ApiProperty()
  stage_name: string;

  @ApiProperty()
  stage_code: string;

  @ApiProperty()
  sequence_order: number;

  @ApiProperty({ enum: StageStatusEnum })
  status: StageStatusEnum;

  @ApiPropertyOptional()
  input_dozens: string | null;

  @ApiPropertyOptional()
  output_dozens: string | null;

  @ApiPropertyOptional()
  scrap_dozens: string | null;

  @ApiPropertyOptional()
  incomplete_dozens: string | null;

  @ApiPropertyOptional()
  started_at: string | null;

  @ApiPropertyOptional()
  completed_at: string | null;
}

export class StageLogDetailDto extends StageLogSummaryDto {
  @ApiProperty({ type: [ScrapRecordResponseDto] })
  scrap_records: ScrapRecordResponseDto[];

  @ApiProperty({ type: [IncompleteRecordResponseDto] })
  incomplete_records: IncompleteRecordResponseDto[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapScrapRecord(r: scrap_records): ScrapRecordResponseDto {
  return {
    scrap_id: r.scrap_id.toString(),
    log_id: r.log_id.toString(),
    scrap_type: r.scrap_type,
    dozens_scrapped: r.dozens_scrapped.toString(),
    color_id: r.color_id?.toString() ?? null,
    size_id: r.size_id?.toString() ?? null,
    notes: r.notes ?? null,
    recorded_at: r.recorded_at.toISOString(),
  };
}

export function mapIncompleteRecord(
  r: incomplete_item_records,
): IncompleteRecordResponseDto {
  return {
    incomplete_id: r.incomplete_id.toString(),
    log_id: r.log_id.toString(),
    reason_type: r.reason_type,
    dozens_incomplete: r.dozens_incomplete.toString(),
    notes: r.notes ?? null,
    recorded_at: r.recorded_at.toISOString(),
  };
}

export type StageLogWithStage = production_stage_logs & {
  production_stages: production_stages;
};

export type StageLogWithDetails = production_stage_logs & {
  production_stages: production_stages;
  scrap_records: scrap_records[];
  incomplete_item_records: incomplete_item_records[];
};

export function mapStageLogSummary(log: StageLogWithStage): StageLogSummaryDto {
  return {
    log_id: log.log_id.toString(),
    order_id: log.order_id.toString(),
    stage_id: log.stage_id.toString(),
    stage_name: log.production_stages.stage_name,
    stage_code: log.production_stages.stage_code,
    sequence_order: log.production_stages.sequence_order,
    status: log.status,
    input_dozens: log.input_dozens?.toString() ?? null,
    output_dozens: log.output_dozens?.toString() ?? null,
    scrap_dozens: log.scrap_dozens != null ? log.scrap_dozens.toString() : null,
    incomplete_dozens:
      log.incomplete_dozens != null ? log.incomplete_dozens.toString() : null,
    started_at: log.started_at?.toISOString() ?? null,
    completed_at: log.completed_at?.toISOString() ?? null,
  };
}

export function mapStageLogDetail(log: StageLogWithDetails): StageLogDetailDto {
  return {
    ...mapStageLogSummary(log),
    scrap_records: log.scrap_records.map(mapScrapRecord),
    incomplete_records: log.incomplete_item_records.map(mapIncompleteRecord),
  };
}
