import { Injectable } from '@nestjs/common';
import { ProductionWipRepository } from '../../repositories/production-wip.repository';
import {
  mapWipHistory,
  type WipHistoryFilterDto,
  type PaginatedWipHistoryDto,
} from '../../dto/production-wip.dto';

@Injectable()
export class GetWipHistoryUseCase {
  constructor(private readonly wipRepo: ProductionWipRepository) {}

  async execute(dto: WipHistoryFilterDto): Promise<PaginatedWipHistoryDto> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);
    const orderId = BigInt(dto.order_id);

    const result = await this.wipRepo.findWipTransactionsByOrder(
      orderId,
      page,
      limit,
    );
    return {
      items: result.items.map(mapWipHistory),
      meta: result.meta,
    };
  }
}
