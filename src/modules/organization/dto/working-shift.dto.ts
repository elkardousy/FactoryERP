import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateWorkingShiftDto {
  @ApiProperty({ example: 'MORNING' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shift_code!: string;

  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  shift_name!: string;

  @ApiProperty({
    example: '08:00',
    description: 'Time in HH:MM or HH:MM:SS format',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'start_time must be in HH:MM or HH:MM:SS format',
  })
  start_time!: string;

  @ApiProperty({
    example: '16:00',
    description: 'Time in HH:MM or HH:MM:SS format',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'end_time must be in HH:MM or HH:MM:SS format',
  })
  end_time!: string;
}

export class UpdateWorkingShiftDto extends PartialType(CreateWorkingShiftDto) {}

export class WorkingShiftFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'morning' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
