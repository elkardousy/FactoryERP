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

export class ProductionStageStartedEvent {
  readonly event = 'production.stage.started';
  constructor(
    public readonly orderId: string,
    public readonly stageId: string,
    public readonly logId: string,
    public readonly inputDozens: number,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class ProductionStageCompletedEvent {
  readonly event = 'production.stage.completed';
  constructor(
    public readonly orderId: string,
    public readonly stageId: string,
    public readonly logId: string,
    public readonly inputDozens: number,
    public readonly outputDozens: number,
    public readonly scrapDozens: number,
    public readonly incompleteDozens: number,
    public readonly isLastStage: boolean,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class ProductionWipUpdatedEvent {
  readonly event = 'production.wip.updated';
  constructor(
    public readonly wipId: string,
    public readonly orderId: string,
    public readonly partId: string,
    public readonly dozensInWip: number,
    public readonly stageId: string,
    public readonly isLastStage: boolean,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class MaterialReleaseCreatedEvent {
  readonly event = 'production.material.release.created';
  constructor(
    public readonly releaseGroupId: string,
    public readonly orderId: string,
    public readonly groupNumber: number,
    public readonly linesCount: number,
    public readonly totalDozens: number,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}
