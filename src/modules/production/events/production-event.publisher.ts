import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  MaterialReleaseCreatedEvent,
  PackingAssemblyAddedEvent,
  PackingOrderCreatedEvent,
  PackingPostedEvent,
  PackingVerifiedEvent,
  ProductionMaterialReturnedEvent,
  ProductionOrderCreatedEvent,
  ProductionOrderStatusChangedEvent,
  ProductionOrderUpdatedEvent,
  ProductionQualityRecordedEvent,
  ProductionQualitySummaryUpdatedEvent,
  ProductionReturnSummaryUpdatedEvent,
  ProductionStageCompletedEvent,
  ProductionStageStartedEvent,
  ProductionWipUpdatedEvent,
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

  emitWipUpdated(event: ProductionWipUpdatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitQualityRecorded(event: ProductionQualityRecordedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitQualitySummaryUpdated(event: ProductionQualitySummaryUpdatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitMaterialReturned(event: ProductionMaterialReturnedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitReturnSummaryUpdated(event: ProductionReturnSummaryUpdatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitPackingOrderCreated(event: PackingOrderCreatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitPackingAssemblyAdded(event: PackingAssemblyAddedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitPackingVerified(event: PackingVerifiedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitPackingPosted(event: PackingPostedEvent): void {
    this.emitter.emit(event.event, event);
  }
}
