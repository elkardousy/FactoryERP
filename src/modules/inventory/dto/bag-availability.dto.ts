import { ApiProperty } from '@nestjs/swagger';

export class BagAvailabilityDto {
  @ApiProperty({ description: 'Physical bag ID' })
  bag_id: string;

  @ApiProperty({ description: 'Physical bag code' })
  bag_code: string;

  @ApiProperty({ description: 'Current dozens on the bag' })
  current_dozens: string;

  @ApiProperty({ description: 'Dozens held by active reservations' })
  reserved_dozens: string;

  @ApiProperty({ description: 'Dozens free to reserve (current - reserved)' })
  free_dozens: string;

  @ApiProperty({ description: 'Current bag status' })
  status: string;
}
