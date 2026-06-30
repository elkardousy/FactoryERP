import { Injectable } from '@nestjs/common';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import {
  mapPackingOrder,
  type PackingHistoryFilterDto,
  type PaginatedPackingHistoryDto,
} from '../../dto/production-packing.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class GetPackingHistoryUseCase {
  constructor(private readonly packingRepo: ProductionPackingRepository) {}

  async execute(
    filter: PackingHistoryFilterDto,
  ): Promise<PaginatedPackingHistoryDto> {
    const page = Math.max(1, filter.page ?? DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, filter.limit ?? DEFAULT_LIMIT),
    );

    const { items, total } = await this.packingRepo.findPackingOrdersPage(
      page,
      limit,
    );
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return {
      items: items.map(mapPackingOrder),
      meta: { page, limit, total, totalPages },
    };
  }
}
