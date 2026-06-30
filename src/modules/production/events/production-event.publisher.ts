import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  MaterialReleaseCreatedEvent,
  ProductionOrderCreatedEvent,
  ProductionOrderStatusChangedEvent,
  ProductionOrderUpdatedEvent,
  ProductionStageCompletedEvent,
  ProductionStageStartedEvent,
} from './production.events';

@Injectable()
export class ProductionEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  emitOrderCreated(event: ProductionOrderCreatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitOrderStatusChanged(event: ProductionOrderStatusChangedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitOrderUpdated(event: ProductionOrderUpdatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitMaterialReleased(event: MaterialReleaseCreatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitStageStarted(event: ProductionStageStartedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitStageCompleted(event: ProductionStageCompletedEvent): void {
    this.emitter.emit(event.event, event);
  }
}
