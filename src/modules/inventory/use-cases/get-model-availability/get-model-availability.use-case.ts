import { Injectable } from '@nestjs/common';
import { InventoryAvailabilityService } from '../../services/inventory-availability.service';
import { LedgerAvailabilityDto } from '../../dto/ledger-availability.dto';
import type { GetModelAvailabilityQuery } from './queries/get-model-availability.query';

@Injectable()
export class GetModelAvailabilityUseCase {
  constructor(
    private readonly availabilityService: InventoryAvailabilityService,
  ) {}

  async execute(
    query: GetModelAvailabilityQuery,
  ): Promise<LedgerAvailabilityDto[]> {
    return this.availabilityService.getModelAvailability(query.modelId);
  }
}
