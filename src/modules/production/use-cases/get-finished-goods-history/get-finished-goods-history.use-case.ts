import { Injectable } from '@nestjs/common';
import { ProductionFinishedGoodsRepository } from '../../repositories/production-finished-goods.repository';
import {
  mapFGBag,
  type FinishedGoodsHistoryFilterDto,
  type PaginatedFinishedGoodsDto,
} from '../../dto/production-finished-goods.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class GetFinishedGoodsHistoryUseCase {
  constructor(private readonly fgRepo: ProductionFinishedGoodsRepository) {}

  async execute(
    filter: FinishedGoodsHistoryFilterDto,
  ): Promise<PaginatedFinishedGoodsDto> {
    const page = Math.max(1, filter.page ?? DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, filter.limit ?? DEFAULT_LIMIT),
    );

    const { items, total } = await this.fgRepo.findFGBagsPage(page, limit);
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return {
      items: items.map(mapFGBag),
      meta: { page, limit, total, totalPages },
    };
  }
}
