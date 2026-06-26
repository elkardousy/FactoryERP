import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

export class CreateCustomerDto {
  @ApiProperty({ example: 'CUST-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  customer_code!: string;

  @ApiProperty({ example: 'Acme Apparel Ltd.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customer_name!: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class CustomerFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'acme' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
