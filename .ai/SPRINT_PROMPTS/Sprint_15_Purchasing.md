# Sprint 15 — Purchasing and Receiving

**Version target:** v0.8.0-purchasing
**Prerequisite:** Sprint 11 (Inventory Engine) complete

---

## Objectives

Implement the procurement cycle: purchase orders from suppliers, material receiving, and quality inspection on receipt. Receiving generates physical bags that feed the inventory system.

---

## Scope

### New Domain Module: `src/modules/purchasing/`

**Schema entities:**
- `purchase_orders` — procurement records from suppliers
- `purchase_order_items` — individual materials/quantities per PO
- `receiving_records` — actual receipt of goods against a PO
- `receiving_audit_items` — quality inspection records per received item

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `CreatePurchaseOrderUseCase` | Create PO from supplier with line items |
| `GetPurchaseOrderUseCase` | Retrieve PO with items and status |
| `ListPurchaseOrdersUseCase` | Paginated — filterable by supplier/status/date |
| `ConfirmPurchaseOrderUseCase` | Confirm PO with supplier (status: DRAFT → CONFIRMED) |
| `CancelPurchaseOrderUseCase` | Cancel an unconfirmed PO |
| `RecordReceivingUseCase` | Record physical receipt — creates physical bags per received item |
| `InspectReceivedItemUseCase` | Record quality inspection result |
| `GetReceivingReportUseCase` | Receipt vs. ordered quantities per PO |

---

## Architecture Constraints

- `RecordReceivingUseCase` must atomically create: receiving record + physical bags (via InventoryModule) + audit event
- POs in CONFIRMED status cannot be cancelled without approval
- Receiving is only allowed for CONFIRMED POs
- Supplier must be active at PO creation time
- `@Roles`: PO management = factory_manager+; receiving = warehouse_manager+

---

## Testing Requirements

- All 8 use cases must have test suites
- `RecordReceivingUseCase` tests: creates physical bags, handles partial receipt, rejects non-confirmed PO
- Minimum new tests: 40

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0, `npm run build` clean, all tests passing
- [ ] Receiving atomically creates physical bags in inventory
- [ ] PO status machine enforced (DRAFT → CONFIRMED → RECEIVED/PARTIALLY_RECEIVED/CANCELLED)
- [ ] ADR-030 written (Purchasing Architecture)

---

## Exit Criteria

Sprint 15 complete when all acceptance criteria checked, quality gates pass, `v0.8.0-purchasing` released.
