# Engineering Decision Report — P10: Supplementary Material Requests Engine

| Field | Value |
|---|---|
| **Phase** | P10 — Supplementary Material Requests |
| **Status** | FINAL |
| **Date** | 2026-07-01 |
| **Author** | Claude Code (P10 MEC execution) |

---

## ED-P10-001 — No Approval/Rejection/Cancellation Metadata on `supplementary_material_requests`

**Problem:** The `supplementary_material_requests` schema contains only `transferred_by` and `transferred_at`. There are no `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `cancelled_by`, or `cancelled_at` columns. The P10 MEC implicitly requires approval/rejection/cancellation actors for accountability.

**Decision:** Approval, rejection, and cancellation actor identity and timestamp are recorded exclusively via `AuditService.log` (audit trail). The database schema stores only the `status` transition. No supplementary schema migration is performed in P10 — adding metadata columns requires explicit authorization per the Architecture Governance Rule.

**Impact:** The audit log provides full traceability but these fields are not queryable via the supplementary request API. A future schema migration (`ADD COLUMN approved_by`, etc.) would be required for direct query access.

---

## ED-P10-002 — No COMPLETED Status; TRANSFERRED Is the Terminal Success State

**Problem:** The P10 MEC defines a `CompleteSupplementaryRequest` command, but `SupplementaryStatusEnum` contains no `COMPLETED` value. The valid terminal states are `TRANSFERRED`, `REJECTED`, and `CANCELLED`.

**Decision:** `CompleteSupplementaryRequest` is NOT implemented as a separate command. `TRANSFERRED` is treated as the terminal success state (functionally equivalent to "completed"). After `TransferSupplementaryMaterial` transitions status to `TRANSFERRED`, the listener emits both `production.supplementary.transferred` and `production.supplementary.completed` events (chain reaction: `transferred` → listener emits `completed`), honoring the MEC's event contract without requiring a schema change.

**Impact:** There is no `COMPLETED` transition in the DB. The `production.supplementary.completed` event is emitted from the listener after `transferred`, not from a use case.

---

## ED-P10-003 — CreateSupplementaryRequest Creates Directly in PENDING_APPROVAL (DRAFT Bypassed)

**Problem:** `SupplementaryStatusEnum` includes `DRAFT`, and BR-Sup03 lists the lifecycle starting from `DRAFT`. However, the P10 MEC defines no `SubmitSupplementaryRequest` command, and the MEC's command list only includes `CreateSupplementaryRequest`.

**Decision:** `CreateSupplementaryRequest` creates the record directly in `PENDING_APPROVAL` status, bypassing `DRAFT`. The `DRAFT` status is a valid schema enum value reserved for potential future "save as draft" functionality outside P10 scope. This aligns with the MEC's intent (no Submit command defined).

**Impact:** No DRAFT→PENDING_APPROVAL transition exists in P10. A future MEC revision could add a `SubmitSupplementaryRequest` command if draft persistence is required.

---

## ED-P10-004 — NEGLIGENCE Reason Requires Mandatory Negligence Payload (BR-Sup01)

**Problem:** `supplementary_request_negligence.request_id @unique` enforces at most one negligence record per request. BR-Sup01 states that `NEGLIGENCE` reason type must trigger a `supplementary_request_negligence` record. The negligence data has many required fields (employee, stage, incident description) that cannot default.

**Decision:** When `reason_type = NEGLIGENCE`, the `negligence` object in the create DTO is **required**. The use case throws `BadRequestException` if `reason_type = NEGLIGENCE` but `negligence` is absent. When `reason_type = GENUINE_SHORTAGE`, the `negligence` field is ignored. The negligence record is created atomically in the same transaction as the supplementary request.

**Impact:** Callers must always provide negligence data for NEGLIGENCE requests. `reported_by` is set to the JWT actor (`actorId`). Optional negligence fields (`root_cause_category`, `corrective_action`, `preventive_action`, `warning_reference`, `warning_issued`) are passed through from the DTO.

---

## ED-P10-005 — SUPPLEMENTARY_RELEASE Inventory Transactions Written Directly in Repository (InventoryService Is Empty Stub)

**Problem:** `InventoryService` is an empty `@Injectable()` stub with no usable methods. The P10 MEC requires `SUPPLEMENTARY_RELEASE` inventory transactions per transferred line (BR-Sup05). The P10 MEC also states "Inventory remains the authoritative owner of stock movements."

**Decision:** Following the established pattern from P07 (`ProductionReturnsRepository`), the `ProductionSupplementaryRepository` writes directly to `inventory_transactions` inside `executeInTransaction`. The `SUPPLEMENTARY_RELEASE` `TxnTypeEnum` value exists in the schema and is used as-is. No `InventoryService` methods are invoked. This is consistent with how P07, P08, and the returns engine handle inventory transactions.

**Impact:** Inventory transactions are created atomically with the TRANSFERRED status update. If the transaction fails, neither the status update nor the inventory transaction is persisted. Transaction reference format: `SUP-{requestId}-L{lineId}`.

---

## ED-P10-006 — Full-Line Approval Only (approved_dozens = requested_dozens for All Lines)

**Problem:** The schema allows per-line `approved_dozens` to differ from `requested_dozens`, enabling partial approval. However, the P10 MEC defines no partial approval flow, and the `ApproveSupplementaryRequest` command has no per-line override DTO fields.

**Decision:** `ApproveSupplementaryRequest` sets `approved_dozens = requested_dozens` for **all lines** atomically. Partial approval (different quantities per line) is not supported in P10. All lines are approved at their requested quantity in a single bulk update.

**Impact:** The `approved_dozens` column is populated for all lines on approval. A future MEC revision with per-line approval overrides would require additional DTO fields and use case logic.

---

## ED-P10-007 — Sequence Code `'SUP_REQUEST'` for DocumentNumberingService (Deployment Prerequisite)

**Problem:** `DocumentNumberingService.generate(sequenceCode, date)` requires a matching row in the `number_sequences` table. The sequence code for supplementary request numbers has not been seeded previously (unlike `'PACKING'` which was seeded in P08).

**Decision:** The sequence code `'SUP_REQUEST'` is used. This **requires a seed row** in the `number_sequences` table before `CreateSupplementaryRequest` can succeed. The seed must be applied by a database administrator before P10 goes to production:

```sql
INSERT INTO factory.number_sequences (sequence_code, prefix, last_number, pad_length, suffix)
VALUES ('SUP_REQUEST', 'SUP', 0, 5, NULL)
ON CONFLICT DO NOTHING;
```

**Impact:** P10 cannot generate request numbers without this seed. This is a deployment prerequisite, not a code gap.
