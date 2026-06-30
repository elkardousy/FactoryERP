import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '../../../core/logger/logger.service';
import { ProcessStageCompletionWipUseCase } from '../use-cases/process-stage-completion-wip/process-stage-completion-wip.use-case';
import type {
  MaterialReleaseCreatedEvent,
  ProductionOrderCreatedEvent,
  ProductionOrderStatusChangedEvent,
  ProductionOrderUpdatedEvent,
  ProductionStageCompletedEvent,
  ProductionStageStartedEvent,
  ProductionWipUpdatedEvent,
} from './production.events';

@Injectable()
export class ProductionEventListener {
  constructor(
    private readonly logger: LoggerService,
    private readonly processWipUseCase: ProcessStageCompletionWipUseCase,
  ) {}

  @OnEvent('production.order.created')
  onOrderCreated(event: ProductionOrderCreatedEvent): void {
    this.logger.debug(
      `[PROD-001] OrderCreated: order=${event.orderId} number=${event.orderNumber} model=${event.modelId}`,
    );
  }

  @OnEvent('production.order.status_changed')
  onOrderStatusChanged(event: ProductionOrderStatusChangedEvent): void {
    this.logger.debug(
      `[PROD-002] StatusChanged: order=${event.orderId} ${event.previousStatus}→${event.newStatus}`,
    );
  }

  @OnEvent('production.order.updated')
  onOrderUpdated(event: ProductionOrderUpdatedEvent): void {
    this.logger.debug(`[PROD-003] OrderUpdated: order=${event.orderId}`);
  }

  @OnEvent('production.material.release.created')
  onMaterialReleased(event: MaterialReleaseCreatedEvent): void {
    this.logger.debug(
      `[PROD-004] MaterialReleased: group=${event.releaseGroupId} order=${event.orderId} groupNum=${event.groupNumber} lines=${event.linesCount}`,
    );
  }

  @OnEvent('production.stage.started')
  onStageStarted(event: ProductionStageStartedEvent): void {
    this.logger.debug(
      `[PROD-005] StageStarted: order=${event.orderId} stage=${event.stageId} log=${event.logId} input=${event.inputDozens}`,
    );
  }

  @OnEvent('production.stage.completed')
  async onStageCompleted(event: ProductionStageCompletedEvent): Promise<void> {
    this.logger.debug(
      `[PROD-006] StageCompleted: order=${event.orderId} stage=${event.stageId} log=${event.logId} output=${event.outputDozens} scrap=${event.scrapDozens} incomplete=${event.incompleteDozens} isLast=${event.isLastStage}`,
    );
    try {
      await this.processWipUseCase.execute(event);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[PROD-006] WIP update failed for order=${event.orderId} stage=${event.stageId}: ${message}`,
      );
    }
  }

  @OnEvent('production.wip.updated')
  onWipUpdated(event: ProductionWipUpdatedEvent): void {
    this.logger.debug(
      `[PROD-007] WipUpdated: wip=${event.wipId} order=${event.orderId} part=${event.partId} dozens=${event.dozensInWip} isLast=${event.isLastStage}`,
    );
  }
}
