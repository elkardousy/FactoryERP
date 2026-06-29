# Platform Completion Phase — Feature Log

## F01 — Warehouse Location Infrastructure
**Commit:** `2190efa`  
**Date:** 2026-06-29

### What was built
Zone → Rack → Shelf → Bin location hierarchy for `warehouse_locations` table.

**Files added:**
- `prisma/migrations/20260629120000_warehouse_location_infrastructure/migration.sql`
- `src/modules/warehouse-locations/dto/warehouse-location.dto.ts`
- `src/modules/warehouse-locations/repositories/warehouse-location.repository.ts`
- `src/modules/warehouse-locations/services/warehouse-location.service.ts`
- `src/modules/warehouse-locations/controllers/warehouse-locations.controller.ts`
- `src/modules/warehouse-locations/warehouse-locations.module.ts`
- `src/modules/warehouse-locations/use-cases/` (6 use cases + spec)

**Schema changes:**
- New `factory.warehouse_locations` table with hierarchy codes and capacity
- `physical_bags.location_id` FK to `warehouse_locations`

**Endpoints (all under `/v1/warehouse-locations`):**
- `POST /` — create location
- `GET /` — list (paginated after F04)
- `GET /warehouse/:id/hierarchy` — full zone/rack/shelf/bin tree
- `GET /:id` — get by ID
- `GET /:id/validate` — validate for bag assignment
- `PATCH /:id/status` — activate/deactivate

---

## F02 — Inventory Event Infrastructure
**Commit:** `fa8b18b`  
**Date:** 2026-06-29

### What was built
NestJS EventEmitter2 event bus for inventory domain events (per ADR-025 and INVENTORY_EVENT_FLOW.md).

**Files added:**
- `src/modules/inventory/events/inventory.events.ts` — 4 event classes
- `src/modules/inventory/events/inventory-event.publisher.ts` — typed emit wrapper
- `src/modules/inventory/events/inventory-event.listener.ts` — stub @OnEvent listeners

**Services wired:**
- `InventoryTransactionService` — emits `GoodsReceivedEvent` on receive
- `ReservationService` — emits `BagReservedEvent` on reserve; `ReservationReleasedEvent` on release/cancel
- `InventoryAdjustmentService` — emits `InventoryAdjustedEvent` on adjustment

**Events:**
| Event class | Event name | Payload |
|------------|-----------|---------|
| `GoodsReceivedEvent` | `inventory.goods_received` | txnId, txnRef, modelId, partId, warehouseId, dozensQty, actorId, occurredAt |
| `BagReservedEvent` | `inventory.bag_reserved` | reservationId, bagId, orderId, reservedDozens, reservedBy, occurredAt |
| `ReservationReleasedEvent` | `inventory.reservation_released` | reservationId, bagId, orderId, releasedBy, occurredAt |
| `InventoryAdjustedEvent` | `inventory.adjusted` | txnId, txnRef, warehouseId, modelId, partId, dozens, reason, actorId, occurredAt |

---

## F03 — Technical Debt Resolution
**Commit:** `c0b4cbb`  
**Date:** 2026-06-29

### What was resolved

**GAP-014 — Physical Bag Status Lag (RESOLVED):**
- `PhysicalBagsRepository.updateBagStatus(bagId, status)` added
- `ReservationService.reserve()` sets `RESERVED` after creating reservation
- `ReservationService.release()` / `cancel()` revert to `RECEIVED` when `sumActiveReservedDozens() === 0`

**Legacy endpoint deprecation:**
- `POST /v1/inventory/transactions/adjust` — deprecated via Swagger `@ApiOperation({ deprecated: true })`
- Canonical path: `POST /v1/inventory/adjustments`

**Documented (not yet fully resolved):**
- GAP-008 — Permission cache invalidation (awaits role management endpoints)
- GAP-015 — Optimistic locking on inventory_bags (deferred to Production Module)

---

## F04 — Performance Hardening
**Commit:** `baf6368`  
**Date:** 2026-06-29

### What was hardened

**Proper pagination added:**
- `GET /v1/warehouse-locations` now returns `PaginatedResult<LocationResponseDto>` with `page`/`limit`/`meta`
- New `findManyWithPagination` method in `WarehouseLocationRepository`

**Safety caps added to aggregate/reporting queries:**

| Repository | Method | Cap |
|-----------|--------|-----|
| `InventoryBagsRepository` | `findAllByWarehouse` | `take: 5000` |
| `InventoryBagsRepository` | `findAllByModel` | `take: 5000` |
| `InventoryReportingRepository` | `getStockPosition` | `take: 5000` |
| `InventoryReportingRepository` | `getVarianceReport` | `take: 500` |
| `InventoryIntegrationRepository` | `findAllWipPositions` | `take: 500` |
| `WarehouseLocationRepository` | `findMany` (hierarchy) | `take: 1000` |

**N+1 audit result:** No N+1 patterns found. All `groupBy` queries have covering indexes.

---

## F05 — Production Readiness Validation
**Date:** 2026-06-29

See `PLATFORM_FINAL_REPORT.md` for full engineering assessment.
