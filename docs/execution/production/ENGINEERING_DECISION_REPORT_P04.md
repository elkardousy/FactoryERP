# Engineering Decision Report — P04 WIP Inventory Management

| Field | Value |
|---|---|
| **Feature** | P04 — WIP Inventory Management |
| **Author** | Lead Backend Engineer |
| **Date** | 2026-06-30 |
| **Status** | APPROVED — implementation proceeds under documented constraints |

---

## EDR-P04-001: REST Command Endpoints Not Supported by Schema

### Problem

The P04 Master Execution Contract specifies the following REST command endpoints:

| Endpoint | Command |
|---|---|
| `POST /v1/production/wip` | CreateWip |
| `PATCH /v1/production/wip/:id/consume` | ConsumeWip |
| `PATCH /v1/production/wip/:id/transfer` | TransferWip |
| `PATCH /v1/production/wip/:id/complete` | CompleteWip |

### Schema Reality

The `wip_inventory` table is a **balance table** with optimistic locking:

```
wip_inventory {
  wip_id     BigInt PK
  order_id   BigInt FK → production_orders
  line_id    BigInt FK → production_lines
  part_id    BigInt FK → model_parts
  dozens_in_wip Decimal(12,3)
  version    BigInt
  last_updated DateTime
  @@unique([order_id, part_id])
}
```

There is **no** `wip_history`, `wip_movement`, `wip_transfer`, or `wip_audit_log` table. The schema does not support:
- Manual WIP creation (WIP is auto-created on first stage completion event)
- Manual WIP consumption (WIP is auto-updated per stage progression)
- WIP transfer (no transfer ledger table exists)
- Manual WIP completion (WIP reflects the last completed stage output; P06 handles clearance)

### Decision

**Command endpoints are deferred.** WIP state changes are driven exclusively by the `production.stage.completed` event (BR-S05). The event listener triggers `ProcessStageCompletionWipUseCase` which upserts `wip_inventory` and records `WIP_CONSUMPTION` inventory transactions.

**Implemented REST endpoints** (query-only):
- `GET /v1/production/wip` — list WIP positions (filter by order)
- `GET /v1/production/wip/:id` — get single WIP entry
- `GET /v1/production/wip/history` — WIP transaction history from `inventory_transactions`
- `GET /v1/production/progress` — production progress per order

Future schema extensions (new tables: `wip_movements`, `wip_transfers`) would unblock the deferred commands.

---

## EDR-P04-002: WIP History via inventory_transactions

### Problem

The MEC specifies `GetWipHistory` returning WIP movement history. There is no dedicated WIP history table.

### Decision

WIP history is derived from `inventory_transactions` filtered by:
- `txn_type = WIP_CONSUMPTION`
- `from_location_type = 'PRODUCTION_ORDER'`
- `from_location_id = order_id`

This pattern allows history reconstruction without a dedicated history table. Every WIP balance change creates exactly one `inventory_transactions` record per part, providing a complete immutable audit trail (BR-Inv03: atomic inventory transaction).

---

## EDR-P04-003: WIP Granularity — Per (order_id, part_id)

### Problem

The MEC implies WIP tracking per stage. The schema tracks WIP per `(order_id, part_id)` pair — not per stage.

### Decision

WIP is an **order-level balance per part**, updated on each stage completion. Each stage overwrites the balance with the stage's `output_dozens`. This reflects the manufacturing reality: at any moment, a production order has X dozens in progress (the output of the most recently completed stage).

The `inventory_transactions` records preserve the per-stage history for audit purposes.

---

## EDR-P04-004: WIP Upsert on First Stage vs. Subsequent Stages

### Problem

On first stage completion, no `wip_inventory` record exists. On subsequent completions, the record exists and must be updated with an optimistic lock (BR-W01, BR-W03).

### Decision

`ProductionWipRepository.upsertAndRecordTransaction()` implements a read-then-write pattern:
1. Read current record (or null)
2. If null: atomically `CREATE` wip_inventory + `CREATE` inventory_transaction (first stage)
3. If exists: atomically `UPDATE wip_inventory WHERE version = currentVersion` + `CREATE` inventory_transaction
4. If update count = 0 (version conflict): retry up to 3 times, then raise `ConflictException` (BR-W01)

The create + transaction and update + transaction operations use `executeInTransaction` for atomicity (BR-Inv03).

---

## EDR-P04-005: MEC Services Mapped to Use Cases

### Problem

The MEC specifies creating: `ProductionWipService`, `ProductionWipValidator`, `ProductionWipFactory`, `ProductionWipMapper`, `ProductionProgressCalculator`.

### Decision

Per the project's Clean Architecture (CLAUDE.md): "Use Cases hold all business logic for a feature. Services provide reusable, cross-cutting capabilities."

The WIP business logic fits entirely within use cases (not services) because:
- There is no cross-feature reuse of WIP logic within P04
- Validators are thin (preconditions embedded in use cases)
- Mapper functions are module-level functions in the DTO file
- Progress calculation is a single use case query

No standalone service files are created. Logic lives in use cases following the established P01–P03 pattern.
