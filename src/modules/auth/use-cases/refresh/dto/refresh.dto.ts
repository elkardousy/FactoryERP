import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Composite refresh token returned by login: "<sessionId>:<rawToken>"',
    example: '42:550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
