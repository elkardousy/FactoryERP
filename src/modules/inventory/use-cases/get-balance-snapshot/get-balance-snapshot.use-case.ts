import { Injectable } from '@nestjs/common';
import { InventoryBalanceService } from '../../services/inventory-balance.service';
import { BalanceSnapshotDto } from '../../dto/balance-snapshot.dto';
import type { GetBalanceSnapshotQuery } from './queries/get-balance-snapshot.query';

@Injectable()
export class GetBalanceSnapshotUseCase {
  constructor(private readonly balanceService: InventoryBalanceService) {}

  async execute(query: GetBalanceSnapshotQuery): Promise<BalanceSnapshotDto> {
    return this.balanceService.getSnapshot(
      query.warehouseId,
      query.modelId,
      query.partId,
    );
  }
}
