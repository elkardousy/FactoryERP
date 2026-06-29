import { Injectable } from '@nestjs/common';
import { InventoryAvailabilityService } from '../../services/inventory-availability.service';
import { LedgerAvailabilityDto } from '../../dto/ledger-availability.dto';
import type { GetWarehouseAvailabilityQuery } from './queries/get-warehouse-availability.query';

@Injectable()
export class GetWarehouseAvailabilityUseCase {
  constructor(
    private readonly availabilityService: InventoryAvailabilityService,
  ) {}

  async execute(
    query: GetWarehouseAvailabilityQuery,
  ): Promise<LedgerAvailabilityDto[]> {
    return this.availabilityService.getWarehouseAvailability(query.warehouseId);
  }
}
