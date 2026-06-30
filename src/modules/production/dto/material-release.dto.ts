import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { release_groups, release_group_lines } from '@prisma/client';

export class CreateReleaseGroupLineDto {
  @ApiProperty({ description: 'Physical bag ID to release' })
  @IsString()
  @IsNotEmpty()
  bag_id: string;

  @ApiProperty({
    description: 'Dozens to release — must equal the full reservation amount',
  })
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  dozens_to_release: number;

  @ApiProperty({
    description: 'Source warehouse ID (must match bag current location)',
  })
  @IsString()
  @IsNotEmpty()
  source_warehouse_id: string;
}

export class CreateReleaseGroupDto {
  @ApiProperty({
    type: [CreateReleaseGroupLineDto],
    description: 'One entry per physical bag to release into production',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReleaseGroupLineDto)
  lines: CreateReleaseGroupLineDto[];
}

export class ReleaseGroupLineResponseDto {
  @ApiProperty()
  release_line_id: string;

  @ApiProperty()
  release_group_id: string;

  @ApiProperty()
  order_part_id: string;

  @ApiProperty()
  source_warehouse_id: string;

  @ApiProperty()
  dozens_released: string;
}

export class ReleaseGroupResponseDto {
  @ApiProperty()
  release_group_id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  group_number: number;

  @ApiProperty()
  released_by: string;

  @ApiProperty()
  released_at: string;

  @ApiProperty({ type: [ReleaseGroupLineResponseDto] })
  lines: ReleaseGroupLineResponseDto[];
}

export class ReleaseGroupSummaryDto {
  @ApiProperty()
  release_group_id: string;

  @ApiProperty()
  order_id: string;

  @ApiProperty()
  group_number: number;

  @ApiProperty()
  released_by: string;

  @ApiProperty()
  released_at: string;

  @ApiProperty()
  line_count: number;
}

type GroupWithLines = release_groups & {
  release_group_lines: release_group_lines[];
};

export function mapReleaseGroupLine(
  line: release_group_lines,
): ReleaseGroupLineResponseDto {
  return {
    release_line_id: line.release_line_id.toString(),
    release_group_id: line.release_group_id.toString(),
    order_part_id: line.order_part_id.toString(),
    source_warehouse_id: line.source_warehouse_id.toString(),
    dozens_released: line.dozens_released.toString(),
  };
}

export function mapReleaseGroup(
  group: GroupWithLines,
): ReleaseGroupResponseDto {
  return {
    release_group_id: group.release_group_id.toString(),
    order_id: group.order_id.toString(),
    group_number: group.group_number,
    released_by: group.released_by.toString(),
    released_at: group.released_at.toISOString(),
    lines: group.release_group_lines.map(mapReleaseGroupLine),
  };
}

export function mapReleaseGroupSummary(
  group: release_groups,
  lineCount: number,
): ReleaseGroupSummaryDto {
  return {
    release_group_id: group.release_group_id.toString(),
    order_id: group.order_id.toString(),
    group_number: group.group_number,
    released_by: group.released_by.toString(),
    released_at: group.released_at.toISOString(),
    line_count: lineCount,
  };
}
