import { Injectable } from '@nestjs/common';
import { ProductionFinishedGoodsRepository } from '../../repositories/production-finished-goods.repository';
import {
  mapFGBag,
  type FinishedGoodsBagResponseDto,
  type FinishedGoodsFilterDto,
} from '../../dto/production-finished-goods.dto';

@Injectable()
export class ListFinishedGoodsUseCase {
  constructor(private readonly fgRepo: ProductionFinishedGoodsRepository) {}

  async execute(
    filter: FinishedGoodsFilterDto,
  ): Promise<FinishedGoodsBagResponseDto[]> {
    const bags = await this.fgRepo.findFGBags({
      model_id: filter.model_id ? BigInt(filter.model_id) : undefined,
      customer_id: filter.customer_id ? BigInt(filter.customer_id) : undefined,
      warehouse_id: filter.warehouse_id
        ? BigInt(filter.warehouse_id)
        : undefined,
    });
    return bags.map(mapFGBag);
  }
}
