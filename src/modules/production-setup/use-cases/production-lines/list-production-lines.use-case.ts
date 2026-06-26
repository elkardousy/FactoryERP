import { Injectable } from '@nestjs/common';
import { ProductionLinesRepository } from '../../repositories/production-lines.repository';
import { ProductionLineFilterDto } from '../../dto/production-line.dto';

@Injectable()
export class ListProductionLinesUseCase {
  constructor(private readonly repo: ProductionLinesRepository) {}

  async execute(filter: ProductionLineFilterDto) {
    return this.repo.findAllWithPagination(
      { search: filter.search, is_active: filter.is_active ?? true },
      filter.page,
      filter.limit,
    );
  }
}
