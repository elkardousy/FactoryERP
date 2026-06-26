import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionLinesRepository } from '../../repositories/production-lines.repository';

@Injectable()
export class GetProductionLineUseCase {
  constructor(private readonly repo: ProductionLinesRepository) {}

  async execute(id: number) {
    const line = await this.repo.findById(BigInt(id));
    if (!line) throw new NotFoundException(`Production line ${id} not found.`);
    return line;
  }
}
