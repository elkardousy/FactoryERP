import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from '../../repositories/departments.repository';

@Injectable()
export class GetDepartmentUseCase {
  constructor(private readonly repo: DepartmentsRepository) {}

  async execute(id: number) {
    const dept = await this.repo.findById(BigInt(id));
    if (!dept) {
      throw new NotFoundException(`Department ${id} not found.`);
    }
    return dept;
  }
}
