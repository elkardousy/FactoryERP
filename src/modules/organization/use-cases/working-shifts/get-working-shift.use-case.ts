import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkingShiftsRepository } from '../../repositories/working-shifts.repository';

@Injectable()
export class GetWorkingShiftUseCase {
  constructor(private readonly repo: WorkingShiftsRepository) {}

  async execute(id: number) {
    const shift = await this.repo.findById(BigInt(id));
    if (!shift) {
      throw new NotFoundException(`Working shift ${id} not found.`);
    }
    return shift;
  }
}
