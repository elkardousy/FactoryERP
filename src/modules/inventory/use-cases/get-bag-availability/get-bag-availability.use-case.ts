import { Injectable } from '@nestjs/common';
import { InventoryAvailabilityService } from '../../services/inventory-availability.service';
import { BagAvailabilityDto } from '../../dto/bag-availability.dto';
import type { GetBagAvailabilityQuery } from './queries/get-bag-availability.query';

@Injectable()
export class GetBagAvailabilityUseCase {
  constructor(
    private readonly availabilityService: InventoryAvailabilityService,
  ) {}

  async execute(query: GetBagAvailabilityQuery): Promise<BagAvailabilityDto> {
    return this.availabilityService.getBagAvailability(query.bagId);
  }
}
