import { Injectable } from '@nestjs/common';
import { CycleCountService } from '../../services/cycle-count.service';
import type { CycleCountDto } from '../../dto/cycle-count.dto';
import type { ListCycleCountsQuery } from './queries/list-cycle-counts.query';

@Injectable()
export class ListCycleCountsUseCase {
  constructor(private readonly cycleCountService: CycleCountService) {}

  async execute(query: ListCycleCountsQuery): Promise<CycleCountDto[]> {
    return this.cycleCountService.listCycleCounts(query);
  }
}
