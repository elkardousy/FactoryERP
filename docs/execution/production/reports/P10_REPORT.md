# P10 — Supplementary Material Requests Engine: Completion Report

| Field | Value |
|---|---|
| **Feature** | P10 — Supplementary Material Requests |
| **Status** | COMPLETE |
| **Commit** | 90bf553 |
| **Date** | 2026-07-01 |
| **Tests** | 464/464 PASS (28 new) |
| **Build** | PASS |
| **Lint** | PASS (0 errors) |
| **Prisma Validate** | PASS |

---

## Executive Summary

P10 implements the Supplementary Material Requests Engine. P10 owns request orchestration only — Inventory remains the authoritative owner of stock movements. Requests are raised against IN_PRODUCTION orders only (BR-Sup04). `CreateSupplementaryRequest` creates directly in PENDING_APPROVAL status (DRAFT bypassed — ED-P10-003). Full-line approval only (ED-P10-006). SUPPLEMENTARY_RELEASE inventory transactions are written directly in the repository following the P07 RETURN pattern (ED-P10-005). The `CompleteSupplementaryRequest` command is not implemented — TRANSFERRED is the terminal success state; the listener emits `completed` after `transferred` (ED-P10-002).

---

## Business Value

- Raises supplementary material requests against IN_PRODUCTION orders with full lifecycle management
- NEGLIGENCE reason type creates linked accountability record (`supplementary_request_negligence`) per BR-Sup01
- Auto-generated request numbers via DocumentNumberingService (sequence: `SUP_REQUEST`)
- SUPPLEMENTARY_RELEASE inventory transactions created per line on transfer (BR-Sup05)
- Full event chain: `requested` → `approved` → `transferred` → listener emits `completed`
- Approval restricted to MANAGER and above (BR-Sup06)
- Full audit trail for all status transitions (approval/rejection/cancellation actor in audit log — ED-P10-001)

---

## Files Created

| File | Purpose |
|---|---|
| `docs/execution/production/ENGINEERING_DECISION_REPORT_P10.md` | 7 engineering decisions |
| `src/modules/production/dto/production-supplementary.dto.ts` | Command/query DTOs, response types, mappers |
| `src/modules/production/repositories/production-supplementary.repository.ts` | All supplementary DB operations incl. transfer+inventory transactions |
| `src/modules/production/use-cases/create-supplementary-request/create-supplementary-request.use-case.ts` | CreateSupplementaryRequest |
| `src/modules/production/use-cases/approve-supplementary-request/approve-supplementary-request.use-case.ts` | ApproveSupplementaryRequest |
| `src/modules/production/use-cases/reject-supplementary-request/reject-supplementary-request.use-case.ts` | RejectSupplementaryRequest |
| `src/modules/production/use-cases/cancel-supplementary-request/cancel-supplementary-request.use-case.ts` | CancelSupplementaryRequest |
| `src/modules/production/use-cases/transfer-supplementary-material/transfer-supplementary-material.use-case.ts` | TransferSupplementaryMaterial |
| `src/modules/production/use-cases/get-supplementary-request/get-supplementary-request.use-case.ts` | GetSupplementaryRequest by id |
| `src/modules/production/use-cases/list-supplementary-requests/list-supplementary-requests.use-case.ts` | ListSupplementaryRequests with order/status/reason filters |
| `src/modules/production/use-cases/get-supplementary-history/get-supplementary-history.use-case.ts` | Paginated history (limit capped at 100) |
| `src/modules/production/use-cases/get-supplementary-summary/get-supplementary-summary.use-case.ts` | Summary aggregated by order_id |
| `src/modules/production/use-cases/supplementary-dashboard/supplementary-dashboard.use-case.ts` | Dashboard: total + by_status + by_reason |
| `src/modules/production/use-cases/production-supplementary.use-cases.spec.ts` | 28 unit tests across 10 suites |
| `src/modules/production/controllers/production-supplementary.controller.ts` | 10 REST endpoints |

## Files Modified

| File | Change |
|---|---|
| `src/modules/production/events/production.events.ts` | Added 6 supplementary events (PROD-020 through PROD-025) |
| `src/modules/production/events/production-event.publisher.ts` | Added 6 emit methods |
| `src/modules/production/events/production-event.listener.ts` | Added handlers PROD-020 through PROD-025; PROD-023 emits completed after transferred |
| `src/modules/production/production.module.ts` | Added `ProductionSupplementaryRepository`, 5 command use cases, 5 query use cases, `ProductionSupplementaryController` |

---

## Commands

| Command | Endpoint | Roles | Business Rules |
|---|---|---|---|
| CreateSupplementaryRequest | `POST /v1/production/supplementary` | SYSTEM_ADMIN, ADMIN, MANAGER, SUPERVISOR | BR-Sup01, BR-Sup04, ED-P10-003, ED-P10-004, ED-P10-007 |
| ApproveSupplementaryRequest | `PATCH /v1/production/supplementary/:id/approve` | SYSTEM_ADMIN, ADMIN, MANAGER | BR-Sup06, ED-P10-001, ED-P10-006 |
| RejectSupplementaryRequest | `PATCH /v1/production/supplementary/:id/reject` | SYSTEM_ADMIN, ADMIN, MANAGER, SUPERVISOR | ED-P10-001 |
| CancelSupplementaryRequest | `PATCH /v1/production/supplementary/:id/cancel` | SYSTEM_ADMIN, ADMIN, MANAGER, SUPERVISOR | ED-P10-001 |
| TransferSupplementaryMaterial | `PATCH /v1/production/supplementary/:id/transfer` | SYSTEM_ADMIN, ADMIN, MANAGER, SUPERVISOR | BR-Sup05, ED-P10-005 |

## Queries

| Query | Endpoint | Roles |
|---|---|---|
| GetSupplementarySummary | `GET /v1/production/supplementary/summary?order_id=X` | All authenticated |
| GetSupplementaryHistory | `GET /v1/production/supplementary/history` | All authenticated |
| SupplementaryDashboard | `GET /v1/production/supplementary/dashboard` | All authenticated |
| ListSupplementaryRequests | `GET /v1/production/supplementary` | All authenticated |
| GetSupplementaryRequest | `GET /v1/production/supplementary/:id` | All authenticated |

---

## Business Rules Enforced

| Rule | Where Enforced |
|---|---|
| BR-Sup01: NEGLIGENCE requires negligence record | `CreateSupplementaryRequestUseCase` validates negligence payload present |
| BR-Sup02: request_number auto-generated | `DocumentNumberingService.generate('SUP_REQUEST', date)` |
| BR-Sup03: lifecycle transitions | Each command use case validates allowed source statuses |
| BR-Sup04: only IN_PRODUCTION orders | `CreateSupplementaryRequestUseCase` checks order status |
| BR-Sup05: TRANSFERRED triggers SUPPLEMENTARY_RELEASE per line | `ProductionSupplementaryRepository.transferSupplementaryMaterial` |
| BR-Sup06: Approve requires MANAGER or above | Controller `@Roles` on `/approve` endpoint |

---

## Supplementary Request Lifecycle

```
CreateSupplementaryRequest (IN_PRODUCTION order only)
  → PENDING_APPROVAL (ED-P10-003: DRAFT bypassed)
  → Emit: production.supplementary.requested

ApproveSupplementaryRequest (MANAGER+)
  PENDING_APPROVAL → APPROVED
  → approved_dozens = requested_dozens for all lines (ED-P10-006)
  → Emit: production.supplementary.approved

TransferSupplementaryMaterial
  APPROVED → TRANSFERRED
  → SUPPLEMENTARY_RELEASE txn per line in inventory_transactions (BR-Sup05)
  → Emit: production.supplementary.transferred
    → Listener PROD-023 emits: production.supplementary.completed (ED-P10-002)

RejectSupplementaryRequest
  PENDING_APPROVAL | APPROVED → REJECTED
  → Emit: production.supplementary.rejected

CancelSupplementaryRequest
  DRAFT | PENDING_APPROVAL | APPROVED → CANCELLED
  → Emit: production.supplementary.summary.updated
```

---

## Event Integration

| Event | Published When | Handler |
|---|---|---|
| `production.supplementary.requested` | After CreateSupplementaryRequest | PROD-020 |
| `production.supplementary.approved` | After ApproveSupplementaryRequest | PROD-021 |
| `production.supplementary.rejected` | After RejectSupplementaryRequest | PROD-022 |
| `production.supplementary.transferred` | After TransferSupplementaryMaterial | PROD-023 (emits completed) |
| `production.supplementary.completed` | From PROD-023 listener (ED-P10-002) | PROD-024 |
| `production.supplementary.summary.updated` | After every command | PROD-025 |

---

## Tests Added (28 new — 10 suites)

| Suite | Tests | Coverage |
|---|---|---|
| `CreateSupplementaryRequestUseCase` | 6 | Happy path (GENUINE_SHORTAGE), happy path (NEGLIGENCE), order not found, not IN_PRODUCTION (BR-Sup04), no lines, NEGLIGENCE without negligence data (BR-Sup01) |
| `ApproveSupplementaryRequestUseCase` | 3 | Happy path, not found, not PENDING_APPROVAL |
| `RejectSupplementaryRequestUseCase` | 3 | Happy path (PENDING), not found, cannot reject TRANSFERRED |
| `CancelSupplementaryRequestUseCase` | 3 | Happy path (PENDING), not found, cannot cancel TRANSFERRED |
| `TransferSupplementaryMaterialUseCase` | 3 | Happy path (creates txns), not found, not APPROVED |
| `GetSupplementaryRequestUseCase` | 2 | Happy path, not found |
| `ListSupplementaryRequestsUseCase` | 2 | Filtered list, empty result |
| `GetSupplementaryHistoryUseCase` | 2 | Paginated, limit capped at 100 |
| `GetSupplementarySummaryUseCase` | 2 | With data (all statuses counted), empty order |
| `SupplementaryDashboardUseCase` | 2 | With data, empty dashboard |

---

## Engineering Decisions Summary

| ID | Decision |
|---|---|
| ED-P10-001 | No approval/rejection/cancellation metadata in DB — actor/timestamp in audit log only |
| ED-P10-002 | No COMPLETED status; TRANSFERRED = terminal success; listener emits `completed` after `transferred` |
| ED-P10-003 | Create goes directly to PENDING_APPROVAL — no Submit command / DRAFT bypassed |
| ED-P10-004 | NEGLIGENCE reason requires negligence payload; `request_id @unique` — one record per request |
| ED-P10-005 | SUPPLEMENTARY_RELEASE txns written directly in repository (InventoryService is empty stub) |
| ED-P10-006 | Full-line approval only — approved_dozens = requested_dozens for all lines |
| ED-P10-007 | SUP_REQUEST sequence code — deployment prerequisite: seed `number_sequences` table |

---

## Deployment Prerequisite

Before P10 can generate request numbers in production:

```sql
INSERT INTO factory.number_sequences (sequence_code, prefix, last_number, pad_length, suffix)
VALUES ('SUP_REQUEST', 'SUP', 0, 5, NULL)
ON CONFLICT DO NOTHING;
```

---

## Deferred Integration Points

| Integration | Target Phase | Trigger |
|---|---|---|
| `approved_by`, `approved_at`, `rejected_by`, `rejected_at` columns | Schema migration | Explicit authorization per Architecture Governance |
| Per-line partial approval | MEC revision | New DTO fields + use case logic |
| DRAFT state / Save-as-draft command | MEC revision | Add `SubmitSupplementaryRequest` command |

---

## Final Decision

P10 COMPLETE
