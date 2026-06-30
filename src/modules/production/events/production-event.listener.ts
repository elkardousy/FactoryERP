import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '../../../core/logger/logger.service';
import { ProcessStageCompletionWipUseCase } from '../use-cases/process-stage-completion-wip/process-stage-completion-wip.use-case';
import { ProductionEventPublisher } from './production-event.publisher';
import {
  FinishedGoodsAvailableEvent,
  ProductionQualityRecordedEvent,
  ProductionQualitySummaryUpdatedEvent,
} from './production.events';
import type {
  FinishedGoodsCreatedEvent,
  FinishedGoodsSummaryUpdatedEvent,
  MaterialReleaseCreatedEvent,
  PackingAssemblyAddedEvent,
  PackingOrderCreatedEvent,
  PackingPostedEvent,
  PackingVerifiedEvent,
  ProductionMaterialReturnedEvent,
  ProductionOrderCreatedEvent,
  ProductionOrderStatusChangedEvent,
  ProductionOrderUpdatedEvent,
  ProductionReturnSummaryUpdatedEvent,
  ProductionStageCompletedEvent,
  ProductionStageStartedEvent,
  ProductionWipUpdatedEvent,
} from './production.events';

@Injectable()
export class ProductionEventListener {
  constructor(
    private readonly logger: LoggerService,
    private readonly processWipUseCase: ProcessStageCompletionWipUseCase,
    private readonly publisher: ProductionEventPublisher,
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

  // Emit quality readiness signals when the last stage completes
  @OnEvent('production.stage.completed')
  onStageCompletedQuality(event: ProductionStageCompletedEvent): void {
    if (!event.isLastStage) return;
    const now = new Date();
    this.logger.debug(
      `[PROD-008] LastStageCompleted — quality output now eligible for order=${event.orderId}`,
    );
    // Emit a placeholder quality summary update to signal QO is now open
    this.publisher.emitQualitySummaryUpdated(
      new ProductionQualitySummaryUpdatedEvent(
        event.orderId,
        event.actorId,
        now,
      ),
    );
  }

  @OnEvent('production.quality.recorded')
  onQualityRecorded(event: ProductionQualityRecordedEvent): void {
    this.logger.debug(
      `[PROD-009] QualityRecorded: box=${event.boxId} order=${event.orderId} color=${event.colorId} size=${event.sizeId} +${event.dozensRecorded} dozens (total: ${event.dozensAvailable})`,
    );
  }

  @OnEvent('production.quality.summary.updated')
  onQualitySummaryUpdated(event: ProductionQualitySummaryUpdatedEvent): void {
    this.logger.debug(
      `[PROD-010] QualitySummaryUpdated: order=${event.orderId}`,
    );
  }

  @OnEvent('production.material.returned')
  onMaterialReturned(event: ProductionMaterialReturnedEvent): void {
    this.logger.debug(
      `[PROD-011] MaterialReturned: return=${event.returnId} order=${event.orderId} part=${event.partId} warehouse=${event.destinationWarehouseId} dozens=${event.dozensReturned} wipRemaining=${event.wipRemaining} partStatusUpdated=${event.partStatusUpdated}`,
    );
  }

  @OnEvent('production.return.summary.updated')
  onReturnSummaryUpdated(event: ProductionReturnSummaryUpdatedEvent): void {
    this.logger.debug(
      `[PROD-012] ReturnSummaryUpdated: order=${event.orderId}`,
    );
  }

  @OnEvent('production.packing.created')
  onPackingOrderCreated(event: PackingOrderCreatedEvent): void {
    this.logger.debug(
      `[PROD-013] PackingOrderCreated: packing=${event.packingOrderId} no=${event.packingOrderNo} order=${event.productionOrderId} pattern=${event.patternId} target=${event.targetDozens}`,
    );
  }

  @OnEvent('production.packing.assembly.added')
  onPackingAssemblyAdded(event: PackingAssemblyAddedEvent): void {
    this.logger.debug(
      `[PROD-014] PackingAssemblyAdded: packing=${event.packingOrderId} assembly=${event.assemblyId} seq=${event.assemblySequence} dozens=${event.dozensAssembled} total=${event.assembledDozensTotal}`,
    );
  }

  @OnEvent('production.packing.verified')
  onPackingVerified(event: PackingVerifiedEvent): void {
    this.logger.debug(
      `[PROD-015] PackingVerified: packing=${event.packingOrderId} system=${event.systemDozens} physical=${event.physicalCountDozens} accepted=${event.varianceAccepted}`,
    );
  }

  @OnEvent('production.packing.posted')
  onPackingPosted(event: PackingPostedEvent): void {
    this.logger.debug(
      `[PROD-016] PackingPosted: packing=${event.packingOrderId} order=${event.productionOrderId} dozens=${event.assembledDozens}`,
    );
  }

  @OnEvent('production.finished_goods.created')
  onFinishedGoodsCreated(event: FinishedGoodsCreatedEvent): void {
    this.logger.debug(
      `[PROD-017] FinishedGoodsCreated: bag=${event.fgBagId} model=${event.modelId} customer=${event.customerId} warehouse=${event.warehouseId} dozens=${event.dozensQty}`,
    );
    const now = new Date();
    this.publisher.emitFinishedGoodsAvailable(
      new FinishedGoodsAvailableEvent(
        event.fgBagId,
        event.modelId,
        event.warehouseId,
        event.dozensQty,
        now,
      ),
    );
  }

  @OnEvent('production.finished_goods.available')
  onFinishedGoodsAvailable(event: FinishedGoodsAvailableEvent): void {
    this.logger.debug(
      `[PROD-018] FinishedGoodsAvailable: bag=${event.fgBagId} model=${event.modelId} warehouse=${event.warehouseId} dozens=${event.dozensQty}`,
    );
  }

  @OnEvent('production.finished_goods.summary.updated')
  onFinishedGoodsSummaryUpdated(event: FinishedGoodsSummaryUpdatedEvent): void {
    this.logger.debug(
      `[PROD-019] FinishedGoodsSummaryUpdated: model=${event.modelId}`,
    );
  }
}
