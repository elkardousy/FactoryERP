import { Injectable } from '@nestjs/common';
import { SupplementaryStatusEnum } from '@prisma/client';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type {
  SupplementarySummaryFilterDto,
  SupplementarySummaryDto,
} from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';

@Injectable()
export class GetSupplementarySummaryUseCase {
  constructor(private readonly repo: ProductionSupplementaryRepository) {}

  async execute(
    filter: SupplementarySummaryFilterDto,
  ): Promise<SupplementarySummaryDto> {
    const orderId = BigInt(filter.order_id);
    const requests = await this.repo.findByOrder(orderId);

    const statusCount = (status: SupplementaryStatusEnum) =>
      requests.filter((r) => r.status === status).length;

    return {
      order_id: filter.order_id,
      total_requests: requests.length,
      pending: statusCount(SupplementaryStatusEnum.PENDING_APPROVAL),
      approved: statusCount(SupplementaryStatusEnum.APPROVED),
      transferred: statusCount(SupplementaryStatusEnum.TRANSFERRED),
      rejected: statusCount(SupplementaryStatusEnum.REJECTED),
      cancelled: statusCount(SupplementaryStatusEnum.CANCELLED),
      requests: requests.map(mapSupplementaryRequest),
    };
  }
}
