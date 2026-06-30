import { Injectable } from '@nestjs/common';
import { ProductionFinishedGoodsRepository } from '../../repositories/production-finished-goods.repository';
import type { FinishedGoodsDashboardDto } from '../../dto/production-finished-goods.dto';

@Injectable()
export class FinishedGoodsDashboardUseCase {
  constructor(private readonly fgRepo: ProductionFinishedGoodsRepository) {}

  async execute(): Promise<FinishedGoodsDashboardDto> {
    return this.fgRepo.getDashboardAggregates();
  }
}
