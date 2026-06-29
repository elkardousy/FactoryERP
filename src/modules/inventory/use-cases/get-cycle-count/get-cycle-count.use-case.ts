import { Injectable } from '@nestjs/common';
import { CycleCountService } from '../../services/cycle-count.service';
import type { CycleCountDto } from '../../dto/cycle-count.dto';
import type { GetCycleCountQuery } from './queries/get-cycle-count.query';

@Injectable()
export class GetCycleCountUseCase {
  constructor(private readonly cycleCountService: CycleCountService) {}

  async execute(query: GetCycleCountQuery): Promise<CycleCountDto> {
    return this.cycleCountService.getCycleCount(query);
  }
}
