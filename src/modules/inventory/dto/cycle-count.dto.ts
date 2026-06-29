import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CycleCountDto {
  @ApiProperty() investigation_id: string;
  @ApiProperty() investigation_number: string;
  @ApiPropertyOptional() warehouse_id: string | null;
  @ApiPropertyOptional() model_id: string | null;
  @ApiPropertyOptional() part_id: string | null;
  @ApiProperty() description: string;
  @ApiProperty() closure_status: string;
  @ApiPropertyOptional() root_cause_category: string | null;
  @ApiPropertyOptional() corrective_action: string | null;
  @ApiPropertyOptional() preventive_action: string | null;
  @ApiProperty() reported_by: string;
  @ApiProperty() reported_at: string;
  @ApiPropertyOptional() closed_by: string | null;
  @ApiPropertyOptional() closed_at: string | null;
}

export class OpenCycleCountResultDto {
  @ApiProperty() has_variance: boolean;
  @ApiProperty() system_dozens: string;
  @ApiProperty() actual_dozens: string;
  @ApiProperty() variance_dozens: string;
  @ApiPropertyOptional({ type: CycleCountDto }) investigation?: CycleCountDto;
}
