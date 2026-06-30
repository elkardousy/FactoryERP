import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatusEnum, StageStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { ProductionStageStartedEvent } from '../../events/production.events';
import {
  mapStageLogSummary,
  type StageLogSummaryDto,
} from '../../dto/production-stage.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class StartStageUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly stagesRepo: ProductionStagesRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    orderId: string,
    stageId: string,
    actor: JwtPayload,
  ): Promise<StageLogSummaryDto> {
    const oid = BigInt(orderId);
    const sid = BigInt(stageId);

    // Order must be IN_PRODUCTION
    const order = await this.ordersRepo.findById(oid);
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }
    if (order.status !== OrderStatusEnum.IN_PRODUCTION) {
      throw new BadRequestException(
        `Cannot start stage: order must be IN_PRODUCTION, current status is ${order.status}`,
      );
    }

    // Stage log must exist and be PENDING
    const log = await this.stagesRepo.findLogByOrderAndStage(oid, sid);
    if (!log) {
      throw new NotFoundException(
        `Stage log not found for order ${orderId} and stage ${stageId}`,
      );
    }
    if (log.status !== StageStatusEnum.PENDING) {
      throw new BadRequestException(
        `Stage ${stageId} is not PENDING (current status: ${log.status})`,
      );
    }

    const stage = log.production_stages;

    // BR-S01: previous stage must be COMPLETE (unless this is the first stage)
    const isFirst = await this.stagesRepo.isFirstStage(stage.sequence_order);
    if (!isFirst) {
      const prevLog = await this.stagesRepo.findPreviousStageLog(
        oid,
        stage.sequence_order,
      );
      if (!prevLog || prevLog.status !== StageStatusEnum.COMPLETE) {
        throw new BadRequestException(
          `Cannot start stage ${stageId}: the preceding stage must be COMPLETE first`,
        );
      }
    }

    // Compute input_dozens
    let inputDozens: number;
    if (isFirst) {
      // BR-S03: first stage input = total released dozens
      inputDozens = await this.stagesRepo.sumReleasedDozensForOrder(oid);
    } else {
      // BR-S04: subsequent stage input = previous stage output
      const prevLog = await this.stagesRepo.findPreviousStageLog(
        oid,
        stage.sequence_order,
      );
      inputDozens = Number(prevLog?.output_dozens ?? 0);
    }

    const now = new Date();
    const updated = await this.stagesRepo.startStage(
      log.log_id,
      inputDozens,
      actor.sub,
      now,
    );

    this.publisher.emitStageStarted(
      new ProductionStageStartedEvent(
        orderId,
        stageId,
        updated.log_id.toString(),
        inputDozens,
        actor.sub.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'production.stage.started',
      entityType: 'production_stage_logs',
      entityId: updated.log_id.toString(),
      userId: actor.sub,
      payload: {
        order_id: orderId,
        stage_id: stageId,
        input_dozens: inputDozens,
        is_first_stage: isFirst,
      },
    });

    this.logger.info(
      `Stage ${stageId} started for order ${orderId}: input=${inputDozens} dozens`,
    );

    return mapStageLogSummary(updated);
  }
}
