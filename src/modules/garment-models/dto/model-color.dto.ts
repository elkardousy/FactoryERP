import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AssignModelColorDto {
  @ApiProperty({ example: 1, description: 'Color ID to assign to this model' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  color_id!: number;
}

export class AssignModelSizeDto {
  @ApiProperty({ example: 1, description: 'Size ID to assign to this model' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size_id!: number;
}
