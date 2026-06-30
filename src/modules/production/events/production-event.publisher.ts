import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  FinishedGoodsAvailableEvent,
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
  ProductionQualityRecordedEvent,
  ProductionQualitySummaryUpdatedEvent,
  ProductionReturnSummaryUpdatedEvent,
  ProductionStageCompletedEvent,
  ProductionStageStartedEvent,
  ProductionWipUpdatedEvent,
  SupplementaryApprovedEvent,
  SupplementaryCompletedEvent,
  SupplementaryRejectedEvent,
  SupplementaryRequestedEvent,
  SupplementarySummaryUpdatedEvent,
  SupplementaryTransferredEvent,
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

  emitFinishedGoodsCreated(event: FinishedGoodsCreatedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitFinishedGoodsAvailable(event: FinishedGoodsAvailableEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitFinishedGoodsSummaryUpdated(
    event: FinishedGoodsSummaryUpdatedEvent,
  ): void {
    this.emitter.emit(event.event, event);
  }

  emitSupplementaryRequested(event: SupplementaryRequestedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitSupplementaryApproved(event: SupplementaryApprovedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitSupplementaryRejected(event: SupplementaryRejectedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitSupplementaryTransferred(event: SupplementaryTransferredEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitSupplementaryCompleted(event: SupplementaryCompletedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitSupplementarySummaryUpdated(
    event: SupplementarySummaryUpdatedEvent,
  ): void {
    this.emitter.emit(event.event, event);
  }
}
