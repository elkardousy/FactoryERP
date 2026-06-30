import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionQualityRepository } from '../../repositories/production-quality.repository';
import type { QualityBoxResponseDto } from '../../dto/production-quality.dto';
import { mapQualityBox } from '../../dto/production-quality.dto';

@Injectable()
export class GetQualityBoxUseCase {
  constructor(private readonly qualityRepo: ProductionQualityRepository) {}

  async execute(boxId: string): Promise<QualityBoxResponseDto> {
    const box = await this.qualityRepo.findBoxById(BigInt(boxId));
    if (!box) {
      throw new NotFoundException(`Quality output box ${boxId} not found`);
    }
    return mapQualityBox(box);
  }
}
