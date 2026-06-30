import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '../../../core/logger/logger.service';
import type {
  MaterialReleaseCreatedEvent,
  ProductionOrderCreatedEvent,
  ProductionOrderStatusChangedEvent,
  ProductionOrderUpdatedEvent,
} from './production.events';

@Injectable()
export class ProductionEventListener {
  constructor(private readonly logger: LoggerService) {}

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
}
