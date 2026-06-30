import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionReturnsRepository } from '../../repositories/production-returns.repository';
import type {
  ReturnSummaryFilterDto,
  ReturnSummaryDto,
  ReturnSummaryItemDto,
} from '../../dto/production-returns.dto';

@Injectable()
export class GetReturnSummaryUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly returnsRepo: ProductionReturnsRepository,
  ) {}

  async execute(filter: ReturnSummaryFilterDto): Promise<ReturnSummaryDto> {
    const orderId = BigInt(filter.order_id);

    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(
        `Production order ${filter.order_id} not found`,
      );
    }

    const returns = await this.returnsRepo.findByOrder(orderId);

    // Aggregate by part in application code
    const byPartMap = new Map<
      string,
      {
        partCode: string;
        partDescription: string | null;
        total: number;
        count: number;
      }
    >();

    for (const r of returns) {
      const key = r.part_id.toString();
      const existing = byPartMap.get(key);
      const dozens = Number(r.dozens_returned);
      if (existing) {
        existing.total += dozens;
        existing.count += 1;
      } else {
        byPartMap.set(key, {
          partCode: r.model_parts.part_code,
          partDescription: r.model_parts.part_description ?? null,
          total: dozens,
          count: 1,
        });
      }
    }

    const byPart: ReturnSummaryItemDto[] = Array.from(byPartMap.entries()).map(
      ([partId, agg]) => ({
        part_id: partId,
        part_code: agg.partCode,
        part_description: agg.partDescription,
        total_dozens_returned: agg.total.toString(),
        transaction_count: agg.count,
      }),
    );

    const totalDozens = returns.reduce(
      (sum, r) => sum + Number(r.dozens_returned),
      0,
    );

    return {
      order_id: filter.order_id,
      total_dozens_returned: totalDozens.toString(),
      transaction_count: returns.length,
      by_part: byPart,
    };
  }
}
