import { Injectable } from '@nestjs/common';
import { ProductionQualityRepository } from '../../repositories/production-quality.repository';
import type {
  QualityHistoryFilterDto,
  PaginatedQualityHistoryDto,
  QualityHistoryItemDto,
} from '../../dto/production-quality.dto';
import { mapQualityHistoryItem } from '../../dto/production-quality.dto';

@Injectable()
export class GetQualityHistoryUseCase {
  constructor(private readonly qualityRepo: ProductionQualityRepository) {}

  async execute(
    filter: QualityHistoryFilterDto,
  ): Promise<PaginatedQualityHistoryDto> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const orderId = BigInt(filter.order_id);

    const result = await this.qualityRepo.findQoTransactionsByOrder(
      orderId,
      page,
      limit,
    );
    const items: QualityHistoryItemDto[] = result.items.map(
      mapQualityHistoryItem,
    );

    return { items, meta: result.meta };
  }
}
