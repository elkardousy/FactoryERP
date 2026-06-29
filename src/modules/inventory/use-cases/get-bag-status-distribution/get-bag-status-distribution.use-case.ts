import { Injectable } from '@nestjs/common';
import { InventoryPerformanceService } from '../../services/inventory-performance.service';
import type { BagStatusDistributionDto } from '../../dto/inventory-performance.dto';

@Injectable()
export class GetBagStatusDistributionUseCase {
  constructor(private readonly perfService: InventoryPerformanceService) {}

  async execute(): Promise<BagStatusDistributionDto[]> {
    return this.perfService.getBagStatusDistribution();
  }
}
