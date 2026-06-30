import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import {
  mapStageLogSummary,
  type StageLogSummaryDto,
} from '../../dto/production-stage.dto';

@Injectable()
export class ListStageLogsUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly stagesRepo: ProductionStagesRepository,
  ) {}

  async execute(orderId: string): Promise<StageLogSummaryDto[]> {
    const oid = BigInt(orderId);

    const order = await this.ordersRepo.findById(oid);
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }

    const logs = await this.stagesRepo.findLogsByOrder(oid);
    return logs.map(mapStageLogSummary);
  }
}
