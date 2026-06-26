import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateColorDto {
  @ApiProperty({ example: 'RED' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  color_code!: string;

  @ApiProperty({ example: 'Red' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  color_name!: string;

  @ApiPropertyOptional({
    example: '#FF0000',
    description: 'Hex color value including #',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'hex_value must be a valid 6-digit hex color (e.g. #FF0000)',
  })
  hex_value?: string;
}

export class UpdateColorDto extends PartialType(CreateColorDto) {}

export class ColorFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'red' })
  @IsOptional()
  @IsString()
  search?: string;
}
