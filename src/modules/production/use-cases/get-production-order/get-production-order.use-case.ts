import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import {
  mapOrder,
  type ProductionOrderResponseDto,
} from '../../dto/production-order.dto';

@Injectable()
export class GetProductionOrderUseCase {
  constructor(private readonly ordersRepo: ProductionOrdersRepository) {}

  async execute(orderId: string): Promise<ProductionOrderResponseDto> {
    const order = await this.ordersRepo.findById(BigInt(orderId));
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }
    return mapOrder(order);
  }
}
