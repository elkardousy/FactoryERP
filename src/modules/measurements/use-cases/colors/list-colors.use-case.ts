import { Injectable } from '@nestjs/common';
import { ColorsRepository } from '../../repositories/colors.repository';
import { ColorFilterDto } from '../../dto/color.dto';

@Injectable()
export class ListColorsUseCase {
  constructor(private readonly repo: ColorsRepository) {}

  async execute(filter: ColorFilterDto) {
    return this.repo.findAllWithPagination(
      filter.search,
      filter.page,
      filter.limit,
    );
  }
}
