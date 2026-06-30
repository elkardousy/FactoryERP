import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionReturnsRepository } from '../../repositories/production-returns.repository';
import type { ReturnResponseDto } from '../../dto/production-returns.dto';
import { mapReturn } from '../../dto/production-returns.dto';

@Injectable()
export class GetReturnUseCase {
  constructor(private readonly returnsRepo: ProductionReturnsRepository) {}

  async execute(returnId: string): Promise<ReturnResponseDto> {
    const id = BigInt(returnId);
    const ret = await this.returnsRepo.findById(id);
    if (!ret) {
      throw new NotFoundException(`Return ${returnId} not found`);
    }
    return mapReturn(ret);
  }
}
