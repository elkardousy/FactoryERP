import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RootCauseCategoryEnum } from '@prisma/client';

export class CloseCycleCountDto {
  @ApiProperty({ enum: RootCauseCategoryEnum })
  @IsEnum(RootCauseCategoryEnum)
  root_cause_category: RootCauseCategoryEnum;

  @ApiPropertyOptional({
    example: 'Applied correction: recount and adjustment posted.',
  })
  @IsOptional()
  @IsString()
  corrective_action?: string;

  @ApiPropertyOptional({ example: 'Monthly cycle count schedule established.' })
  @IsOptional()
  @IsString()
  preventive_action?: string;
}
