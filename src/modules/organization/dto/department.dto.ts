import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'PROD' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  dept_code!: string;

  @ApiProperty({ example: 'Production Department' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dept_name!: string;

  @ApiPropertyOptional({ example: 'Responsible for all production activities' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Parent department ID for hierarchy',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parent_department_id?: number;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class DepartmentFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'prod' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
