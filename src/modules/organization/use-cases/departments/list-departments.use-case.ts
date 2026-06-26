import { Injectable } from '@nestjs/common';
import { DepartmentsRepository } from '../../repositories/departments.repository';
import { DepartmentFilterDto } from '../../dto/department.dto';

@Injectable()
export class ListDepartmentsUseCase {
  constructor(private readonly repo: DepartmentsRepository) {}

  async execute(filter: DepartmentFilterDto) {
    return this.repo.findAllWithPagination(
      { search: filter.search, is_active: filter.is_active ?? true },
      filter.page,
      filter.limit,
    );
  }
}
