import { Injectable } from '@nestjs/common';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type { SupplementaryDashboardDto } from '../../dto/production-supplementary.dto';

@Injectable()
export class SupplementaryDashboardUseCase {
  constructor(private readonly repo: ProductionSupplementaryRepository) {}

  async execute(): Promise<SupplementaryDashboardDto> {
    return this.repo.getDashboardAggregates();
  }
}
