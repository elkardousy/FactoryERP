import { Injectable } from '@nestjs/common';
import { InventoryBalanceService } from '../../services/inventory-balance.service';
import { WarehouseBalanceSummaryDto } from '../../dto/warehouse-balance-summary.dto';
import type { GetWarehouseBalanceSummaryQuery } from './queries/get-warehouse-balance-summary.query';

@Injectable()
export class GetWarehouseBalanceSummaryUseCase {
  constructor(private readonly balanceService: InventoryBalanceService) {}

  async execute(
    query: GetWarehouseBalanceSummaryQuery,
  ): Promise<WarehouseBalanceSummaryDto> {
    return this.balanceService.getWarehouseSummary(query.warehouseId);
  }
}
