# Technical Debt Status

Sprint: Platform Completion Phase — F03
Date: 2026-06-29

## Resolved

### GAP-014 — Physical Bag Status Lag
**Description:** `physical_bags.status` was not updated when reservations were created, released, or cancelled. The bag's status remained `RECEIVED` even after it had been reserved, causing stale reads from `GET /v1/inventory/bags/:id`.

**Resolution:**
- Added `PhysicalBagsRepository.updateBagStatus(bagId, status)` method.
- `ReservationService.reserve()` now calls `updateBagStatus(bag_id, RESERVED)` immediately after creating the reservation.
- `ReservationService.release()` and `cancel()` check `sumActiveReservedDozens()` after updating status; if remaining reservations drop to 0, bag status is reverted to `RECEIVED`.

**Files changed:**
- `src/modules/inventory/repositories/physical-bags.repository.ts` — added `updateBagStatus`
- `src/modules/inventory/services/reservation.service.ts` — added status sync calls

### Legacy Endpoint Deprecation — POST /v1/inventory/transactions/adjust
**Description:** The Sprint 10-era `POST /v1/inventory/transactions/adjust` endpoint uses the generic `TransactionRequestDto` and `AdjustInventoryCommand` flow, whereas the canonical path introduced in Sprint 11.3 is `POST /v1/inventory/adjustments` with `ApplyAdjustmentDto` (typed reason, delta validation).

**Resolution:** Added `deprecated: true` to `@ApiOperation` on the legacy endpoint. The endpoint remains functional for backwards compatibility but is marked deprecated in Swagger UI.

**Files changed:**
- `src/modules/inventory/controllers/inventory.controller.ts`

## Mitigated (Not Yet Fully Resolved)

### GAP-008 — Permission Cache Invalidation on Role Change
**Status:** Mitigated. `MemoryPermissionCache` has `invalidate(userId)` and `invalidateAll()` methods with a 5-minute TTL. No role management endpoints exist yet, so invalidation is never triggered in production. Will be addressed when the role management feature is implemented.

### GAP-015 — Optimistic Locking on Inventory Bags
**Status:** The `version` field exists in `inventory_bags` schema. Code-level optimistic lock implementation (compare-and-swap on version increment) is deferred to the Production Module, which introduces concurrent bag operations.
