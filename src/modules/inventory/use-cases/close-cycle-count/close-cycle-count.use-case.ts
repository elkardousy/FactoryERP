import { Injectable } from '@nestjs/common';
import { CycleCountService } from '../../services/cycle-count.service';
import type { CycleCountDto } from '../../dto/cycle-count.dto';
import type { CloseCycleCountCommand } from './commands/close-cycle-count.command';

@Injectable()
export class CloseCycleCountUseCase {
  constructor(private readonly cycleCountService: CycleCountService) {}

  async execute(cmd: CloseCycleCountCommand): Promise<CycleCountDto> {
    return this.cycleCountService.closeCycleCount(cmd);
  }
}
