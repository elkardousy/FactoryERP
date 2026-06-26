import { Injectable, NotFoundException } from '@nestjs/common';
import { SizesRepository } from '../../repositories/sizes.repository';

@Injectable()
export class GetSizeUseCase {
  constructor(private readonly repo: SizesRepository) {}

  async execute(id: number) {
    const size = await this.repo.findById(BigInt(id));
    if (!size) throw new NotFoundException(`Size ${id} not found.`);
    return size;
  }
}
