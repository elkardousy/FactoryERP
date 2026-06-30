import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionFinishedGoodsRepository } from '../../repositories/production-finished-goods.repository';
import {
  mapFGBag,
  type FinishedGoodsBagResponseDto,
} from '../../dto/production-finished-goods.dto';

@Injectable()
export class GetFinishedGoodsUseCase {
  constructor(private readonly fgRepo: ProductionFinishedGoodsRepository) {}

  async execute(fgBagId: string): Promise<FinishedGoodsBagResponseDto> {
    const bag = await this.fgRepo.findFGBagById(BigInt(fgBagId));
    if (!bag) {
      throw new NotFoundException(`Finished goods bag ${fgBagId} not found`);
    }
    return mapFGBag(bag);
  }
}
