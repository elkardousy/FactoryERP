import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionWipRepository } from '../../repositories/production-wip.repository';
import { mapWip, type WipResponseDto } from '../../dto/production-wip.dto';

@Injectable()
export class GetWipUseCase {
  constructor(private readonly wipRepo: ProductionWipRepository) {}

  async execute(wipId: string): Promise<WipResponseDto> {
    const wip = await this.wipRepo.findByWipId(BigInt(wipId));
    if (!wip) {
      throw new NotFoundException(`WIP entry ${wipId} not found`);
    }
    return mapWip(wip);
  }
}
