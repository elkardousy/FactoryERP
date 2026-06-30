import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionQualityRepository } from '../../repositories/production-quality.repository';
import type {
  QualitySummaryFilterDto,
  QualitySummaryDto,
  QualityBoxSummaryItemDto,
} from '../../dto/production-quality.dto';

@Injectable()
export class GetQualitySummaryUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly qualityRepo: ProductionQualityRepository,
  ) {}

  async execute(filter: QualitySummaryFilterDto): Promise<QualitySummaryDto> {
    const orderId = BigInt(filter.order_id);

    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(
        `Production order ${filter.order_id} not found`,
      );
    }

    const boxes = await this.qualityRepo.findBoxesByOrder(orderId);

    const totalDozens = boxes.reduce(
      (sum, b) => sum + Number(b.dozens_available),
      0,
    );

    const byColorSize: QualityBoxSummaryItemDto[] = boxes.map((b) => ({
      color_id: b.color_id.toString(),
      color_code: b.colors.color_code,
      color_name: b.colors.color_name,
      size_id: b.size_id.toString(),
      size_code: b.sizes.size_code,
      dozens_available: b.dozens_available.toString(),
    }));

    return {
      order_id: filter.order_id,
      total_dozens_available: totalDozens.toString(),
      box_count: boxes.length,
      by_color_size: byColorSize,
    };
  }
}
