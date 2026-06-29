import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateWarehouseLocationDto {
  @ApiProperty({ description: 'Warehouse ID (BigInt as string)', example: '1' })
  @IsNotEmpty()
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Zone code', example: 'A' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  zone_code: string;

  @ApiPropertyOptional({ description: 'Rack code', example: 'R1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rack_code?: string;

  @ApiPropertyOptional({ description: 'Shelf code', example: 'S2' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  shelf_code?: string;

  @ApiPropertyOptional({ description: 'Bin code', example: 'B3' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bin_code?: string;

  @ApiPropertyOptional({ description: 'Max capacity in dozens', example: 100 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  capacity_dozens?: number;
}

export class UpdateLocationStatusDto {
  @ApiProperty({ description: 'Set active or inactive', example: true })
  @IsBoolean()
  is_active: boolean;
}

export class LocationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by warehouse ID', example: '1' })
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @ApiPropertyOptional({ description: 'Filter by zone code', example: 'A' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zone_code?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;
}

export class ValidateLocationQueryDto {
  @ApiPropertyOptional({
    description: 'Required dozens to check capacity',
    example: '10.5',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  required_dozens?: number;
}

export class LocationResponseDto {
  location_id: string;
  warehouse_id: string;
  zone_code: string;
  rack_code: string | null;
  shelf_code: string | null;
  bin_code: string | null;
  location_code: string;
  is_active: boolean;
  capacity_dozens: string | null;
  created_at: string;
}

export class ZoneGroupDto {
  zone_code: string;
  racks: RackGroupDto[];
  zone_only_locations: LocationResponseDto[];
}

export class RackGroupDto {
  rack_code: string;
  shelves: ShelfGroupDto[];
  rack_only_locations: LocationResponseDto[];
}

export class ShelfGroupDto {
  shelf_code: string;
  bins: LocationResponseDto[];
  shelf_only_locations: LocationResponseDto[];
}

export class WarehouseHierarchyDto {
  warehouse_id: string;
  zones: ZoneGroupDto[];
  total_locations: number;
  active_locations: number;
}
