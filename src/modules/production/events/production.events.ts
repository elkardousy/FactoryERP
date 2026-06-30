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

export class ProductionQualityRecordedEvent {
  readonly event = 'production.quality.recorded';
  constructor(
    public readonly boxId: string,
    public readonly orderId: string,
    public readonly colorId: string,
    public readonly sizeId: string,
    public readonly dozensRecorded: number,
    public readonly dozensAvailable: number,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class ProductionQualitySummaryUpdatedEvent {
  readonly event = 'production.quality.summary.updated';
  constructor(
    public readonly orderId: string,
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

export class ProductionMaterialReturnedEvent {
  readonly event = 'production.material.returned';
  constructor(
    public readonly returnId: string,
    public readonly orderId: string,
    public readonly partId: string,
    public readonly destinationWarehouseId: string,
    public readonly dozensReturned: number,
    public readonly wipRemaining: number,
    public readonly partStatusUpdated: boolean,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class ProductionReturnSummaryUpdatedEvent {
  readonly event = 'production.return.summary.updated';
  constructor(
    public readonly orderId: string,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class PackingOrderCreatedEvent {
  readonly event = 'production.packing.created';
  constructor(
    public readonly packingOrderId: string,
    public readonly packingOrderNo: string,
    public readonly productionOrderId: string,
    public readonly patternId: string,
    public readonly targetDozens: number,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class PackingAssemblyAddedEvent {
  readonly event = 'production.packing.assembly.added';
  constructor(
    public readonly packingOrderId: string,
    public readonly assemblyId: string,
    public readonly assemblySequence: number,
    public readonly dozensAssembled: number,
    public readonly assembledDozensTotal: number,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class PackingVerifiedEvent {
  readonly event = 'production.packing.verified';
  constructor(
    public readonly packingOrderId: string,
    public readonly systemDozens: number,
    public readonly physicalCountDozens: number,
    public readonly varianceAccepted: boolean,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}

export class PackingPostedEvent {
  readonly event = 'production.packing.posted';
  constructor(
    public readonly packingOrderId: string,
    public readonly productionOrderId: string,
    public readonly assembledDozens: number,
    public readonly actorId: string,
    public readonly occurredAt: Date,
  ) {}
}
