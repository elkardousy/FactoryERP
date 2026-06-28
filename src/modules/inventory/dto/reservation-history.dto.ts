import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReservationHistoryDto {
  @ApiProperty({ example: '1' })
  reservation_id!: string;

  @ApiProperty({ example: '1' })
  bag_id!: string;

  @ApiProperty({ example: '1' })
  order_id!: string;

  @ApiProperty({ example: '5.000' })
  reserved_dozens!: string;

  @ApiProperty({ example: '99' })
  reserved_by!: string;

  @ApiProperty({ example: '2026-06-28T10:00:00.000Z' })
  reserved_at!: string;

  @ApiPropertyOptional({ example: '2026-06-28T12:00:00.000Z' })
  released_at!: string | null;

  @ApiProperty({ example: 'RELEASED' })
  status!: string;
}
