import { Injectable } from '@nestjs/common';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type {
  SupplementaryHistoryFilterDto,
  SupplementaryRequestResponseDto,
} from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';
import type { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';

@Injectable()
export class GetSupplementaryHistoryUseCase {
  constructor(private readonly repo: ProductionSupplementaryRepository) {}

  async execute(
    filter: SupplementaryHistoryFilterDto,
  ): Promise<PaginatedResult<SupplementaryRequestResponseDto>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 20));

    const result = await this.repo.findPage(page, limit);
    return {
      items: result.items.map(mapSupplementaryRequest),
      meta: result.meta,
    };
  }
}
