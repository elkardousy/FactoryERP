import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class ReservationRequestDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  bag_id!: bigint;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  order_id!: bigint;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  reserved_dozens!: number;
}
