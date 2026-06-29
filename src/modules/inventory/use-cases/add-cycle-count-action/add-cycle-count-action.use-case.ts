import { Injectable } from '@nestjs/common';
import { CycleCountService } from '../../services/cycle-count.service';
import type { AddCycleCountActionCommand } from './commands/add-cycle-count-action.command';

@Injectable()
export class AddCycleCountActionUseCase {
  constructor(private readonly cycleCountService: CycleCountService) {}

  async execute(
    cmd: AddCycleCountActionCommand,
  ): Promise<{ action_id: string; performed_at: string }> {
    return this.cycleCountService.addAction(cmd);
  }
}
