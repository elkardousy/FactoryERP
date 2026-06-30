import { Injectable } from '@nestjs/common';
import { ProductionReturnsRepository } from '../../repositories/production-returns.repository';
import type {
  ReturnHistoryFilterDto,
  PaginatedReturnHistoryDto,
} from '../../dto/production-returns.dto';
import { mapReturn } from '../../dto/production-returns.dto';

@Injectable()
export class GetReturnHistoryUseCase {
  constructor(private readonly returnsRepo: ProductionReturnsRepository) {}

  async execute(
    filter: ReturnHistoryFilterDto,
  ): Promise<PaginatedReturnHistoryDto> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100); // cap at 100 (ED-P07)
    const orderId = BigInt(filter.order_id);

    const allReturns = await this.returnsRepo.findByOrder(orderId);
    const skip = (page - 1) * limit;
    const pageItems = allReturns.slice(skip, skip + limit);
    const total = allReturns.length;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: pageItems.map(mapReturn),
      meta: { page, limit, total, totalPages },
    };
  }
}
