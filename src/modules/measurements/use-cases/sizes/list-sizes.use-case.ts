import { Injectable } from '@nestjs/common';
import { SizesRepository } from '../../repositories/sizes.repository';
import { SizeFilterDto } from '../../dto/size.dto';

@Injectable()
export class ListSizesUseCase {
  constructor(private readonly repo: SizesRepository) {}

  async execute(filter: SizeFilterDto) {
    return this.repo.findAllWithPagination(
      filter.search,
      filter.page,
      filter.limit,
    );
  }
}
