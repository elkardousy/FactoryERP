# 04 — Database Knowledge

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Database Facts

| Parameter | Value |
|-----------|-------|
| Engine | PostgreSQL 18 |
| Port | 5432 |
| Database name | `factory_erp` |
| Schema | `factory` |
| App user | `elkardousy` (limited privileges) |
| Superuser | `postgres` (required for DDL) |
| Prisma feature | `multiSchema` (preview) |
| PK type | `BigInt` (all tables) |
| Qty type | `Decimal(12,3)` |

---

## All Enums (32 total)

| Enum | Values |
|------|--------|
| `WarehouseTypeEnum` | RAW, WIP, FINISHED_GOODS |
| `ContainerStatusEnum` | DRAFT, IN_AUDIT, PENDING_APPROVAL, APPROVED, REJECTED, POSTED |
| `DiscrepancyTypeEnum` | SHORTAGE, OVERAGE, DAMAGE, UNEXPECTED |
| `ReleaseTypeEnum` | FULL, PARTIAL |
| `OrderStatusEnum` | DRAFT, PLANNED, IN_PRODUCTION, PRODUCTION_COMPLETE, CLOSED |
| `PartStatusEnum` | PENDING, RELEASED, COMPLETE, RETURNED |
| `StageStatusEnum` | PENDING, IN_PROGRESS, COMPLETE |
| `ScrapTypeEnum` | SEWING_DEFECT, MATERIAL_DEFECT, STAIN, DAMAGE, SIZE_ISSUE, OTHER |
| `IncompleteReasonEnum` | MISSING_PART, MISSING_MATERIAL, PRODUCTION_ISSUE, OTHER |
| `TxnTypeEnum` | RECEIVING, RELEASE, WIP_CONSUMPTION, QUALITY_OUTPUT, PACKING, RETURN, ADJUSTMENT, SUPPLEMENTARY_RELEASE |
| `BagStatusEnum` | RECEIVED, AVAILABLE, RESERVED, RELEASED, IN_WIP, RETURNED, CLOSED |
| `PackingOrderStatusEnum` | DRAFT, IN_PROCESS, ASSEMBLED, VERIFIED, POSTED, CANCELLED |
| `EmployeeTypeEnum` | WORKER, SUPERVISOR, MANAGER |
| `ShiftTypeEnum` | MORNING, AFTERNOON, NIGHT |
| `AttendanceStatusEnum` | PRESENT, ABSENT, HALF_DAY, LEAVE, PUBLIC_HOLIDAY |
| `MachineTypeEnum` | OVERLOCK, SINGER, ZIGZAG, TWO_NEEDLE, FORMATTER, TICKET, OTHER |
| `MachineStatusEnum` | INACTIVE, ACTIVE, BREAKDOWN, MAINTENANCE, STOPPED |
| `DowntimeReasonEnum` | BREAKDOWN, PREVENTIVE_MAINTENANCE, CORRECTIVE_MAINTENANCE, OPERATOR_STOP, POWER_FAILURE, MATERIAL_WAITING, CHANGEOVER, QUALITY_ISSUE, OTHER |
| `WorkflowStatusEnum` | DRAFT, PENDING, IN_REVIEW, APPROVED, REJECTED, ESCALATED, CANCELLED |
| `StepActionEnum` | SUBMITTED, APPROVED, REJECTED, ESCALATED, RECALLED, REASSIGNED |
| `SupplementaryReasonEnum` | NEGLIGENCE, GENUINE_SHORTAGE |
| `SupplementaryStatusEnum` | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, TRANSFERRED, CANCELLED |
| `CmoPriorityEnum` | LOW, NORMAL, HIGH, URGENT |
| `CmoStatusEnum` | DRAFT, CONFIRMED, IN_PROGRESS, PARTIALLY_DELIVERED, FULFILLED, CLOSED, CANCELLED |
| `CmoLineStatusEnum` | PENDING, RELEASED, IN_PRODUCTION, PRODUCED, PACKED, PARTIALLY_DELIVERED, FULLY_DELIVERED, CANCELLED |
| `ShippingOrderStatusEnum` | DRAFT, LOADING, LOADED, DISPATCHED, DELIVERED, CANCELLED |
| `RootCauseCategoryEnum` | ACTUAL_CONTAINER_SHORTAGE, PRODUCTION_LINE_NEGLIGENCE, EXCESSIVE_SCRAP, COUNTING_ERROR, QUALITY_REPLACEMENT, PACKAGING_LIST_VARIANCE, OTHER |
| `AccountabilityClosureEnum` | OPEN, IN_REVIEW, CLOSED |
| `InvestigationTypeEnum` | INVENTORY_VARIANCE, PHYSICAL_COUNT_DISCREPANCY, MISSING_BAG, MISSING_PART, CONTAINER_SHORTAGE, SUPPLEMENTARY_MATERIAL_ABUSE, OTHER |
| `PermissionTypeEnum` | VIEW, CREATE, UPDATE, DELETE, APPROVE, REJECT, CANCEL, PRINT, EXPORT |
| `UserStatusEnum` | ACTIVE, INACTIVE, LOCKED, PENDING_ACTIVATION |
| `ReservationStatusEnum` | ACTIVE, RELEASED, CANCELLED |

---

## All Models (98 total)

### Reference / Lookup Tables

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `customers` | `customer_id` | `@unique customer_code` |
| `suppliers` | `supplier_id` | `@unique supplier_code` |
| `colors` | `color_id` | `@unique color_code` |
| `sizes` | `size_id` | `@unique size_code` |
| `production_lines` | `line_id` | `@unique line_code` |
| `production_stages` | `stage_id` | `@unique stage_code`, `@unique sequence_order` |
| `departments` | `department_id` | Self-referential parent, `@unique dept_code` |
| `warehouses` | `warehouse_id` | `@unique warehouse_code` |
| `working_shifts` | `shift_id` | `@unique shift_code` |
| `vehicles` | `vehicle_id` | `@unique plate_number` |
| `drivers` | `driver_id` | Optional employee link |
| `fiscal_years` | `fiscal_year_id` | `@unique year_label` |
| `role_groups` | `role_group_id` | `@unique group_code` |

### Security / Auth Tables

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `roles` | `role_id` | `@unique role_code`, self-referential parent |
| `users` | `user_id` | `@unique username`, `@unique email` |
| `permissions` | `permission_id` | `@unique permission_code` |
| `role_permissions` | `[role_id, permission_id]` | Composite PK |
| `screens` | `screen_id` | `@unique screen_code`, self-referential |
| `screen_permissions` | `screen_permission_id` | `@@unique([role_id, screen_id, permission_type])` |
| `approval_permissions` | `approval_permission_id` | Time-bounded workflow approval |
| `user_sessions` | `session_id` | Refresh token hash, device tracking |
| `session_policy` | `session_policy_id` | `@unique role_id` (one policy per role) |
| `user_password_history` | `password_history_id` | Password reuse prevention |
| `password_reset_tokens` | `token_id` | `@unique token_hash` |

### Garment Models

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `models` | `model_id` | `@@unique([customer_id, model_code])`, GIN index on model_code |
| `model_parts` | `part_id` | `@@unique([model_id, part_code])` |
| `model_colors` | `model_color_id` | `@@unique([model_id, color_id])` |
| `model_sizes` | `model_size_id` | `@@unique([model_id, size_id])` |

### Container / Receiving

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `containers` | `container_id` | `@unique container_number` |
| `packaging_list_items` | `item_id` | `@@unique([container_id, model_id, part_id, color_id, size_id])` |
| `receiving_audit_items` | `audit_item_id` | |
| `receiving_discrepancies` | `discrepancy_id` | `variance_dozens @default(dbgenerated())` |

### Production

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `production_orders` | `order_id` | `@unique order_number`, GIN index on order_number |
| `production_order_parts` | `order_part_id` | `@@unique([order_id, part_id])` |
| `release_groups` | `release_group_id` | `@@unique([order_id, group_number])` |
| `release_group_lines` | `release_line_id` | |
| `production_stage_logs` | `log_id` | `@@unique([order_id, stage_id])` |
| `scrap_records` | `scrap_id` | |
| `incomplete_item_records` | `incomplete_id` | |
| `return_transactions` | `return_id` | |
| `wip_inventory` | `wip_id` | `@@unique([order_id, part_id])`, version field |

### Inventory (Core)

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `inventory_bags` | `bag_id` | `@@unique([warehouse_id, model_id, part_id])` |
| `inventory_transactions` | `[txn_id, executed_at]` | **COMPOSITE PK** — use `findFirst` not `findUnique` when filtering by `txn_id` alone |
| `physical_bags` | `bag_id` | `@unique bag_code` |
| `physical_bag_movements` | `movement_id` | |
| `physical_bag_reservations` | `reservation_id` | `@@unique([bag_id, order_id])` |
| `physical_bag_contents` | `content_id` | `@@unique([bag_id, color_id, size_id])` |
| `physical_bag_content_adjustments` | `adjustment_id` | |

### Packing / Quality

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `quality_output_boxes` | `box_id` | `@@unique([order_id, color_id, size_id])`, version field |
| `packing_patterns` | `pattern_id` | |
| `packing_pattern_lines` | `pattern_line_id` | `@@unique([pattern_id, color_id, size_id])` |
| `packing_orders` | `packing_order_id` | `@unique production_order_id` (one packing order per prod order) |
| `dozen_assemblies` | `assembly_id` | `@@unique([packing_order_id, assembly_sequence])` |
| `dozen_assembly_lines` | `assembly_line_id` | `@@unique([assembly_id, color_id, size_id])` |
| `packing_verifications` | `verification_id` | `@unique packing_order_id` |
| `finished_goods_bags` | `fg_bag_id` | |

### Employees / HR

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `employees` | `employee_id` | `@unique employee_code` |
| `employee_attendance` | `attendance_id` | `@@unique([employee_id, attendance_date, shift_type])` |
| `employee_stage_assignments` | `assignment_id` | `@@unique([employee_id, assignment_date, shift_type])` |
| `employee_daily_output` | `output_id` | `@@unique([employee_id, order_id, stage_id, output_date, shift_type])` |
| `stage_standard_minutes` | `smv_id` | `@@unique([model_id, stage_id, effective_from])` |
| `employee_kpi_daily` | `kpi_id` | `@@unique([employee_id, kpi_date, order_id, stage_id])` |
| `line_kpi_summary` | `summary_id` | `@@unique([line_id, period_type, period_start, order_id])` |

### Machines

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `machines` | `machine_id` | `@unique machine_code`, `@unique serial_number` |
| `machine_assignments` | `assignment_id` | |
| `machine_status_log` | `log_id` | |
| `machine_maintenance_schedule` | `schedule_id` | |
| `machine_downtime_events` | `downtime_id` | `duration_minutes @default(dbgenerated())` |
| `machine_oee_snapshots` | `snapshot_id` | `@@unique([machine_id, snapshot_date, shift_type])` |

### Workflows

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `workflow_templates` | `template_id` | `@unique template_code` |
| `workflow_template_steps` | `step_id` | `@@unique([template_id, step_number])` |
| `workflow_instances` | `instance_id` | `@@unique([entity_type, entity_id])` |
| `workflow_step_actions` | `action_id` | |

### Supplementary / Accountability

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `supplementary_material_requests` | `request_id` | `@unique request_number` |
| `supplementary_request_lines` | `line_id` | `@@unique([request_id, part_id])` |
| `supplementary_request_negligence` | `negligence_id` | `@unique request_id` |

### CMO / Shipping

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `customer_manufacturing_orders` | `cmo_id` | `@unique cmo_number` |
| `customer_manufacturing_order_lines` | `cmo_line_id` | `@@unique([cmo_id, model_id, color_id, size_id])`, `remaining_dozens @default(dbgenerated())` |
| `shipping_orders` | `shipping_order_id` | `@unique shipping_order_number` |
| `shipping_order_lines` | `shipping_line_id` | `@@unique([shipping_order_id, cmo_line_id])` |
| `shipping_line_fg_bags` | `id` | `@@unique([shipping_line_id, fg_bag_id])` |
| `vehicle_loadings` | `loading_id` | `@unique shipping_order_id` |
| `delivery_notes` | `delivery_note_id` | `@unique delivery_note_number`, `@unique shipping_order_id` |
| `proof_of_delivery` | `pod_id` | `@unique shipping_order_id` |

### Inventory Investigations

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `inventory_investigations` | `investigation_id` | `@unique investigation_number` |
| `inventory_investigation_actions` | `action_id` | |

### System / Infrastructure Tables

| Model | PK | Key Constraints |
|-------|-----|----------------|
| `audit_events` | `[event_id, occurred_at]` | **COMPOSITE PK** — GIN index on payload |
| `system_config` | `config_id` | `@unique config_key` |
| `number_sequences` | `sequence_id` | `@unique sequence_code` |
| `master_data_change_requests` | `change_request_id` | |
| `notifications` | `notification_id` | |
| `notification_preferences` | `preference_id` | `@@unique([user_id, notification_type, channel])` |
| `system_health_snapshots` | `snapshot_id` | |
| `job_definitions` | `job_id` | `@unique job_code` |
| `job_execution_log` | `execution_id` | |
| `db_backup_log` | `backup_id` | |
| `db_restore_log` | `restore_id` | |
| `db_maintenance_log` | `maintenance_id` | |

---

## Critical Database Invariants

### Composite PKs

Two tables have composite primary keys — requires special Prisma query patterns:

| Table | PK Fields | Prisma Impact |
|-------|-----------|--------------|
| `inventory_transactions` | `[txn_id, executed_at]` | Cannot use `findUnique` by `txn_id` alone — must use `findFirst({ where: { txn_id } })` |
| `audit_events` | `[event_id, occurred_at]` | Same pattern applies |

### Computed Columns (`@default(dbgenerated())`)

| Table | Column | Formula |
|-------|--------|---------|
| `receiving_discrepancies` | `variance_dozens` | `actual - expected` |
| `physical_bag_contents` | `dozens_qty` | `piece_count / 12` |
| `machine_downtime_events` | `duration_minutes` | `ended_at - started_at` |
| `employee_attendance` | `hours_present` | `check_out - check_in` |
| `employee_daily_output` | `net_pieces` | `gross - scrap` |
| `dozen_assembly_lines` | `dozens_consumed` | `pieces_consumed / 12` |
| `customer_manufacturing_order_lines` | `remaining_dozens` | `ordered - delivered` |
| `packing_verifications` | `variance_dozens` | `system - physical_count` |

### Optimistic Locking

Three tables use a `version BigInt @default(0)` field for optimistic concurrency control:

| Table | Use Case |
|-------|---------|
| `inventory_bags` | Concurrent dozens_on_hand updates |
| `wip_inventory` | Concurrent dozens_in_wip updates |
| `quality_output_boxes` | Concurrent dozens_available updates |
| `customer_manufacturing_order_lines` | Concurrent progress tracking |

### Unsupported Types

`inet` type (PostgreSQL IP address) is used in:
- `audit_events.ip_address`
- `user_sessions.ip_address`

Prisma represents these as `Unsupported("inet")` — cannot be read/written via Prisma Client directly.

---

## Key Indexes

### Inventory Transactions

```
@@index([model_id, executed_at])
@@index([txn_type, executed_at])
@@index([txn_reference])
@@index([executed_by, executed_at])
```

### Physical Bags

```
@@index([container_id])
@@index([model_id, part_id])
@@index([status])
@@index([current_warehouse_id])
@@index([current_order_id])
```

### Physical Bag Reservations

```
@@unique([bag_id, order_id])
@@index([bag_id, status])
@@index([order_id, status])
@@index([status])
```

### Production Orders

```
@@index([model_id])
@@index([line_id])
@@index([status])
@@index([created_at])
@@index([line_id, status, created_at, model_id, release_type])
@@index([cmo_line_id])
```

### GIN Indexes (managed in SQL, not PSL)

Two GIN indexes are managed via SQL scripts, not in `schema.prisma`:
- `idx_models_code_trgm` on `models.model_code` (trigram search)
- `idx_prod_orders_number_trgm` on `production_orders.order_number` (trigram search)
- `idx_audit_payload` on `audit_events.payload` (JSON search)

---

## Migrations

| Migration | Date | Purpose |
|-----------|------|---------|
| `20260627000000_initial_schema` | 2026-06-27 | Complete initial DDL (all tables, enums, indexes) |
| `20260627000001_inventory_schema_hardening` | 2026-06-27 | Inventory-specific schema hardening (constraints, indexes) |

Both migrations were executed as `postgres` superuser (not `elkardousy`) because `elkardousy` lacks `ALTER TABLE`/`CREATE TYPE` privileges on `factory` schema objects.

---

## Migration Workflow (FROZEN)

1. Write SQL to `prisma/migrations/<timestamp>_<name>/migration.sql`
2. Execute as superuser: `PGPASSWORD="<pw>" psql -U postgres -h localhost -p 5432 -d factory_erp -f <file>`
3. Mark applied: `DATABASE_URL="..." npx prisma migrate resolve --applied "<name>"`
4. Regenerate client: `DATABASE_URL="..." npx prisma generate`

**NEVER use `prisma migrate deploy`** — `elkardousy` lacks required privileges.  
**NEVER use `prisma db pull`** — overwrites committed schema, destroys enums and directives.
