import { Injectable } from '@nestjs/common';
import { ModelsRepository } from '../repositories/models.repository';
import { ModelFilterDto } from '../dto/model.dto';

@Injectable()
export class ListModelsUseCase {
  constructor(private readonly repo: ModelsRepository) {}

  async execute(filter: ModelFilterDto) {
    return this.repo.findAllWithPagination(
      {
        search: filter.search,
        is_active: filter.is_active ?? true,
        customer_id: filter.customer_id
          ? BigInt(filter.customer_id)
          : undefined,
      },
      filter.page,
      filter.limit,
    );
  }
}
