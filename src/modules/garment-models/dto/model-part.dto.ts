import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateModelPartDto {
  @ApiProperty({
    example: 'FRT',
    description: 'Part code unique within the model',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  part_code!: string;

  @ApiPropertyOptional({ example: 'Front Panel' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  part_description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateModelPartDto extends PartialType(CreateModelPartDto) {}
