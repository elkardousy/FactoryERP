import { Injectable } from '@nestjs/common';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import { ProductionStageFilterDto } from '../../dto/production-stage.dto';

@Injectable()
export class ListProductionStagesUseCase {
  constructor(private readonly repo: ProductionStagesRepository) {}

  async execute(filter: ProductionStageFilterDto) {
    return this.repo.findAllWithPagination(
      filter.search,
      filter.page,
      filter.limit,
    );
  }
}
