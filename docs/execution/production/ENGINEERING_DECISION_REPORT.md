# Engineering Decision Report — P01 Schema State Machine Conflict

**Date:** 2026-06-30  
**Feature:** P01 — Production Order Management  
**Triggered By:** Engineering Stop Condition — `Prisma conflict`  
**Status:** RESOLVED — Implementing with existing schema; schema extension deferred  

---

## 1. Conflict Description

The P01 Master Execution Contract specifies the following lifecycle:

```
DRAFT → PLANNED → APPROVED → READY → IN_PROGRESS → PAUSED → COMPLETED → CLOSED → CANCELLED
```

The existing `OrderStatusEnum` in `prisma/schema.prisma` contains:

```
DRAFT, PLANNED, IN_PRODUCTION, PRODUCTION_COMPLETE, CLOSED
```

**Delta (states in MEC but NOT in schema):**

| MEC State | Schema Equivalent | Action |
|---|---|---|
| APPROVED | (none) | Schema extension required |
| READY | (none) | Schema extension required |
| IN_PROGRESS | IN_PRODUCTION | Terminology difference; schema wins |
| PAUSED | (none) | Schema extension required |
| COMPLETED | PRODUCTION_COMPLETE | Terminology difference; schema wins |
| CANCELLED | (none) | Schema extension required |

**Missing tables referenced by MEC queries:**
- `GetProductionOrderTimeline` — no `production_order_status_history` table in schema
- `GetProductionOrderStatusHistory` — same

---

## 2. Authority Analysis

Per the P01 MEC Engineering Authority chain:
1. FEOS — engineering constitution
2. KEB — business and database knowledge
3. Production Master Execution Contract
4. Existing Repository
5. Existing ADRs

Per FEOS-01 Article V (Architecture Freeze Policy) and CLAUDE.md:
> "The committed `schema.prisma` is the authoritative source, not the live DB introspection."
> "prisma db pull is PROHIBITED"

The schema is the source of truth. The P01 MEC's proposed state machine extends the schema without an approved migration. Adding enum values to a PostgreSQL `ENUM` type requires a DDL `ALTER TYPE` migration executed by the `postgres` superuser per the established migration workflow (CLAUDE.md).

---

## 3. Resolution

### 3.1 Implement P01 with Existing Schema States

P01 is implemented using only `OrderStatusEnum` as it exists:

```
DRAFT → PLANNED → IN_PRODUCTION → PRODUCTION_COMPLETE → CLOSED
```

Terminology mapping applied:
- MEC "Start" = PLANNED → IN_PRODUCTION
- MEC "Complete" = IN_PRODUCTION → PRODUCTION_COMPLETE  
- MEC "Close" = PRODUCTION_COMPLETE → CLOSED

### 3.2 Commands Implemented (within schema)

| MEC Command | Implementation |
|---|---|
| CreateProductionOrder | ✓ IMPLEMENTED |
| UpdateProductionOrder | ✓ IMPLEMENTED |
| PlanProductionOrder | ✓ IMPLEMENTED (DRAFT → PLANNED) |
| StartProductionOrder | ✓ IMPLEMENTED (PLANNED → IN_PRODUCTION) |
| CompleteProductionOrder | ✓ IMPLEMENTED (IN_PRODUCTION → PRODUCTION_COMPLETE) |
| CloseProductionOrder | ✓ IMPLEMENTED (PRODUCTION_COMPLETE → CLOSED) |

### 3.3 Commands DEFERRED (schema extension required)

| MEC Command | Blocker | Required Migration |
|---|---|---|
| ApproveProductionOrder | APPROVED state missing | ALTER TYPE order_status_enum ADD VALUE 'APPROVED' |
| PauseProductionOrder | PAUSED state missing | ALTER TYPE order_status_enum ADD VALUE 'PAUSED' |
| ResumeProductionOrder | PAUSED state missing | Same as above |
| CancelProductionOrder | CANCELLED state missing | ALTER TYPE order_status_enum ADD VALUE 'CANCELLED' |

### 3.4 Queries DEFERRED (schema extension required)

| MEC Query | Blocker |
|---|---|
| GetProductionOrderTimeline | No `production_order_status_history` table |
| GetProductionOrderStatusHistory | Same |

These require a new table migration AND a history recording mechanism in every status-transition use case.

---

## 4. Schema Extension Request

The following schema changes are needed to fully implement the P01 MEC:

```sql
-- Add missing enum values (execute as postgres superuser)
ALTER TYPE factory.order_status_enum ADD VALUE 'APPROVED' AFTER 'PLANNED';
ALTER TYPE factory.order_status_enum ADD VALUE 'READY' AFTER 'APPROVED';
ALTER TYPE factory.order_status_enum ADD VALUE 'PAUSED' AFTER 'IN_PRODUCTION';
ALTER TYPE factory.order_status_enum ADD VALUE 'CANCELLED';

-- Add status history table
CREATE TABLE factory.production_order_status_history (
  history_id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES factory.production_orders(order_id),
  previous_status factory.order_status_enum,
  new_status factory.order_status_enum NOT NULL,
  changed_by BIGINT NOT NULL REFERENCES factory.users(user_id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);
CREATE INDEX idx_posh_order_id ON factory.production_order_status_history(order_id);
```

**Authorization required before executing.** This request must be approved before the deferred commands can be implemented.

---

## 5. Impact Assessment

- **No existing tests broken** — the schema states used in P01 are additive
- **P02–P11 unaffected** — none depend on the deferred states
- **API surface reduced** — 4 fewer command endpoints; 2 fewer query endpoints in this iteration
- **Business impact** — Approval workflow and pause/resume features are unavailable until schema extension approved

---

## 6. Decision

**Proceed with P01 implementation using existing schema states.**  
Record schema extension request for business owner approval.  
Resume deferred commands in a separate feature once migration is approved.
