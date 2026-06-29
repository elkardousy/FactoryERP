import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '../../../core/logger/logger.service';
import type {
  GoodsReceivedEvent,
  BagReservedEvent,
  ReservationReleasedEvent,
  InventoryAdjustedEvent,
} from './inventory.events';

@Injectable()
export class InventoryEventListener {
  constructor(private readonly logger: LoggerService) {}

  @OnEvent('inventory.goods_received')
  onGoodsReceived(event: GoodsReceivedEvent): void {
    this.logger.debug(
      `[EVT-001] GoodsReceived: txn=${event.txnId} model=${event.modelId} qty=${event.dozensQty}dz`,
    );
  }

  @OnEvent('inventory.bag_reserved')
  onBagReserved(event: BagReservedEvent): void {
    this.logger.debug(
      `[EVT-003] BagReserved: reservation=${event.reservationId} bag=${event.bagId} order=${event.orderId}`,
    );
  }

  @OnEvent('inventory.reservation_released')
  onReservationReleased(event: ReservationReleasedEvent): void {
    this.logger.debug(
      `[EVT-004] ReservationReleased: reservation=${event.reservationId} bag=${event.bagId}`,
    );
  }

  @OnEvent('inventory.adjusted')
  onInventoryAdjusted(event: InventoryAdjustedEvent): void {
    this.logger.debug(
      `[EVT-008] InventoryAdjusted: txn=${event.txnId} model=${event.modelId} qty=${event.dozensQty}dz reason=${event.reason}`,
    );
  }
}
