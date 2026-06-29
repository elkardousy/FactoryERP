import { Injectable } from '@nestjs/common';
import { InventoryBalanceService } from '../../services/inventory-balance.service';
import { ModelBalanceSummaryDto } from '../../dto/model-balance-summary.dto';
import type { GetModelBalanceSummaryQuery } from './queries/get-model-balance-summary.query';

@Injectable()
export class GetModelBalanceSummaryUseCase {
  constructor(private readonly balanceService: InventoryBalanceService) {}

  async execute(
    query: GetModelBalanceSummaryQuery,
  ): Promise<ModelBalanceSummaryDto> {
    return this.balanceService.getModelSummary(query.modelId);
  }
}
