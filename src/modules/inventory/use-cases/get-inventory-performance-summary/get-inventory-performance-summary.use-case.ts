import { Injectable } from '@nestjs/common';
import { InventoryPerformanceService } from '../../services/inventory-performance.service';
import type { InventoryPerformanceSummaryDto } from '../../dto/inventory-performance.dto';

@Injectable()
export class GetInventoryPerformanceSummaryUseCase {
  constructor(private readonly perfService: InventoryPerformanceService) {}

  async execute(): Promise<InventoryPerformanceSummaryDto> {
    return this.perfService.getSummary();
  }
}
