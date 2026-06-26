import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateSupplierDto {
  @ApiProperty({ example: 'SUP-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  supplier_code!: string;

  @ApiProperty({ example: 'Global Fabrics Co.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  supplier_name!: string;

  @ApiPropertyOptional({
    example: {
      phone: '+1-555-0100',
      email: 'info@globalfabrics.com',
      address: '123 Textile Ave',
    },
  })
  @IsOptional()
  @IsObject()
  contact_info?: Record<string, unknown>;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

export class SupplierFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'global' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
