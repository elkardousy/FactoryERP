import { Injectable } from '@nestjs/common';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import {
  mapPackingOrder,
  type PackingOrderFilterDto,
  type PackingOrderResponseDto,
} from '../../dto/production-packing.dto';

@Injectable()
export class ListPackingOrdersUseCase {
  constructor(private readonly packingRepo: ProductionPackingRepository) {}

  async execute(
    filter: PackingOrderFilterDto,
  ): Promise<PackingOrderResponseDto[]> {
    const orders = await this.packingRepo.findPackingOrders({
      production_order_id: filter.production_order_id
        ? BigInt(filter.production_order_id)
        : undefined,
      status: filter.status,
    });
    return orders.map(mapPackingOrder);
  }
}
