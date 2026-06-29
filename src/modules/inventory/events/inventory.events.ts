export class GoodsReceivedEvent {
  readonly event = 'inventory.goods_received';
  constructor(
    public readonly txnId: string,
    public readonly txnReference: string,
    public readonly modelId: string,
    public readonly partId: string | null,
    public readonly warehouseId: string,
    public readonly dozensQty: number,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class BagReservedEvent {
  readonly event = 'inventory.bag_reserved';
  constructor(
    public readonly reservationId: string,
    public readonly bagId: string,
    public readonly orderId: string,
    public readonly reservedDozens: number,
    public readonly reservedBy: string,
    public readonly occurredAt: Date,
  ) {}
}

export class ReservationReleasedEvent {
  readonly event = 'inventory.reservation_released';
  constructor(
    public readonly reservationId: string,
    public readonly bagId: string,
    public readonly orderId: string,
    public readonly releasedBy: string,
    public readonly occurredAt: Date,
  ) {}
}

export class InventoryAdjustedEvent {
  readonly event = 'inventory.adjusted';
  constructor(
    public readonly txnId: string,
    public readonly txnReference: string,
    public readonly warehouseId: string,
    public readonly modelId: string,
    public readonly partId: string | null,
    public readonly dozensQty: number,
    public readonly reason: string,
    public readonly adjustedBy: string,
    public readonly occurredAt: Date,
  ) {}
}
