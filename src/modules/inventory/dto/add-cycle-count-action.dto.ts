import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddCycleCountActionDto {
  @ApiProperty({
    example: 'Recount confirmed variance. Escalating to supervisor.',
  })
  @IsString()
  @IsNotEmpty()
  action_note: string;
}
