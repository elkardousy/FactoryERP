import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import {
  mapStageLogDetail,
  type StageLogDetailDto,
} from '../../dto/production-stage.dto';

@Injectable()
export class GetStageLogUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly stagesRepo: ProductionStagesRepository,
  ) {}

  async execute(orderId: string, stageId: string): Promise<StageLogDetailDto> {
    const oid = BigInt(orderId);
    const sid = BigInt(stageId);

    const order = await this.ordersRepo.findById(oid);
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }

    const log = await this.stagesRepo.findLogWithDetailsByOrderAndStage(
      oid,
      sid,
    );
    if (!log) {
      throw new NotFoundException(
        `Stage log not found for order ${orderId} and stage ${stageId}`,
      );
    }

    return mapStageLogDetail(log);
  }
}
