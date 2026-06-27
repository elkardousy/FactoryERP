# Inventory Event Flow

**Status:** Architecture Design — Phase 3 Sprint 0
**Date:** 2026-06-27
**Authority:** Chief ERP Architect
**Version:** 1.0.0

> **DESIGN DOCUMENT ONLY.** No Event Bus is implemented. This documents the intended event flow for architectural awareness and future implementation planning. In Sprint 11, all cross-concern notifications are handled via direct synchronous calls and fire-and-forget audit events.

---

## Event Bus Decision

Per ADR-025 (ERP Architecture Vision), the current architecture uses **synchronous orchestration** within the monolith. NestJS `EventEmitter2` is the intended progression (before a full message queue). This document describes events as logical concepts — they become technical events when NestJS EventEmitter2 is wired up (Sprint 17 — Workflow Engine).

For Sprint 11, every "subscriber" action listed below is executed **synchronously** by the publishing use case itself or via direct service calls.

---

## Event Map — Full Inventory Lifecycle

### EVT-001 — GoodsReceived

**Published by:** `ReceivePhysicalBagUseCase` (InventoryModule)
**Trigger:** A physical bag is successfully created from a container audit item

**Event payload:**
```typescript
{
  event: 'inventory.goods_received',
  bagId: bigint,
  bagCode: string,
  containerId: bigint,
  customerId: bigint,
  modelId: bigint,
  partId: bigint,
  warehouseId: bigint,
  receivedDozens: Decimal,
  receivedDate: Date,
  actorId: bigint,
  occurredAt: DateTime,
}
```

**Current subscribers (Sprint 11 — synchronous):**
| Subscriber | Action | Mechanism |
|-----------|--------|-----------|
| AuditService | Write `PHYSICAL_BAG_RECEIVED` audit event | `void this.auditService.log(...)` |

**Future subscribers (Sprint 15+):**
| Subscriber | Action | When |
|-----------|--------|------|
| NotificationService | Alert warehouse supervisor of new receipt | Sprint 17 |
| PurchasingModule | Update container receipt status | Sprint 15 |

---

### EVT-002 — BagAvailable

**Published by:** Container audit approval workflow (Sprint 15 — Purchasing)
**Trigger:** A RECEIVED bag passes quality audit and becomes AVAILABLE

**Event payload:**
```typescript
{
  event: 'inventory.bag_available',
  bagId: bigint,
  bagCode: string,
  modelId: bigint, partId: bigint,
  availableDozens: Decimal,
  warehouseId: bigint,
  actorId: bigint,
}
```

**Current subscribers (Sprint 11):** N/A — audit approval is Sprint 15 scope
**Future subscribers:**
| Subscriber | Action |
|-----------|--------|
| CMOModule | Check if any production orders are waiting for this material |
| InventoryReportingService | Update availability report |

---

### EVT-003 — BagReserved

**Published by:** `CreateStockReservationUseCase` (InventoryModule)
**Trigger:** A physical bag is reserved for a production order

**Event payload:**
```typescript
{
  event: 'inventory.bag_reserved',
  reservationId: bigint,
  bagId: bigint, bagCode: string,
  orderId: bigint,
  reservedDozens: Decimal,
  reservedBy: bigint,
  occurredAt: DateTime,
}
```

**Current subscribers (Sprint 11):**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `STOCK_RESERVED` audit event |

**Future subscribers (Sprint 13+):**
| Subscriber | Action |
|-----------|--------|
| ProductionModule | Update `production_order_parts.status` to RELEASED |
| NotificationService | Notify production line supervisor |

---

### EVT-004 — ReservationReleased

**Published by:** `ReleaseStockReservationUseCase` (InventoryModule)
**Trigger:** A reservation is cancelled — bag returns to AVAILABLE pool

**Event payload:**
```typescript
{
  event: 'inventory.reservation_released',
  reservationId: bigint,
  bagId: bigint,
  orderId: bigint,
  releasedBy: bigint,
  occurredAt: DateTime,
}
```

**Current subscribers (Sprint 11):**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `RESERVATION_RELEASED` audit event |

**Future subscribers:**
| Subscriber | Action |
|-----------|--------|
| ProductionModule | Update `production_order_parts.status` back to PENDING |

---

### EVT-005 — InventoryAllocated (Material Released to Production Line)

**Published by:** `ReleaseToProductionUseCase` (ProductionModule — Sprint 13)
**Trigger:** Reserved bags physically issued to a production order/line

**Event payload:**
```typescript
{
  event: 'inventory.material_allocated',
  bagId: bigint, orderId: bigint, lineId: bigint,
  partId: bigint, allocatedDozens: Decimal,
  sourceWarehouseId: bigint,
  actorId: bigint, occurredAt: DateTime,
}
```

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `MATERIAL_RELEASED` audit event |
| InventoryModule | Decrement `inventory_bags.dozens_on_hand` (internal T3) |
| InventoryModule | Increment `wip_inventory.dozens_in_wip` (internal T3) |

---

### EVT-006 — InventoryConsumed

**Published by:** `ConsumeWIPUseCase` (ProductionModule — Sprint 13)
**Trigger:** Material consumed at a production stage; output counted

**Event payload:**
```typescript
{
  event: 'inventory.material_consumed',
  orderId: bigint, partId: bigint,
  stageid: bigint,
  dozensConsumed: Decimal,
  dozensApproved: Decimal, dozensScrap: Decimal,
  actorId: bigint, occurredAt: DateTime,
}
```

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `MATERIAL_CONSUMED` audit event |
| InventoryModule | Decrement `wip_inventory` (T5 — internal) |
| InventoryModule | Increment `quality_output_boxes` (T5 — internal) |
| CMOModule | Update `produced_dozens` on `customer_manufacturing_order_lines` |

---

### EVT-007 — InventoryReturned

**Published by:** `ReturnMaterialUseCase` (ProductionModule — Sprint 13)
**Trigger:** Unused material returned from production line to warehouse

**Event payload:**
```typescript
{
  event: 'inventory.material_returned',
  returnId: bigint,
  orderId: bigint, bagId: bigint, partId: bigint,
  returnedDozens: Decimal,
  destinationWarehouseId: bigint,
  returnedBy: bigint, occurredAt: DateTime,
}
```

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `MATERIAL_RETURNED` audit event |
| InventoryModule | Decrement `wip_inventory` (T6) |
| InventoryModule | Increment `inventory_bags.dozens_on_hand` (T6) |

---

### EVT-008 — InventoryAdjusted

**Published by:** `AdjustInventoryUseCase` (InventoryModule)
**Trigger:** Manual inventory count correction by warehouse manager

**Event payload:**
```typescript
{
  event: 'inventory.adjusted',
  inventoryBagId: bigint,
  warehouseId: bigint, modelId: bigint, partId: bigint,
  oldQty: Decimal, newQty: Decimal, variance: Decimal,
  justification: string,
  adjustedBy: bigint, occurredAt: DateTime,
}
```

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `INVENTORY_ADJUSTED` audit event |
| InvestigationsModule | Auto-create investigation if |variance| > threshold (Sprint 18) |

---

### EVT-009 — ProductionStarted

**Published by:** `StartProductionStageUseCase` (ProductionModule — Sprint 13)
**Trigger:** First production stage begins for a production order

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `PRODUCTION_STARTED` audit event |
| CMOModule | Update `customer_manufacturing_order_lines.line_status` to IN_PRODUCTION |
| InventoryModule | Confirm all material allocations are in place (validation check) |

---

### EVT-010 — ProductionCompleted

**Published by:** `CompleteProductionOrderUseCase` (ProductionModule — Sprint 13)
**Trigger:** Final production stage completes; all parts consumed or returned

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `PRODUCTION_COMPLETED` audit event |
| CMOModule | Update `produced_dozens` on all `customer_manufacturing_order_lines` |
| PackingModule | Notify that quality output boxes are ready for packing |
| InventoryModule | Close remaining physical bag records |

---

### EVT-011 — QualityApproved

**Published by:** `RecordQualityOutputUseCase` (QualityModule — Sprint 14)
**Trigger:** Quality inspection approves production output

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `QUALITY_APPROVED` audit event |
| PackingModule | Update quality_output_boxes.dozens_available |
| CMOModule | Update `produced_dozens` on CMO line |

---

### EVT-012 — ShipmentCompleted

**Published by:** `DispatchShipmentUseCase` (ShippingModule — Sprint 16)
**Trigger:** Shipping order dispatched and confirmed

**Subscribers:**
| Subscriber | Action |
|-----------|--------|
| AuditService | Write `SHIPMENT_DISPATCHED` audit event |
| CMOModule | Increment `customer_manufacturing_order_lines.delivered_dozens` |
| CMOModule | Check if CMO is fully fulfilled → update `cmo_status` |
| FinishedGoodsModule | Decrement `finished_goods_bags.dozens_qty` |

---

## Event Ownership Matrix

| Event | Owner Module | Published In Sprint |
|-------|-------------|---------------------|
| GoodsReceived | InventoryModule | Sprint 11 |
| BagAvailable | PurchasingModule | Sprint 15 |
| BagReserved | InventoryModule | Sprint 11 |
| ReservationReleased | InventoryModule | Sprint 11 |
| InventoryAllocated | ProductionModule | Sprint 13 |
| InventoryConsumed | ProductionModule | Sprint 13 |
| InventoryReturned | ProductionModule | Sprint 13 |
| InventoryAdjusted | InventoryModule | Sprint 11 |
| ProductionStarted | ProductionModule | Sprint 13 |
| ProductionCompleted | ProductionModule | Sprint 13 |
| QualityApproved | QualityModule | Sprint 14 |
| ShipmentCompleted | ShippingModule | Sprint 16 |

---

## Event Implementation Timeline

| Sprint | Mechanism | Events Active |
|--------|-----------|--------------|
| 11 (Inventory Engine) | Synchronous direct calls + AuditService | EVT-001, EVT-003, EVT-004, EVT-008 |
| 13 (Production) | Synchronous direct calls + AuditService | + EVT-005, EVT-006, EVT-007, EVT-009, EVT-010 |
| 14 (Quality) | Synchronous | + EVT-011 |
| 15 (Purchasing) | Synchronous | + EVT-002 |
| 16 (Shipping) | Synchronous | + EVT-012 |
| 17 (Workflow) | NestJS EventEmitter2 introduced | All events migrated to EventEmitter2 |
| 20 (Production Readiness) | Evaluate message queue (Redis/RabbitMQ) | Async where needed |
