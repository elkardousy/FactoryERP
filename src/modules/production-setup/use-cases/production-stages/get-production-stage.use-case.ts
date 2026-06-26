import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';

@Injectable()
export class GetProductionStageUseCase {
  constructor(private readonly repo: ProductionStagesRepository) {}

  async execute(id: number) {
    const stage = await this.repo.findById(BigInt(id));
    if (!stage)
      throw new NotFoundException(`Production stage ${id} not found.`);
    return stage;
  }
}
