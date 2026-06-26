import { Injectable } from '@nestjs/common';
import { WorkingShiftsRepository } from '../../repositories/working-shifts.repository';
import { WorkingShiftFilterDto } from '../../dto/working-shift.dto';

@Injectable()
export class ListWorkingShiftsUseCase {
  constructor(private readonly repo: WorkingShiftsRepository) {}

  async execute(filter: WorkingShiftFilterDto) {
    return this.repo.findAllWithPagination(
      { search: filter.search, is_active: filter.is_active ?? true },
      filter.page,
      filter.limit,
    );
  }
}
