import { Injectable } from '@nestjs/common';
import { ProductionFinishedGoodsRepository } from '../../repositories/production-finished-goods.repository';
import {
  mapFGBag,
  type FinishedGoodsSummaryDto,
  type FinishedGoodsSummaryFilterDto,
} from '../../dto/production-finished-goods.dto';

@Injectable()
export class GetFinishedGoodsSummaryUseCase {
  constructor(private readonly fgRepo: ProductionFinishedGoodsRepository) {}

  async execute(
    filter: FinishedGoodsSummaryFilterDto,
  ): Promise<FinishedGoodsSummaryDto> {
    const modelId = BigInt(filter.model_id);
    const bags = await this.fgRepo.findFGBagsByModelId(modelId);

    const totalDozens = bags.reduce((sum, b) => sum + Number(b.dozens_qty), 0);

    return {
      model_id: filter.model_id,
      total_bags: bags.length,
      total_dozens: totalDozens,
      bags: bags.map(mapFGBag),
    };
  }
}
