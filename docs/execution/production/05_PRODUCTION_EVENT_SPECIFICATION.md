# 05 — Production Event Specification

| Field | Value |
|---|---|
| **Purpose** | Define all domain events emitted by the Production Module |
| **Scope** | Production domain events (internal NestJS EventEmitter2 bus) |
| **Audience** | Implementing agents, integration developers |
| **Status** | ACTIVE |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Per-feature |
| **Version** | 1.0 |

**Dependencies:** `00_PRODUCTION_MASTER_EXECUTION_CONTRACT.md`  
**Related FEOS:** FEOS-01  
**Related KEB:** KEB-10 (ADR-025 — Event Bus Architecture), KEB-03  

---

## Architecture

Per ADR-025 (KEB-10), domain events use NestJS `EventEmitter2`. The Production Module must implement the same pattern established in the Inventory Module (F02):

1. **Event classes** — defined in `src/modules/production/events/production.events.ts`
2. **Publisher** — `ProductionEventPublisher` in `src/modules/production/events/production-event.publisher.ts`; wraps `EventEmitter2`; services call the publisher, never the emitter directly
3. **Listener** — `ProductionEventListener` in `src/modules/production/events/production-event.listener.ts`; declares `@OnEvent(...)` handlers

Event handlers are fire-and-forget. A failure in an event handler **must not** roll back the triggering domain operation.

---

## Event Naming Convention

```
production.<entity>.<action>
```

Examples: `production.order.created`, `production.material.released`

---

## Production Domain Events

### `production.order.created`
**Class:** `ProductionOrderCreatedEvent`  
**Trigger:** `CreateProductionOrderUseCase` completes successfully  
**Payload:**
```typescript
{
  orderId: string;        // BigInt as string
  orderNumber: string;
  modelId: string;
  lineId: string;
  releaseType: string;   // FULL | PARTIAL
  cmoLineId: string | null;
  targetDozens: number;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.order.status_changed`
**Class:** `ProductionOrderStatusChangedEvent`  
**Trigger:** Any production order status transition (plan, start, complete, close)  
**Payload:**
```typescript
{
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.material.released`
**Class:** `MaterialReleasedEvent`  
**Trigger:** `CreateReleaseGroupUseCase` completes successfully  
**Payload:**
```typescript
{
  orderId: string;
  releaseGroupId: string;
  groupNumber: number;
  lines: Array<{
    bagId: string;
    dozensReleased: number;
    sourceWarehouseId: string;
  }>;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.stage.started`
**Class:** `ProductionStageStartedEvent`  
**Trigger:** `StartStageUseCase` completes  
**Payload:**
```typescript
{
  orderId: string;
  stageId: string;
  logId: string;
  inputDozens: number;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.stage.completed`
**Class:** `ProductionStageCompletedEvent`  
**Trigger:** `RecordStageOutputUseCase` completes (stage → COMPLETE)  
**Payload:**
```typescript
{
  orderId: string;
  stageId: string;
  logId: string;
  inputDozens: number;
  outputDozens: number;
  scrapDozens: number;
  incompleteDozens: number;
  isLastStage: boolean;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.wip.updated`
**Class:** `WipUpdatedEvent`  
**Trigger:** `UpdateWipOnStageCompleteUseCase` completes  
**Payload:**
```typescript
{
  orderId: string;
  partId: string;
  wipId: string;
  previousDozens: number;
  currentDozens: number;
  occurredAt: Date;
}
```

---

### `production.quality_output.recorded`
**Class:** `QualityOutputRecordedEvent`  
**Trigger:** `RecordQualityOutputUseCase` completes  
**Payload:**
```typescript
{
  orderId: string;
  boxId: string;
  colorId: string;
  sizeId: string;
  dozensAdded: number;
  totalDozensAvailable: number;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.material.returned`
**Class:** `MaterialReturnedEvent`  
**Trigger:** `ReturnMaterialUseCase` completes  
**Payload:**
```typescript
{
  orderId: string;
  returnId: string;
  partId: string;
  bagId: string;
  dozensReturned: number;
  destinationWarehouseId: string;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.packing.order_created`
**Class:** `PackingOrderCreatedEvent`  
**Trigger:** `CreatePackingOrderUseCase` completes  
**Payload:**
```typescript
{
  packingOrderId: string;
  productionOrderId: string;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.packing.assembled`
**Class:** `PackingAssembledEvent`  
**Trigger:** `CompleteAssemblyUseCase` completes (packing → ASSEMBLED)  
**Payload:**
```typescript
{
  packingOrderId: string;
  productionOrderId: string;
  totalAssembledDozens: number;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.packing.verified`
**Class:** `PackingVerifiedEvent`  
**Trigger:** `ApproveVerificationUseCase` completes  
**Payload:**
```typescript
{
  packingOrderId: string;
  verificationId: string;
  systemCountDozens: number;
  physicalCountDozens: number;
  varianceDozens: number;
  approvedBy: string;
  occurredAt: Date;
}
```

---

### `production.packing.posted`
**Class:** `PackingPostedEvent`  
**Trigger:** `PostPackingOrderUseCase` completes  
**Payload:**
```typescript
{
  packingOrderId: string;
  productionOrderId: string;
  finishedGoodsBagIds: string[];
  totalFinishedDozens: number;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.supplementary.status_changed`
**Class:** `SupplementaryRequestStatusChangedEvent`  
**Trigger:** Any supplementary request status transition  
**Payload:**
```typescript
{
  requestId: string;
  requestNumber: string;
  orderId: string;
  previousStatus: string;
  newStatus: string;
  actorId: string;
  occurredAt: Date;
}
```

---

### `production.supplementary.transferred`
**Class:** `SupplementaryTransferredEvent`  
**Trigger:** `TransferSupplementaryMaterialUseCase` completes  
**Payload:**
```typescript
{
  requestId: string;
  requestNumber: string;
  orderId: string;
  lines: Array<{
    partId: string;
    bagId: string;
    dozensTransferred: number;
  }>;
  actorId: string;
  occurredAt: Date;
}
```

---

## Listener Stubs

All event handlers start as log-only stubs (same pattern as `InventoryEventListener`). Real business logic is wired when a consumer use case requires it.

```typescript
// src/modules/production/events/production-event.listener.ts
@Injectable()
export class ProductionEventListener {
  constructor(private readonly logger: LoggerService) {}

  @OnEvent('production.order.created')
  handleOrderCreated(event: ProductionOrderCreatedEvent): void {
    this.logger.info({ event }, 'production.order.created');
  }

  // ... one handler per event
}
```

---

## Integration Events (Future)

These events are defined as stubs only. They will be wired to outbound adapters (message queue, webhook) in a future phase. They are not part of the Production Module scope.

| Event Name | Purpose |
|---|---|
| `production.packing.posted` → Shipping | Notifies shipping module that finished goods are ready |
| `production.order.closed` → CMO | Notifies CMO module that a CMO line is fulfilled |
| `production.supplementary.transferred` → Inventory | Notifies inventory that a supplementary release occurred |
