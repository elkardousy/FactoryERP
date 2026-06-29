import { Injectable } from '@nestjs/common';
import { CycleCountService } from '../../services/cycle-count.service';
import type { OpenCycleCountResultDto } from '../../dto/cycle-count.dto';
import type { OpenCycleCountCommand } from './commands/open-cycle-count.command';

@Injectable()
export class OpenCycleCountUseCase {
  constructor(private readonly cycleCountService: CycleCountService) {}

  async execute(cmd: OpenCycleCountCommand): Promise<OpenCycleCountResultDto> {
    return this.cycleCountService.openCycleCount(cmd);
  }
}
