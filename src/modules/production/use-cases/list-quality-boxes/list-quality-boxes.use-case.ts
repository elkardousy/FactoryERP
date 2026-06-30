import { Injectable } from '@nestjs/common';
import { ProductionQualityRepository } from '../../repositories/production-quality.repository';
import type {
  QualityFilterDto,
  QualityBoxResponseDto,
} from '../../dto/production-quality.dto';
import { mapQualityBox } from '../../dto/production-quality.dto';

@Injectable()
export class ListQualityBoxesUseCase {
  constructor(private readonly qualityRepo: ProductionQualityRepository) {}

  async execute(filter: QualityFilterDto): Promise<QualityBoxResponseDto[]> {
    const boxes = await this.qualityRepo.findMany({
      order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
      color_id: filter.color_id ? BigInt(filter.color_id) : undefined,
      size_id: filter.size_id ? BigInt(filter.size_id) : undefined,
    });
    return boxes.map(mapQualityBox);
  }
}
