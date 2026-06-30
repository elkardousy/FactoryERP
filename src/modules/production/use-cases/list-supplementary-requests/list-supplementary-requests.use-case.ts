import { Injectable } from '@nestjs/common';
import {
  SupplementaryReasonEnum,
  SupplementaryStatusEnum,
} from '@prisma/client';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type {
  SupplementaryFilterDto,
  SupplementaryRequestResponseDto,
} from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';

@Injectable()
export class ListSupplementaryRequestsUseCase {
  constructor(private readonly repo: ProductionSupplementaryRepository) {}

  async execute(
    filter: SupplementaryFilterDto,
  ): Promise<SupplementaryRequestResponseDto[]> {
    const records = await this.repo.findMany({
      order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
      status: filter.status as SupplementaryStatusEnum | undefined,
      reason_type: filter.reason_type as SupplementaryReasonEnum | undefined,
    });
    return records.map(mapSupplementaryRequest);
  }
}
