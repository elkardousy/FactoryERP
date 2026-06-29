import { Injectable } from '@nestjs/common';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import {
  mapOrderSummary,
  type ProductionOrderFilterDto,
  type ProductionOrderSummaryDto,
} from '../../dto/production-order.dto';
import type { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';

@Injectable()
export class ListProductionOrdersUseCase {
  constructor(private readonly ordersRepo: ProductionOrdersRepository) {}

  async execute(
    filter: ProductionOrderFilterDto,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ProductionOrderSummaryDto>> {
    const result = await this.ordersRepo.findMany(
      {
        status: filter.status,
        line_id: filter.line_id ? BigInt(filter.line_id) : undefined,
        model_id: filter.model_id ? BigInt(filter.model_id) : undefined,
      },
      page,
      limit,
    );
    return {
      items: result.items.map(mapOrderSummary),
      meta: result.meta,
    };
  }
}
