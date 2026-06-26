import { Injectable, NotFoundException } from '@nestjs/common';
import { ModelsRepository } from '../repositories/models.repository';

@Injectable()
export class GetModelUseCase {
  constructor(private readonly repo: ModelsRepository) {}

  async execute(id: number) {
    const model = await this.repo.findById(BigInt(id));
    if (!model) throw new NotFoundException(`Model ${id} not found.`);
    return model;
  }
}
