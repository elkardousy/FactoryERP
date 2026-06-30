import { Injectable, NotFoundException } from '@nestjs/common';
import { StageStatusEnum } from '@prisma/client';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionWipRepository } from '../../repositories/production-wip.repository';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import type {
  ProductionProgressDto,
  ProductionProgressFilterDto,
} from '../../dto/production-wip.dto';

@Injectable()
export class GetProductionProgressUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly wipRepo: ProductionWipRepository,
    private readonly stagesRepo: ProductionStagesRepository,
  ) {}

  async execute(
    dto: ProductionProgressFilterDto,
  ): Promise<ProductionProgressDto> {
    const orderId = BigInt(dto.order_id);

    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Production order ${dto.order_id} not found`);
    }

    // Stage completion counts
    const stageLogs = await this.stagesRepo.findLogsByOrder(orderId);
    const totalStages = stageLogs.length;
    const completedStages = stageLogs.filter(
      (l) => l.status === StageStatusEnum.COMPLETE,
    ).length;
    const progressPercent =
      totalStages > 0
        ? Math.round((completedStages / totalStages) * 10000) / 100
        : 0;

    // Current active stage (first IN_PROGRESS)
    const activeLog = stageLogs.find(
      (l) => l.status === StageStatusEnum.IN_PROGRESS,
    );
    const currentStage = activeLog
      ? {
          stage_id: activeLog.stage_id.toString(),
          stage_name: activeLog.production_stages.stage_name,
          stage_code: activeLog.production_stages.stage_code,
          status: activeLog.status,
        }
      : null;

    // WIP balances per part
    const wipEntries = await this.wipRepo.findByOrder(orderId);
    const wipBalances = wipEntries.map((w) => ({
      part_id: w.part_id.toString(),
      part_code: w.model_parts.part_code,
      part_description: w.model_parts.part_description ?? null,
      dozens_in_wip: w.dozens_in_wip.toString(),
    }));

    return {
      order_id: order.order_id.toString(),
      order_number: order.order_number,
      order_status: order.status,
      total_stages: totalStages,
      completed_stages: completedStages,
      progress_percent: progressPercent,
      current_stage: currentStage,
      wip_balances: wipBalances,
    };
  }
}
