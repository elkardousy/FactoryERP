export class ProductionOrderCreatedEvent {
  readonly event = 'production.order.created';
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly modelId: string,
    public readonly lineId: string,
    public readonly releaseType: string,
    public readonly cmoLineId: string | null,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class ProductionOrderStatusChangedEvent {
  readonly event = 'production.order.status_changed';
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class ProductionOrderUpdatedEvent {
  readonly event = 'production.order.updated';
  constructor(
    public readonly orderId: string,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}
