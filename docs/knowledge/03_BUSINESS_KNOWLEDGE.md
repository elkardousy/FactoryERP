# 03 — Business Knowledge

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Business Domain

FactoryERP is an Enterprise Resource Planning system for a **garment manufacturing factory**. The business produces garments in dozens (not individual pieces) for customers via Customer Manufacturing Orders (CMOs).

---

## Core Business Concepts

### Customers and Models

- A **Customer** places orders for specific garment **Models**.
- Models are identified by `customer_id + model_code` (unique composite).
- Each model has **Parts** (e.g., body, lining), **Colors**, and **Sizes**.
- A model can be produced in multiple color/size combinations.

### Containers and Physical Bags

- Raw materials arrive in **Containers** (shipments from suppliers).
- Each container is audited via **Receiving Audit Items** and checked for **Discrepancies**.
- Materials inside containers are organized into **Physical Bags**.
- Each physical bag has: `bag_code`, `received_dozens`, `current_dozens`, `status`, `current_warehouse_id`.
- A bag tracks its location (warehouse or production order) and can move between states.

### Inventory Bags (Aggregate Ledger)

- `inventory_bags` is an aggregate ledger: `{warehouse_id, model_id, part_id}` → `dozens_on_hand`.
- Updated by inventory transactions (not directly by bag movements).
- Uses an optimistic `version` field for concurrency control.

### Physical Bag Status Lifecycle

```
RECEIVED → AVAILABLE → RESERVED → RELEASED → IN_WIP → RETURNED/CLOSED
```

Statuses:
- `RECEIVED` — arrived, not yet available
- `AVAILABLE` — in warehouse, ready for reservation
- `RESERVED` — reserved for a production order
- `RELEASED` — issued to a production order
- `IN_WIP` — in work-in-progress
- `RETURNED` — returned from production
- `CLOSED` — fully consumed

### Dozens Measurement

All material quantities in the system are measured in **dozens** (`Decimal(12,3)`), not individual pieces.

---

## Production Flow

```
Customer Manufacturing Order (CMO)
         │
         ▼
   Production Order
         │
         ▼
   Material Release (from warehouse to production line)
         │
         ▼
   Production Stages (sequential: each stage has a log)
         │  ├── Scrap Records
         │  └── Incomplete Item Records
         ▼
   WIP Inventory
         │
         ▼
   Quality Output Boxes
         │
         ▼
   Packing Order
         │
         ▼
   Dozen Assembly (pattern-based assembly into dozens)
         │
         ▼
   Packing Verification
         │
         ▼
   Finished Goods Bags
         │
         ▼
   Shipping Order
         │
         ▼
   Delivery Note + Proof of Delivery
```

---

## Inventory Transaction Types (TxnTypeEnum)

| Type | Direction | Use Case |
|------|-----------|---------|
| `RECEIVING` | → Warehouse | Goods received from supplier/transfer |
| `RELEASE` | Warehouse → | Goods issued to production order or transferred out |
| `WIP_CONSUMPTION` | WIP → | Material consumed in production |
| `QUALITY_OUTPUT` | → | Quality-controlled output recorded |
| `PACKING` | → | Material packed for shipping |
| `RETURN` | → Warehouse | Material returned from production |
| `ADJUSTMENT` | ±Warehouse | Inventory count correction (positive or negative) |
| `SUPPLEMENTARY_RELEASE` | Warehouse → | Supplementary material release (negligence/shortage) |

### TRANSFER creates two atomic records

A TRANSFER between warehouses creates:
1. A `RELEASE` record (from source warehouse)
2. A `RECEIVING` record (at destination warehouse)

Both share the same `txn_reference` and are created in a single database transaction via `executeInTransaction`.

---

## Reservation System

Physical bags can be **reserved** for production orders before being physically released.

### ReservationStatusEnum

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Reservation is live, quantity is held |
| `RELEASED` | Reservation consumed — bag formally issued |
| `CANCELLED` | Reservation cancelled (includes expired reservations) |

**Note:** There is no `EXPIRED` status. The `/expire` API endpoint maps to `CANCELLED` status in the database. The endpoint exists for API clarity but stores the same status.

### Available Quantity Formula

```
available_dozens = bag.current_dozens - SUM(reserved_dozens WHERE status = ACTIVE)
```

### Duplicate Prevention

Two layers:
1. Application layer: `findByBagAndOrder()` check in `ReservationValidator` — throws `ConflictException (409)`.
2. Database layer: `@@unique([bag_id, order_id])` on `physical_bag_reservations`.

---

## Supplementary Material Requests

When production encounters a material shortage:
1. A **Supplementary Material Request** is created with a `reason_type` (NEGLIGENCE or GENUINE_SHORTAGE).
2. It goes through an approval workflow.
3. If approved, additional material is transferred from the warehouse.
4. If caused by negligence, a **Supplementary Request Negligence** record is created.

---

## Workflow Approval System

Multi-step approval workflows defined by **Workflow Templates** with sequential steps.

- Each step has a `required_role_id` and `sla_hours`.
- Instances track `current_step_number` and `status`.
- Actions: SUBMITTED, APPROVED, REJECTED, ESCALATED, RECALLED, REASSIGNED.

---

## Customer Manufacturing Orders (CMO)

- Customers place orders specifying model/color/size/dozens combinations.
- CMO lines track `ordered_dozens`, `released_dozens`, `produced_dozens`, `packed_dozens`, `delivered_dozens`.
- `remaining_dozens` is a computed column.
- Production orders are linked to CMO lines via `cmo_line_id`.

---

## Shipping and Delivery

- **Shipping Orders** aggregate finished goods for delivery.
- **Vehicle Loadings** track loading process.
- **Delivery Notes** are issued at dispatch.
- **Proof of Delivery** records customer acknowledgment.

---

## KPI and Performance Tracking

- **Employee KPI Daily** — efficiency, productivity, scrap % per employee per day.
- **Line KPI Summary** — aggregated line performance by period.
- **Machine OEE Snapshots** — Availability × Performance × Quality per shift.
- **Stage Standard Minutes** — SMV (Standard Minute Value) per model/stage for efficiency calculation.

---

## Authorization Model

### Roles (Hierarchical)

```
SystemRoles (system-level, non-hierarchical enum):
  SYSTEM_ADMIN → ADMIN → MANAGER → SUPERVISOR → STAFF
```

- Roles can have parent roles (`parent_role_id`).
- `hierarchy_level` field for ordering.
- `is_system_role` flag for built-in roles.

### Permissions (Screen-Level)

- `permissions` table: permission codes.
- `role_permissions` table: which roles have which permissions.
- `screen_permissions` table: fine-grained per-screen CRUD permissions per role.
- `approval_permissions` table: workflow approval delegation.
- `session_policy` table: per-role session timeout/concurrency limits.

---

## Document Numbering

- `number_sequences` table manages auto-generated document numbers.
- Pattern templates define format (e.g., `PO-{YYYY}-{SEQ}`).
- `DocumentNumberingService` generates next number in sequence.
- `is_db_managed` flag indicates if sequence is DB-managed.

---

## Inventory Investigation System

When inventory discrepancies are found:
1. An `inventory_investigation` is opened with a type and description.
2. Actions are recorded in `inventory_investigation_actions`.
3. Root cause categories: ACTUAL_CONTAINER_SHORTAGE, PRODUCTION_LINE_NEGLIGENCE, EXCESSIVE_SCRAP, COUNTING_ERROR, QUALITY_REPLACEMENT, PACKAGING_LIST_VARIANCE, OTHER.
4. Closure tracked with `AccountabilityClosureEnum`: OPEN, IN_REVIEW, CLOSED.

---

## Fiscal Year Management

- `fiscal_years` table tracks open/closed fiscal years.
- Closing a fiscal year locks historical data.

---

## System Configuration

- `system_config` table: key-value configuration store with category and type information.
- Runtime-editable settings (when `is_editable = true`).

---

## Notification System

- `notifications` table: in-app notifications per user.
- `notification_preferences`: per-user channel preferences.
- Channels: `IN_APP` (default), others TBD.

---

## Database & Backup Operations

- `db_backup_log`: tracks database backup operations.
- `db_restore_log`: tracks restore operations (requires `authorized_by` user).
- `db_maintenance_log`: tracks maintenance operations (VACUUM, REINDEX, etc.).
- `job_definitions`: scheduled job registry with cron expressions.
- `job_execution_log`: tracks job run history.
- `system_health_snapshots`: periodic health metric snapshots.
