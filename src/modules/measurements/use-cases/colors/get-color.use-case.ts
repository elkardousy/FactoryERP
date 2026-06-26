import { Injectable, NotFoundException } from '@nestjs/common';
import { ColorsRepository } from '../../repositories/colors.repository';

@Injectable()
export class GetColorUseCase {
  constructor(private readonly repo: ColorsRepository) {}

  async execute(id: number) {
    const color = await this.repo.findById(BigInt(id));
    if (!color) throw new NotFoundException(`Color ${id} not found.`);
    return color;
  }
}
