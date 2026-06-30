import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionWipRepository } from '../../repositories/production-wip.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { ProductionWipUpdatedEvent } from '../../events/production.events';
import type { ProductionStageCompletedEvent } from '../../events/production.events';

@Injectable()
export class ProcessStageCompletionWipUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly wipRepo: ProductionWipRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
  ) {}

  async execute(event: ProductionStageCompletedEvent): Promise<void> {
    const orderId = BigInt(event.orderId);
    const stageId = BigInt(event.stageId);
    const actorId = BigInt(event.actorId);

    // Get order with parts to determine model_id, line_id, and all part IDs
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      this.logger.error(
        `[P04] WIP update skipped: order ${event.orderId} not found`,
      );
      return;
    }

    const { model_id: modelId, line_id: lineId } = order;
    const parts = order.production_order_parts;

    if (parts.length === 0) {
      this.logger.warn(
        `[P04] WIP update skipped: order ${event.orderId} has no parts`,
      );
      return;
    }

    // BR-W02: WIP cannot be negative
    const dozensInWip = Math.max(0, event.outputDozens);

    for (const part of parts) {
      const wip = await this.wipRepo.upsertAndRecordTransaction({
        orderId,
        lineId,
        partId: part.part_id,
        modelId,
        dozensInWip,
        stageId,
        executedBy: actorId,
        now: event.occurredAt,
      });

      this.publisher.emitWipUpdated(
        new ProductionWipUpdatedEvent(
          wip.wip_id.toString(),
          event.orderId,
          part.part_id.toString(),
          dozensInWip,
          event.stageId,
          event.isLastStage,
          event.actorId,
          event.occurredAt,
        ),
      );

      await this.auditService.log({
        eventType: 'production.wip.updated',
        entityType: 'wip_inventory',
        entityId: wip.wip_id.toString(),
        userId: actorId,
        payload: {
          order_id: event.orderId,
          stage_id: event.stageId,
          part_id: part.part_id.toString(),
          dozens_in_wip: dozensInWip,
          is_last_stage: event.isLastStage,
        },
      });

      this.logger.info(
        `[P04] WIP updated: wip=${wip.wip_id} order=${event.orderId} part=${part.part_id} dozens=${dozensInWip} isLast=${event.isLastStage}`,
      );
    }
  }
}
