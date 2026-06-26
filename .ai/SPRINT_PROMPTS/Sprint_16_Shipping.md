# Sprint 16 — Shipping and Delivery

**Version target:** v0.9.0-shipping
**Prerequisite:** Sprint 12 (CMO), Sprint 13 (Production) complete

---

## Objectives

Implement outbound shipping: packaging finished goods, creating delivery records against CMO line items, and tracking shipment status through to customer delivery confirmation.

---

## Scope

### New Domain Module: `src/modules/shipping/`

**Schema entities:**
- `shipments` — outbound delivery records
- `shipment_items` — line items per shipment linking to CMO line items
- `delivery_confirmations` — customer confirmation of receipt

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `CreateShipmentUseCase` | Create shipment from completed production orders |
| `GetShipmentUseCase` | Retrieve shipment with all items |
| `ListShipmentsUseCase` | Paginated — filterable by customer/status/date |
| `DispatchShipmentUseCase` | Mark shipment as dispatched |
| `ConfirmDeliveryUseCase` | Record customer delivery confirmation |
| `GetShipmentStatusUseCase` | Compute fulfillment vs. CMO quantities |
| `GetCustomerFulfillmentUseCase` | Fulfillment summary per customer/CMO |

---

## Architecture Constraints

- Shipment creation validates that referenced production orders are COMPLETED status
- `DispatchShipmentUseCase` marks shipment as DISPATCHED and updates CMO line item fulfillment counts
- `ConfirmDeliveryUseCase` emits a `DELIVERY_CONFIRMED` audit event with customer reference
- Partial shipments are allowed — a CMO can have multiple shipments
- `@Roles`: shipment management = factory_manager+; dispatch = warehouse_manager+

---

## Testing Requirements

- All 7 use cases must have test suites
- `CreateShipmentUseCase`: valid creation, non-completed production order rejection
- `DispatchShipmentUseCase`: updates CMO fulfillment counts, emits audit
- Minimum new tests: 35

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0, `npm run build` clean, all tests passing
- [ ] Partial shipments correctly update CMO fulfillment tracking
- [ ] Dispatch emits audit events with shipment ID and item count
- [ ] ADR-031 written (Shipping Architecture)

---

## Exit Criteria

Sprint 16 complete when all acceptance criteria checked, quality gates pass, `v0.9.0-shipping` released.
