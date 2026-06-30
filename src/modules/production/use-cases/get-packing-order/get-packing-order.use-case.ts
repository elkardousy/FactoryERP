import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import {
  mapPackingOrder,
  type PackingOrderResponseDto,
} from '../../dto/production-packing.dto';

@Injectable()
export class GetPackingOrderUseCase {
  constructor(private readonly packingRepo: ProductionPackingRepository) {}

  async execute(packingOrderId: string): Promise<PackingOrderResponseDto> {
    const packingOrder = await this.packingRepo.findPackingOrderById(
      BigInt(packingOrderId),
    );
    if (!packingOrder) {
      throw new NotFoundException(`Packing order ${packingOrderId} not found`);
    }
    return mapPackingOrder(packingOrder);
  }
}
