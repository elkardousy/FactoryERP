import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  GoodsReceivedEvent,
  BagReservedEvent,
  ReservationReleasedEvent,
  InventoryAdjustedEvent,
} from './inventory.events';

@Injectable()
export class InventoryEventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  emitGoodsReceived(event: GoodsReceivedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitBagReserved(event: BagReservedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitReservationReleased(event: ReservationReleasedEvent): void {
    this.emitter.emit(event.event, event);
  }

  emitInventoryAdjusted(event: InventoryAdjustedEvent): void {
    this.emitter.emit(event.event, event);
  }
}
