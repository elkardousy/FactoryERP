-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "factory";

-- CreateEnum
CREATE TYPE "factory"."warehouse_type_enum" AS ENUM ('RAW', 'WIP', 'FINISHED_GOODS');

-- CreateEnum
CREATE TYPE "factory"."container_status_enum" AS ENUM ('DRAFT', 'IN_AUDIT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED');

-- CreateEnum
CREATE TYPE "factory"."discrepancy_type_enum" AS ENUM ('SHORTAGE', 'OVERAGE', 'DAMAGE', 'UNEXPECTED');

-- CreateEnum
CREATE TYPE "factory"."release_type_enum" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "factory"."order_status_enum" AS ENUM ('DRAFT', 'PLANNED', 'IN_PRODUCTION', 'PRODUCTION_COMPLETE', 'CLOSED');

-- CreateEnum
CREATE TYPE "factory"."part_status_enum" AS ENUM ('PENDING', 'RELEASED', 'COMPLETE', 'RETURNED');

-- CreateEnum
CREATE TYPE "factory"."stage_status_enum" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "factory"."scrap_type_enum" AS ENUM ('SEWING_DEFECT', 'MATERIAL_DEFECT', 'STAIN', 'DAMAGE', 'SIZE_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "factory"."incomplete_reason_enum" AS ENUM ('MISSING_PART', 'MISSING_MATERIAL', 'PRODUCTION_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "factory"."txn_type_enum" AS ENUM ('RECEIVING', 'RELEASE', 'WIP_CONSUMPTION', 'QUALITY_OUTPUT', 'PACKING', 'RETURN', 'ADJUSTMENT', 'SUPPLEMENTARY_RELEASE');

-- CreateEnum
CREATE TYPE "factory"."bag_status_enum" AS ENUM ('RECEIVED', 'AVAILABLE', 'RESERVED', 'RELEASED', 'IN_WIP', 'RETURNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "factory"."packing_order_status_enum" AS ENUM ('DRAFT', 'IN_PROCESS', 'ASSEMBLED', 'VERIFIED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "factory"."employee_type_enum" AS ENUM ('WORKER', 'SUPERVISOR', 'MANAGER');

-- CreateEnum
CREATE TYPE "factory"."shift_type_enum" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "factory"."attendance_status_enum" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'PUBLIC_HOLIDAY');

-- CreateEnum
CREATE TYPE "factory"."machine_type_enum" AS ENUM ('OVERLOCK', 'SINGER', 'ZIGZAG', 'TWO_NEEDLE', 'FORMATTER', 'TICKET', 'OTHER');

-- CreateEnum
CREATE TYPE "factory"."machine_status_enum" AS ENUM ('INACTIVE', 'ACTIVE', 'BREAKDOWN', 'MAINTENANCE', 'STOPPED');

-- CreateEnum
CREATE TYPE "factory"."downtime_reason_enum" AS ENUM ('BREAKDOWN', 'PREVENTIVE_MAINTENANCE', 'CORRECTIVE_MAINTENANCE', 'OPERATOR_STOP', 'POWER_FAILURE', 'MATERIAL_WAITING', 'CHANGEOVER', 'QUALITY_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "factory"."workflow_status_enum" AS ENUM ('DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "factory"."step_action_enum" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'ESCALATED', 'RECALLED', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "factory"."supplementary_reason_enum" AS ENUM ('NEGLIGENCE', 'GENUINE_SHORTAGE');

-- CreateEnum
CREATE TYPE "factory"."supplementary_status_enum" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'TRANSFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "factory"."cmo_priority_enum" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "factory"."cmo_status_enum" AS ENUM ('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'PARTIALLY_DELIVERED', 'FULFILLED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "factory"."cmo_line_status_enum" AS ENUM ('PENDING', 'RELEASED', 'IN_PRODUCTION', 'PRODUCED', 'PACKED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "factory"."shipping_order_status_enum" AS ENUM ('DRAFT', 'LOADING', 'LOADED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "factory"."root_cause_category_enum" AS ENUM ('ACTUAL_CONTAINER_SHORTAGE', 'PRODUCTION_LINE_NEGLIGENCE', 'EXCESSIVE_SCRAP', 'COUNTING_ERROR', 'QUALITY_REPLACEMENT', 'PACKAGING_LIST_VARIANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "factory"."accountability_closure_enum" AS ENUM ('OPEN', 'IN_REVIEW', 'CLOSED');

-- CreateEnum
CREATE TYPE "factory"."investigation_type_enum" AS ENUM ('INVENTORY_VARIANCE', 'PHYSICAL_COUNT_DISCREPANCY', 'MISSING_BAG', 'MISSING_PART', 'CONTAINER_SHORTAGE', 'SUPPLEMENTARY_MATERIAL_ABUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "factory"."permission_type_enum" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CANCEL', 'PRINT', 'EXPORT');

-- CreateEnum
CREATE TYPE "factory"."user_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING_ACTIVATION');

-- CreateTable
CREATE TABLE "factory"."customers" (
    "customer_id" BIGSERIAL NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "factory"."suppliers" (
    "supplier_id" BIGSERIAL NOT NULL,
    "supplier_code" VARCHAR(20) NOT NULL,
    "supplier_name" VARCHAR(200) NOT NULL,
    "contact_info" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "factory"."colors" (
    "color_id" BIGSERIAL NOT NULL,
    "color_code" VARCHAR(20) NOT NULL,
    "color_name" VARCHAR(100) NOT NULL,
    "hex_value" CHAR(7),

    CONSTRAINT "colors_pkey" PRIMARY KEY ("color_id")
);

-- CreateTable
CREATE TABLE "factory"."sizes" (
    "size_id" BIGSERIAL NOT NULL,
    "size_code" VARCHAR(10) NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("size_id")
);

-- CreateTable
CREATE TABLE "factory"."production_lines" (
    "line_id" BIGSERIAL NOT NULL,
    "line_code" VARCHAR(10) NOT NULL,
    "line_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "production_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "factory"."warehouses" (
    "warehouse_id" BIGSERIAL NOT NULL,
    "warehouse_code" VARCHAR(20) NOT NULL,
    "warehouse_name" VARCHAR(200) NOT NULL,
    "warehouse_type" "factory"."warehouse_type_enum" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("warehouse_id")
);

-- CreateTable
CREATE TABLE "factory"."production_stages" (
    "stage_id" BIGSERIAL NOT NULL,
    "stage_code" VARCHAR(30) NOT NULL,
    "stage_name" VARCHAR(100) NOT NULL,
    "sequence_order" INTEGER NOT NULL,

    CONSTRAINT "production_stages_pkey" PRIMARY KEY ("stage_id")
);

-- CreateTable
CREATE TABLE "factory"."departments" (
    "department_id" BIGSERIAL NOT NULL,
    "dept_code" VARCHAR(20) NOT NULL,
    "dept_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_department_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "factory"."models" (
    "model_id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "model_code" VARCHAR(50) NOT NULL,
    "model_name" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "models_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "factory"."model_parts" (
    "part_id" BIGSERIAL NOT NULL,
    "model_id" BIGINT NOT NULL,
    "part_code" VARCHAR(10) NOT NULL,
    "part_description" VARCHAR(200),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "model_parts_pkey" PRIMARY KEY ("part_id")
);

-- CreateTable
CREATE TABLE "factory"."model_colors" (
    "model_color_id" BIGSERIAL NOT NULL,
    "model_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,

    CONSTRAINT "model_colors_pkey" PRIMARY KEY ("model_color_id")
);

-- CreateTable
CREATE TABLE "factory"."model_sizes" (
    "model_size_id" BIGSERIAL NOT NULL,
    "model_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,

    CONSTRAINT "model_sizes_pkey" PRIMARY KEY ("model_size_id")
);

-- CreateTable
CREATE TABLE "factory"."roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_code" VARCHAR(30) NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_role_id" BIGINT,
    "role_group" VARCHAR(50),
    "department_id" BIGINT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "hierarchy_level" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "factory"."users" (
    "user_id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200),
    "password_hash" VARCHAR(500) NOT NULL,
    "role_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),
    "department_id" BIGINT,
    "status" "factory"."user_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMPTZ(6),
    "locked_reason" VARCHAR(200),
    "updated_by" BIGINT,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "factory"."permissions" (
    "permission_id" BIGSERIAL NOT NULL,
    "permission_code" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "factory"."role_permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "factory"."audit_events" (
    "event_id" BIGSERIAL NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "ip_address" inet,
    "client_platform" VARCHAR(20),

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("event_id","occurred_at")
);

-- CreateTable
CREATE TABLE "factory"."packing_patterns" (
    "pattern_id" BIGSERIAL NOT NULL,
    "model_id" BIGINT NOT NULL,
    "pattern_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packing_patterns_pkey" PRIMARY KEY ("pattern_id")
);

-- CreateTable
CREATE TABLE "factory"."packing_pattern_lines" (
    "pattern_line_id" BIGSERIAL NOT NULL,
    "pattern_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "pieces_per_dozen" INTEGER NOT NULL,

    CONSTRAINT "packing_pattern_lines_pkey" PRIMARY KEY ("pattern_line_id")
);

-- CreateTable
CREATE TABLE "factory"."containers" (
    "container_id" BIGSERIAL NOT NULL,
    "container_number" VARCHAR(50) NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "arrival_date" DATE NOT NULL,
    "status" "factory"."container_status_enum" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" BIGINT,
    "approved_at" TIMESTAMPTZ(6),

    CONSTRAINT "containers_pkey" PRIMARY KEY ("container_id")
);

-- CreateTable
CREATE TABLE "factory"."packaging_list_items" (
    "item_id" BIGSERIAL NOT NULL,
    "container_id" BIGINT NOT NULL,
    "model_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "expected_dozens" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "packaging_list_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "factory"."receiving_audit_items" (
    "audit_item_id" BIGSERIAL NOT NULL,
    "container_id" BIGINT NOT NULL,
    "packaging_list_item_id" BIGINT,
    "model_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "actual_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "audited_by" BIGINT NOT NULL,
    "audited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receiving_audit_items_pkey" PRIMARY KEY ("audit_item_id")
);

-- CreateTable
CREATE TABLE "factory"."receiving_discrepancies" (
    "discrepancy_id" BIGSERIAL NOT NULL,
    "container_id" BIGINT NOT NULL,
    "packaging_list_item_id" BIGINT,
    "expected_dozens" DECIMAL(12,3),
    "actual_dozens" DECIMAL(12,3),
    "variance_dozens" DECIMAL(12,3),
    "discrepancy_type" "factory"."discrepancy_type_enum" NOT NULL,
    "notes" TEXT,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receiving_discrepancies_pkey" PRIMARY KEY ("discrepancy_id")
);

-- CreateTable
CREATE TABLE "factory"."production_orders" (
    "order_id" BIGSERIAL NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "model_id" BIGINT NOT NULL,
    "line_id" BIGINT NOT NULL,
    "release_type" "factory"."release_type_enum" NOT NULL,
    "status" "factory"."order_status_enum" NOT NULL DEFAULT 'DRAFT',
    "target_dozens" DECIMAL(12,3),
    "notes" TEXT,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_by" BIGINT,
    "closed_at" TIMESTAMPTZ(6),
    "cmo_line_id" BIGINT,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "factory"."production_order_parts" (
    "order_part_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "status" "factory"."part_status_enum" NOT NULL DEFAULT 'PENDING',
    "released_at" TIMESTAMPTZ(6),
    "released_by" BIGINT,

    CONSTRAINT "production_order_parts_pkey" PRIMARY KEY ("order_part_id")
);

-- CreateTable
CREATE TABLE "factory"."release_groups" (
    "release_group_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "group_number" INTEGER NOT NULL,
    "released_by" BIGINT NOT NULL,
    "released_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_groups_pkey" PRIMARY KEY ("release_group_id")
);

-- CreateTable
CREATE TABLE "factory"."release_group_lines" (
    "release_line_id" BIGSERIAL NOT NULL,
    "release_group_id" BIGINT NOT NULL,
    "order_part_id" BIGINT NOT NULL,
    "source_warehouse_id" BIGINT NOT NULL,
    "dozens_released" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "release_group_lines_pkey" PRIMARY KEY ("release_line_id")
);

-- CreateTable
CREATE TABLE "factory"."production_stage_logs" (
    "log_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "line_id" BIGINT NOT NULL,
    "status" "factory"."stage_status_enum" NOT NULL DEFAULT 'PENDING',
    "input_dozens" DECIMAL(12,3),
    "output_dozens" DECIMAL(12,3),
    "scrap_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "incomplete_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "started_by" BIGINT,
    "started_at" TIMESTAMPTZ(6),
    "completed_by" BIGINT,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "production_stage_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "factory"."scrap_records" (
    "scrap_id" BIGSERIAL NOT NULL,
    "log_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "scrap_type" "factory"."scrap_type_enum" NOT NULL,
    "dozens_scrapped" DECIMAL(12,3) NOT NULL,
    "color_id" BIGINT,
    "size_id" BIGINT,
    "notes" TEXT,
    "recorded_by" BIGINT NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrap_records_pkey" PRIMARY KEY ("scrap_id")
);

-- CreateTable
CREATE TABLE "factory"."incomplete_item_records" (
    "incomplete_id" BIGSERIAL NOT NULL,
    "log_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "reason_type" "factory"."incomplete_reason_enum" NOT NULL,
    "dozens_incomplete" DECIMAL(12,3) NOT NULL,
    "notes" TEXT,
    "recorded_by" BIGINT NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incomplete_item_records_pkey" PRIMARY KEY ("incomplete_id")
);

-- CreateTable
CREATE TABLE "factory"."return_transactions" (
    "return_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "destination_warehouse_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "dozens_returned" DECIMAL(12,3) NOT NULL,
    "returned_by" BIGINT NOT NULL,
    "returned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_transactions_pkey" PRIMARY KEY ("return_id")
);

-- CreateTable
CREATE TABLE "factory"."inventory_bags" (
    "bag_id" BIGSERIAL NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "model_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "dozens_on_hand" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "version" BIGINT NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_bags_pkey" PRIMARY KEY ("bag_id")
);

-- CreateTable
CREATE TABLE "factory"."wip_inventory" (
    "wip_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "line_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "dozens_in_wip" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "version" BIGINT NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wip_inventory_pkey" PRIMARY KEY ("wip_id")
);

-- CreateTable
CREATE TABLE "factory"."inventory_transactions" (
    "txn_id" BIGSERIAL NOT NULL,
    "txn_reference" VARCHAR(50) NOT NULL,
    "txn_type" "factory"."txn_type_enum" NOT NULL,
    "model_id" BIGINT NOT NULL,
    "part_id" BIGINT,
    "color_id" BIGINT,
    "size_id" BIGINT,
    "from_location_type" VARCHAR(20),
    "from_location_id" BIGINT,
    "to_location_type" VARCHAR(20),
    "to_location_id" BIGINT,
    "dozens_qty" DECIMAL(12,3) NOT NULL,
    "executed_by" BIGINT NOT NULL,
    "executed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("txn_id","executed_at")
);

-- CreateTable
CREATE TABLE "factory"."physical_bags" (
    "bag_id" BIGSERIAL NOT NULL,
    "bag_code" VARCHAR(30) NOT NULL,
    "container_id" BIGINT NOT NULL,
    "audit_item_id" BIGINT,
    "customer_id" BIGINT NOT NULL,
    "model_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "received_dozens" DECIMAL(12,3) NOT NULL,
    "current_dozens" DECIMAL(12,3) NOT NULL,
    "current_warehouse_id" BIGINT,
    "current_order_id" BIGINT,
    "status" "factory"."bag_status_enum" NOT NULL DEFAULT 'RECEIVED',
    "received_date" DATE NOT NULL,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_bags_pkey" PRIMARY KEY ("bag_id")
);

-- CreateTable
CREATE TABLE "factory"."physical_bag_movements" (
    "movement_id" BIGSERIAL NOT NULL,
    "bag_id" BIGINT NOT NULL,
    "from_status" "factory"."bag_status_enum",
    "to_status" "factory"."bag_status_enum" NOT NULL,
    "from_warehouse_id" BIGINT,
    "to_warehouse_id" BIGINT,
    "from_order_id" BIGINT,
    "to_order_id" BIGINT,
    "dozens_moved" DECIMAL(12,3),
    "movement_reason" VARCHAR(50) NOT NULL,
    "performed_by" BIGINT NOT NULL,
    "performed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "physical_bag_movements_pkey" PRIMARY KEY ("movement_id")
);

-- CreateTable
CREATE TABLE "factory"."physical_bag_reservations" (
    "reservation_id" BIGSERIAL NOT NULL,
    "bag_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "reserved_dozens" DECIMAL(12,3) NOT NULL,
    "reserved_by" BIGINT NOT NULL,
    "reserved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "physical_bag_reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "factory"."physical_bag_contents" (
    "content_id" BIGSERIAL NOT NULL,
    "bag_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "piece_count" INTEGER NOT NULL,
    "dozens_qty" DECIMAL(12,3),

    CONSTRAINT "physical_bag_contents_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "factory"."physical_bag_content_adjustments" (
    "adjustment_id" BIGSERIAL NOT NULL,
    "bag_id" BIGINT NOT NULL,
    "content_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "old_piece_count" INTEGER NOT NULL,
    "new_piece_count" INTEGER NOT NULL,
    "adjustment_reason" TEXT NOT NULL,
    "adjusted_by" BIGINT NOT NULL,
    "adjusted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_bag_content_adjustments_pkey" PRIMARY KEY ("adjustment_id")
);

-- CreateTable
CREATE TABLE "factory"."quality_output_boxes" (
    "box_id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "model_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "dozens_available" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "version" BIGINT NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_output_boxes_pkey" PRIMARY KEY ("box_id")
);

-- CreateTable
CREATE TABLE "factory"."packing_orders" (
    "packing_order_id" BIGSERIAL NOT NULL,
    "packing_order_no" VARCHAR(30) NOT NULL,
    "production_order_id" BIGINT NOT NULL,
    "pattern_id" BIGINT NOT NULL,
    "target_dozens" DECIMAL(12,3) NOT NULL,
    "assembled_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "verified_dozens" DECIMAL(12,3),
    "status" "factory"."packing_order_status_enum" NOT NULL DEFAULT 'DRAFT',
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_by" BIGINT,
    "started_at" TIMESTAMPTZ(6),
    "verified_by" BIGINT,
    "verified_at" TIMESTAMPTZ(6),
    "posted_by" BIGINT,
    "posted_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "packing_orders_pkey" PRIMARY KEY ("packing_order_id")
);

-- CreateTable
CREATE TABLE "factory"."dozen_assemblies" (
    "assembly_id" BIGSERIAL NOT NULL,
    "packing_order_id" BIGINT NOT NULL,
    "assembly_sequence" INTEGER NOT NULL,
    "dozens_assembled" DECIMAL(12,3) NOT NULL,
    "assembled_by" BIGINT NOT NULL,
    "assembled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "dozen_assemblies_pkey" PRIMARY KEY ("assembly_id")
);

-- CreateTable
CREATE TABLE "factory"."dozen_assembly_lines" (
    "assembly_line_id" BIGSERIAL NOT NULL,
    "assembly_id" BIGINT NOT NULL,
    "quality_box_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "pattern_line_id" BIGINT NOT NULL,
    "pieces_consumed" INTEGER NOT NULL,
    "dozens_consumed" DECIMAL(12,3),

    CONSTRAINT "dozen_assembly_lines_pkey" PRIMARY KEY ("assembly_line_id")
);

-- CreateTable
CREATE TABLE "factory"."packing_verifications" (
    "verification_id" BIGSERIAL NOT NULL,
    "packing_order_id" BIGINT NOT NULL,
    "system_dozens" DECIMAL(12,3) NOT NULL,
    "physical_count_dozens" DECIMAL(12,3) NOT NULL,
    "variance_dozens" DECIMAL(12,3),
    "variance_accepted" BOOLEAN NOT NULL DEFAULT false,
    "variance_notes" TEXT,
    "verified_by" BIGINT NOT NULL,
    "verified_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packing_verifications_pkey" PRIMARY KEY ("verification_id")
);

-- CreateTable
CREATE TABLE "factory"."finished_goods_bags" (
    "fg_bag_id" BIGSERIAL NOT NULL,
    "session_id" BIGINT,
    "model_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "dozens_qty" DECIMAL(12,3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cmo_line_id" BIGINT,

    CONSTRAINT "finished_goods_bags_pkey" PRIMARY KEY ("fg_bag_id")
);

-- CreateTable
CREATE TABLE "factory"."employees" (
    "employee_id" BIGSERIAL NOT NULL,
    "employee_code" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "national_id" VARCHAR(30),
    "employee_type" "factory"."employee_type_enum" NOT NULL,
    "department_id" BIGINT,
    "primary_stage_id" BIGINT,
    "primary_line_id" BIGINT,
    "hire_date" DATE NOT NULL,
    "termination_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "factory"."employee_attendance" (
    "attendance_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "shift_type" "factory"."shift_type_enum" NOT NULL,
    "status" "factory"."attendance_status_enum" NOT NULL,
    "check_in_time" TIME(6),
    "check_out_time" TIME(6),
    "hours_present" DECIMAL(4,2),
    "notes" TEXT,
    "recorded_by" BIGINT NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_attendance_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "factory"."employee_stage_assignments" (
    "assignment_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "line_id" BIGINT NOT NULL,
    "assignment_date" DATE NOT NULL,
    "shift_type" "factory"."shift_type_enum" NOT NULL,
    "assigned_by" BIGINT NOT NULL,

    CONSTRAINT "employee_stage_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "factory"."employee_daily_output" (
    "output_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "assignment_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "output_date" DATE NOT NULL,
    "shift_type" "factory"."shift_type_enum" NOT NULL,
    "gross_pieces" INTEGER NOT NULL DEFAULT 0,
    "scrap_pieces" INTEGER NOT NULL DEFAULT 0,
    "net_pieces" INTEGER,
    "target_pieces" INTEGER,
    "recorded_by" BIGINT NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_daily_output_pkey" PRIMARY KEY ("output_id")
);

-- CreateTable
CREATE TABLE "factory"."stage_standard_minutes" (
    "smv_id" BIGSERIAL NOT NULL,
    "model_id" BIGINT NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "smv_minutes" DECIMAL(6,3) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "set_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_standard_minutes_pkey" PRIMARY KEY ("smv_id")
);

-- CreateTable
CREATE TABLE "factory"."employee_kpi_daily" (
    "kpi_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "kpi_date" DATE NOT NULL,
    "order_id" BIGINT,
    "stage_id" BIGINT,
    "hours_present" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "gross_pieces" INTEGER NOT NULL DEFAULT 0,
    "scrap_pieces" INTEGER NOT NULL DEFAULT 0,
    "net_pieces" INTEGER NOT NULL DEFAULT 0,
    "target_pieces" INTEGER NOT NULL DEFAULT 0,
    "smv_minutes" DECIMAL(6,3),
    "efficiency_pct" DECIMAL(6,2),
    "productivity_pct" DECIMAL(6,2),
    "scrap_pct" DECIMAL(6,2),
    "attendance_flag" BOOLEAN NOT NULL DEFAULT false,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_kpi_daily_pkey" PRIMARY KEY ("kpi_id")
);

-- CreateTable
CREATE TABLE "factory"."line_kpi_summary" (
    "summary_id" BIGSERIAL NOT NULL,
    "line_id" BIGINT NOT NULL,
    "period_type" VARCHAR(10) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "order_id" BIGINT,
    "total_workers" INTEGER,
    "total_gross_pieces" INTEGER,
    "total_scrap_pieces" INTEGER,
    "total_net_pieces" INTEGER,
    "total_target_pieces" INTEGER,
    "avg_efficiency_pct" DECIMAL(6,2),
    "avg_scrap_pct" DECIMAL(6,2),
    "line_performance_pct" DECIMAL(6,2),
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_kpi_summary_pkey" PRIMARY KEY ("summary_id")
);

-- CreateTable
CREATE TABLE "factory"."machines" (
    "machine_id" BIGSERIAL NOT NULL,
    "machine_code" VARCHAR(30) NOT NULL,
    "machine_name" VARCHAR(100) NOT NULL,
    "machine_type" "factory"."machine_type_enum" NOT NULL,
    "serial_number" VARCHAR(100),
    "manufacturer" VARCHAR(100),
    "model_number" VARCHAR(100),
    "purchase_date" DATE,
    "warranty_expiry" DATE,
    "assigned_stage_id" BIGINT,
    "assigned_line_id" BIGINT,
    "status" "factory"."machine_status_enum" NOT NULL DEFAULT 'INACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("machine_id")
);

-- CreateTable
CREATE TABLE "factory"."machine_assignments" (
    "assignment_id" BIGSERIAL NOT NULL,
    "machine_id" BIGINT NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "line_id" BIGINT NOT NULL,
    "assigned_from" DATE NOT NULL,
    "assigned_to" DATE,
    "assigned_by" BIGINT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "machine_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "factory"."machine_status_log" (
    "log_id" BIGSERIAL NOT NULL,
    "machine_id" BIGINT NOT NULL,
    "from_status" "factory"."machine_status_enum",
    "to_status" "factory"."machine_status_enum" NOT NULL,
    "changed_by" BIGINT NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "machine_status_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "factory"."machine_maintenance_schedule" (
    "schedule_id" BIGSERIAL NOT NULL,
    "machine_id" BIGINT NOT NULL,
    "maintenance_type" VARCHAR(50) NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "completed_date" DATE,
    "technician_name" VARCHAR(200),
    "cost" DECIMAL(12,2),
    "notes" TEXT,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_maintenance_schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "factory"."machine_downtime_events" (
    "downtime_id" BIGSERIAL NOT NULL,
    "machine_id" BIGINT NOT NULL,
    "order_id" BIGINT,
    "downtime_reason" "factory"."downtime_reason_enum" NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "duration_minutes" DECIMAL(8,2),
    "reported_by" BIGINT NOT NULL,
    "resolved_by" BIGINT,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "notes" TEXT,

    CONSTRAINT "machine_downtime_events_pkey" PRIMARY KEY ("downtime_id")
);

-- CreateTable
CREATE TABLE "factory"."machine_oee_snapshots" (
    "snapshot_id" BIGSERIAL NOT NULL,
    "machine_id" BIGINT NOT NULL,
    "line_id" BIGINT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "shift_type" "factory"."shift_type_enum" NOT NULL,
    "order_id" BIGINT,
    "planned_time_min" DECIMAL(8,2) NOT NULL,
    "downtime_min" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "operating_time_min" DECIMAL(8,2),
    "actual_pieces" INTEGER NOT NULL DEFAULT 0,
    "theoretical_max" INTEGER,
    "good_pieces" INTEGER NOT NULL DEFAULT 0,
    "availability_pct" DECIMAL(6,2),
    "performance_pct" DECIMAL(6,2),
    "quality_pct" DECIMAL(6,2),
    "oee_pct" DECIMAL(6,2),
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_oee_snapshots_pkey" PRIMARY KEY ("snapshot_id")
);

-- CreateTable
CREATE TABLE "factory"."workflow_templates" (
    "template_id" BIGSERIAL NOT NULL,
    "template_code" VARCHAR(50) NOT NULL,
    "template_name" VARCHAR(200) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "factory"."workflow_template_steps" (
    "step_id" BIGSERIAL NOT NULL,
    "template_id" BIGINT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "step_name" VARCHAR(100) NOT NULL,
    "required_role_id" BIGINT NOT NULL,
    "sla_hours" INTEGER NOT NULL DEFAULT 24,
    "rejection_goes_to" INTEGER,
    "escalation_role_id" BIGINT,

    CONSTRAINT "workflow_template_steps_pkey" PRIMARY KEY ("step_id")
);

-- CreateTable
CREATE TABLE "factory"."workflow_instances" (
    "instance_id" BIGSERIAL NOT NULL,
    "template_id" BIGINT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "current_step_number" INTEGER NOT NULL DEFAULT 1,
    "status" "factory"."workflow_status_enum" NOT NULL DEFAULT 'DRAFT',
    "submitted_by" BIGINT NOT NULL,
    "submitted_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("instance_id")
);

-- CreateTable
CREATE TABLE "factory"."workflow_step_actions" (
    "action_id" BIGSERIAL NOT NULL,
    "instance_id" BIGINT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "action" "factory"."step_action_enum" NOT NULL,
    "action_by" BIGINT NOT NULL,
    "action_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,
    "entity_snapshot" JSONB,

    CONSTRAINT "workflow_step_actions_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE "factory"."supplementary_material_requests" (
    "request_id" BIGSERIAL NOT NULL,
    "request_number" VARCHAR(30) NOT NULL,
    "order_id" BIGINT NOT NULL,
    "reason_type" "factory"."supplementary_reason_enum" NOT NULL,
    "status" "factory"."supplementary_status_enum" NOT NULL DEFAULT 'DRAFT',
    "justification" TEXT NOT NULL,
    "requested_by" BIGINT NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferred_by" BIGINT,
    "transferred_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "supplementary_material_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "factory"."supplementary_request_lines" (
    "line_id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "order_part_id" BIGINT NOT NULL,
    "part_id" BIGINT NOT NULL,
    "source_warehouse_id" BIGINT NOT NULL,
    "requested_dozens" DECIMAL(12,3) NOT NULL,
    "approved_dozens" DECIMAL(12,3),
    "transferred_dozens" DECIMAL(12,3),
    "line_notes" TEXT,

    CONSTRAINT "supplementary_request_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "factory"."supplementary_request_negligence" (
    "negligence_id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "responsible_employee_id" BIGINT NOT NULL,
    "negligence_type" VARCHAR(50) NOT NULL,
    "stage_id" BIGINT NOT NULL,
    "incident_description" TEXT NOT NULL,
    "warning_issued" BOOLEAN NOT NULL DEFAULT false,
    "warning_reference" VARCHAR(100),
    "reported_by" BIGINT NOT NULL,
    "reported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "root_cause_category" "factory"."root_cause_category_enum",
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "closure_status" "factory"."accountability_closure_enum" NOT NULL DEFAULT 'OPEN',
    "closed_by" BIGINT,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "supplementary_request_negligence_pkey" PRIMARY KEY ("negligence_id")
);

-- CreateTable
CREATE TABLE "factory"."customer_manufacturing_orders" (
    "cmo_id" BIGSERIAL NOT NULL,
    "cmo_number" VARCHAR(20) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "customer_reference" VARCHAR(100),
    "priority" "factory"."cmo_priority_enum" NOT NULL DEFAULT 'NORMAL',
    "requested_delivery_date" DATE NOT NULL,
    "status" "factory"."cmo_status_enum" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" BIGINT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "customer_manufacturing_orders_pkey" PRIMARY KEY ("cmo_id")
);

-- CreateTable
CREATE TABLE "factory"."customer_manufacturing_order_lines" (
    "cmo_line_id" BIGSERIAL NOT NULL,
    "cmo_id" BIGINT NOT NULL,
    "model_id" BIGINT NOT NULL,
    "color_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "ordered_dozens" DECIMAL(12,3) NOT NULL,
    "released_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "produced_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "packed_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "delivered_dozens" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "remaining_dozens" DECIMAL(12,3),
    "line_status" "factory"."cmo_line_status_enum" NOT NULL DEFAULT 'PENDING',
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "customer_manufacturing_order_lines_pkey" PRIMARY KEY ("cmo_line_id")
);

-- CreateTable
CREATE TABLE "factory"."vehicles" (
    "vehicle_id" BIGSERIAL NOT NULL,
    "plate_number" VARCHAR(20) NOT NULL,
    "vehicle_type" VARCHAR(50),
    "capacity_dozens" DECIMAL(12,3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "factory"."drivers" (
    "driver_id" BIGSERIAL NOT NULL,
    "employee_id" BIGINT,
    "full_name" VARCHAR(200) NOT NULL,
    "phone_number" VARCHAR(30),
    "license_number" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("driver_id")
);

-- CreateTable
CREATE TABLE "factory"."shipping_orders" (
    "shipping_order_id" BIGSERIAL NOT NULL,
    "shipping_order_number" VARCHAR(20) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "status" "factory"."shipping_order_status_enum" NOT NULL DEFAULT 'DRAFT',
    "planned_dispatch_date" DATE NOT NULL,
    "vehicle_id" BIGINT,
    "driver_id" BIGINT,
    "dispatched_at" TIMESTAMPTZ(6),
    "dispatched_by" BIGINT,
    "notes" TEXT,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_orders_pkey" PRIMARY KEY ("shipping_order_id")
);

-- CreateTable
CREATE TABLE "factory"."shipping_order_lines" (
    "shipping_line_id" BIGSERIAL NOT NULL,
    "shipping_order_id" BIGINT NOT NULL,
    "cmo_line_id" BIGINT NOT NULL,
    "shipped_dozens" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "shipping_order_lines_pkey" PRIMARY KEY ("shipping_line_id")
);

-- CreateTable
CREATE TABLE "factory"."shipping_line_fg_bags" (
    "id" BIGSERIAL NOT NULL,
    "shipping_line_id" BIGINT NOT NULL,
    "fg_bag_id" BIGINT NOT NULL,
    "dozens_consumed" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "shipping_line_fg_bags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factory"."vehicle_loadings" (
    "loading_id" BIGSERIAL NOT NULL,
    "shipping_order_id" BIGINT NOT NULL,
    "loading_started_at" TIMESTAMPTZ(6),
    "loading_completed_at" TIMESTAMPTZ(6),
    "total_dozens_loaded" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "loaded_by" BIGINT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "vehicle_loadings_pkey" PRIMARY KEY ("loading_id")
);

-- CreateTable
CREATE TABLE "factory"."delivery_notes" (
    "delivery_note_id" BIGSERIAL NOT NULL,
    "delivery_note_number" VARCHAR(20) NOT NULL,
    "shipping_order_id" BIGINT NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issued_by" BIGINT NOT NULL,
    "customer_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "customer_acknowledged_at" TIMESTAMPTZ(6),
    "customer_acknowledged_name" VARCHAR(200),

    CONSTRAINT "delivery_notes_pkey" PRIMARY KEY ("delivery_note_id")
);

-- CreateTable
CREATE TABLE "factory"."proof_of_delivery" (
    "pod_id" BIGSERIAL NOT NULL,
    "shipping_order_id" BIGINT NOT NULL,
    "signature_image_path" VARCHAR(500),
    "photo_reference_path" VARCHAR(500),
    "received_by_name" VARCHAR(200),
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" BIGINT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "proof_of_delivery_pkey" PRIMARY KEY ("pod_id")
);

-- CreateTable
CREATE TABLE "factory"."inventory_investigations" (
    "investigation_id" BIGSERIAL NOT NULL,
    "investigation_number" VARCHAR(20) NOT NULL,
    "investigation_type" "factory"."investigation_type_enum" NOT NULL,
    "warehouse_id" BIGINT,
    "container_id" BIGINT,
    "bag_id" BIGINT,
    "model_id" BIGINT,
    "part_id" BIGINT,
    "description" TEXT NOT NULL,
    "root_cause_category" "factory"."root_cause_category_enum",
    "responsible_department_id" BIGINT,
    "responsible_employee_id" BIGINT,
    "corrective_action" TEXT,
    "preventive_action" TEXT,
    "closure_status" "factory"."accountability_closure_enum" NOT NULL DEFAULT 'OPEN',
    "reported_by" BIGINT NOT NULL,
    "reported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_by" BIGINT,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_investigations_pkey" PRIMARY KEY ("investigation_id")
);

-- CreateTable
CREATE TABLE "factory"."inventory_investigation_actions" (
    "action_id" BIGSERIAL NOT NULL,
    "investigation_id" BIGINT NOT NULL,
    "action_note" TEXT NOT NULL,
    "performed_by" BIGINT NOT NULL,
    "performed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_investigation_actions_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE "factory"."user_password_history" (
    "password_history_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "password_hash" VARCHAR(500) NOT NULL,
    "changed_by" BIGINT NOT NULL,
    "change_reason" VARCHAR(30) NOT NULL,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_password_history_pkey" PRIMARY KEY ("password_history_id")
);

-- CreateTable
CREATE TABLE "factory"."password_reset_tokens" (
    "token_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(500) NOT NULL,
    "issued_by" BIGINT,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "factory"."role_groups" (
    "role_group_id" BIGSERIAL NOT NULL,
    "group_code" VARCHAR(30) NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_groups_pkey" PRIMARY KEY ("role_group_id")
);

-- CreateTable
CREATE TABLE "factory"."screens" (
    "screen_id" BIGSERIAL NOT NULL,
    "screen_code" VARCHAR(60) NOT NULL,
    "screen_name" VARCHAR(150) NOT NULL,
    "module_name" VARCHAR(60) NOT NULL,
    "parent_screen_id" BIGINT,
    "menu_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "screens_pkey" PRIMARY KEY ("screen_id")
);

-- CreateTable
CREATE TABLE "factory"."screen_permissions" (
    "screen_permission_id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "screen_id" BIGINT NOT NULL,
    "permission_type" "factory"."permission_type_enum" NOT NULL,
    "is_granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_by" BIGINT NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screen_permissions_pkey" PRIMARY KEY ("screen_permission_id")
);

-- CreateTable
CREATE TABLE "factory"."approval_permissions" (
    "approval_permission_id" BIGSERIAL NOT NULL,
    "workflow_template_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "is_delegate" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMPTZ(6),
    "granted_by" BIGINT NOT NULL,

    CONSTRAINT "approval_permissions_pkey" PRIMARY KEY ("approval_permission_id")
);

-- CreateTable
CREATE TABLE "factory"."user_sessions" (
    "session_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "device_id" VARCHAR(200) NOT NULL,
    "device_platform" VARCHAR(20) NOT NULL,
    "ip_address" inet,
    "refresh_token_hash" VARCHAR(500),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "end_reason" VARCHAR(30),
    "revoked_by" BIGINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "factory"."session_policy" (
    "session_policy_id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "max_concurrent_sessions" INTEGER NOT NULL DEFAULT 1,
    "idle_timeout_minutes" INTEGER NOT NULL DEFAULT 60,
    "absolute_timeout_minutes" INTEGER NOT NULL DEFAULT 720,
    "updated_by" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_policy_pkey" PRIMARY KEY ("session_policy_id")
);

-- CreateTable
CREATE TABLE "factory"."system_config" (
    "config_id" BIGSERIAL NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT NOT NULL,
    "value_type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "factory"."fiscal_years" (
    "fiscal_year_id" BIGSERIAL NOT NULL,
    "year_label" VARCHAR(10) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "closed_by" BIGINT,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("fiscal_year_id")
);

-- CreateTable
CREATE TABLE "factory"."working_shifts" (
    "shift_id" BIGSERIAL NOT NULL,
    "shift_code" VARCHAR(20) NOT NULL,
    "shift_name" VARCHAR(50) NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "working_shifts_pkey" PRIMARY KEY ("shift_id")
);

-- CreateTable
CREATE TABLE "factory"."number_sequences" (
    "sequence_id" BIGSERIAL NOT NULL,
    "sequence_code" VARCHAR(50) NOT NULL,
    "applies_to_table" VARCHAR(100) NOT NULL,
    "pattern_template" VARCHAR(100) NOT NULL,
    "reset_frequency" VARCHAR(20) NOT NULL,
    "current_value" BIGINT NOT NULL DEFAULT 0,
    "is_db_managed" BOOLEAN NOT NULL DEFAULT true,
    "last_reset_at" TIMESTAMPTZ(6),
    "last_reset_by" BIGINT,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("sequence_id")
);

-- CreateTable
CREATE TABLE "factory"."master_data_change_requests" (
    "change_request_id" BIGSERIAL NOT NULL,
    "target_table" VARCHAR(100) NOT NULL,
    "target_id" BIGINT NOT NULL,
    "change_type" VARCHAR(20) NOT NULL,
    "proposed_payload" JSONB NOT NULL,
    "requested_by" BIGINT NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "master_data_change_requests_pkey" PRIMARY KEY ("change_request_id")
);

-- CreateTable
CREATE TABLE "factory"."notifications" (
    "notification_id" BIGSERIAL NOT NULL,
    "recipient_user_id" BIGINT NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "related_entity_type" VARCHAR(50),
    "related_entity_id" VARCHAR(50),
    "channel" VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "factory"."notification_preferences" (
    "preference_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("preference_id")
);

-- CreateTable
CREATE TABLE "factory"."system_health_snapshots" (
    "snapshot_id" BIGSERIAL NOT NULL,
    "component" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "metric_payload" JSONB,
    "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_snapshots_pkey" PRIMARY KEY ("snapshot_id")
);

-- CreateTable
CREATE TABLE "factory"."job_definitions" (
    "job_id" BIGSERIAL NOT NULL,
    "job_code" VARCHAR(50) NOT NULL,
    "job_name" VARCHAR(150) NOT NULL,
    "schedule_cron" VARCHAR(50) NOT NULL,
    "job_type" VARCHAR(30) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" BIGINT,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "job_definitions_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "factory"."job_execution_log" (
    "execution_id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    "rows_affected" INTEGER,
    "error_message" TEXT,
    "triggered_by" BIGINT,

    CONSTRAINT "job_execution_log_pkey" PRIMARY KEY ("execution_id")
);

-- CreateTable
CREATE TABLE "factory"."db_backup_log" (
    "backup_id" BIGSERIAL NOT NULL,
    "backup_type" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    "size_bytes" BIGINT,
    "storage_location" VARCHAR(500),
    "triggered_by" BIGINT,

    CONSTRAINT "db_backup_log_pkey" PRIMARY KEY ("backup_id")
);

-- CreateTable
CREATE TABLE "factory"."db_restore_log" (
    "restore_id" BIGSERIAL NOT NULL,
    "backup_id" BIGINT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    "reason" TEXT NOT NULL,
    "authorized_by" BIGINT NOT NULL,
    "performed_by" BIGINT NOT NULL,

    CONSTRAINT "db_restore_log_pkey" PRIMARY KEY ("restore_id")
);

-- CreateTable
CREATE TABLE "factory"."db_maintenance_log" (
    "maintenance_id" BIGSERIAL NOT NULL,
    "maintenance_type" VARCHAR(30) NOT NULL,
    "target_object" VARCHAR(150),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    "notes" TEXT,
    "triggered_by" BIGINT,

    CONSTRAINT "db_maintenance_log_pkey" PRIMARY KEY ("maintenance_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "factory"."customers"("customer_code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplier_code_key" ON "factory"."suppliers"("supplier_code");

-- CreateIndex
CREATE UNIQUE INDEX "colors_color_code_key" ON "factory"."colors"("color_code");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_size_code_key" ON "factory"."sizes"("size_code");

-- CreateIndex
CREATE UNIQUE INDEX "production_lines_line_code_key" ON "factory"."production_lines"("line_code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_warehouse_code_key" ON "factory"."warehouses"("warehouse_code");

-- CreateIndex
CREATE UNIQUE INDEX "production_stages_stage_code_key" ON "factory"."production_stages"("stage_code");

-- CreateIndex
CREATE UNIQUE INDEX "production_stages_sequence_order_key" ON "factory"."production_stages"("sequence_order");

-- CreateIndex
CREATE UNIQUE INDEX "departments_dept_code_key" ON "factory"."departments"("dept_code");

-- CreateIndex
CREATE INDEX "models_customer_id_idx" ON "factory"."models"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "models_customer_id_model_code_key" ON "factory"."models"("customer_id", "model_code");

-- CreateIndex
CREATE INDEX "model_parts_model_id_idx" ON "factory"."model_parts"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "model_parts_model_id_part_code_key" ON "factory"."model_parts"("model_id", "part_code");

-- CreateIndex
CREATE INDEX "model_colors_model_id_idx" ON "factory"."model_colors"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "model_colors_model_id_color_id_key" ON "factory"."model_colors"("model_id", "color_id");

-- CreateIndex
CREATE INDEX "model_sizes_model_id_idx" ON "factory"."model_sizes"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "model_sizes_model_id_size_id_key" ON "factory"."model_sizes"("model_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_code_key" ON "factory"."roles"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "factory"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "factory"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_code_key" ON "factory"."permissions"("permission_code");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_occurred_at_idx" ON "factory"."audit_events"("entity_type", "entity_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_user_id_occurred_at_idx" ON "factory"."audit_events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_event_type_occurred_at_idx" ON "factory"."audit_events"("event_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "packing_pattern_lines_pattern_id_color_id_size_id_key" ON "factory"."packing_pattern_lines"("pattern_id", "color_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "containers_container_number_key" ON "factory"."containers"("container_number");

-- CreateIndex
CREATE INDEX "containers_supplier_id_idx" ON "factory"."containers"("supplier_id");

-- CreateIndex
CREATE INDEX "containers_status_idx" ON "factory"."containers"("status");

-- CreateIndex
CREATE INDEX "containers_arrival_date_idx" ON "factory"."containers"("arrival_date");

-- CreateIndex
CREATE INDEX "packaging_list_items_container_id_idx" ON "factory"."packaging_list_items"("container_id");

-- CreateIndex
CREATE INDEX "packaging_list_items_model_id_part_id_idx" ON "factory"."packaging_list_items"("model_id", "part_id");

-- CreateIndex
CREATE UNIQUE INDEX "packaging_list_items_container_id_model_id_part_id_color_id_key" ON "factory"."packaging_list_items"("container_id", "model_id", "part_id", "color_id", "size_id");

-- CreateIndex
CREATE INDEX "receiving_audit_items_container_id_idx" ON "factory"."receiving_audit_items"("container_id");

-- CreateIndex
CREATE INDEX "receiving_discrepancies_container_id_idx" ON "factory"."receiving_discrepancies"("container_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_order_number_key" ON "factory"."production_orders"("order_number");

-- CreateIndex
CREATE INDEX "production_orders_model_id_idx" ON "factory"."production_orders"("model_id");

-- CreateIndex
CREATE INDEX "production_orders_line_id_idx" ON "factory"."production_orders"("line_id");

-- CreateIndex
CREATE INDEX "production_orders_status_idx" ON "factory"."production_orders"("status");

-- CreateIndex
CREATE INDEX "production_orders_created_at_idx" ON "factory"."production_orders"("created_at");

-- CreateIndex
CREATE INDEX "production_orders_line_id_status_created_at_model_id_releas_idx" ON "factory"."production_orders"("line_id", "status", "created_at", "model_id", "release_type");

-- CreateIndex
CREATE INDEX "production_orders_cmo_line_id_idx" ON "factory"."production_orders"("cmo_line_id");

-- CreateIndex
CREATE INDEX "production_order_parts_order_id_idx" ON "factory"."production_order_parts"("order_id");

-- CreateIndex
CREATE INDEX "production_order_parts_status_idx" ON "factory"."production_order_parts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "production_order_parts_order_id_part_id_key" ON "factory"."production_order_parts"("order_id", "part_id");

-- CreateIndex
CREATE INDEX "release_groups_order_id_idx" ON "factory"."release_groups"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "release_groups_order_id_group_number_key" ON "factory"."release_groups"("order_id", "group_number");

-- CreateIndex
CREATE INDEX "release_group_lines_release_group_id_idx" ON "factory"."release_group_lines"("release_group_id");

-- CreateIndex
CREATE INDEX "production_stage_logs_order_id_idx" ON "factory"."production_stage_logs"("order_id");

-- CreateIndex
CREATE INDEX "production_stage_logs_status_idx" ON "factory"."production_stage_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "production_stage_logs_order_id_stage_id_key" ON "factory"."production_stage_logs"("order_id", "stage_id");

-- CreateIndex
CREATE INDEX "scrap_records_order_id_recorded_at_idx" ON "factory"."scrap_records"("order_id", "recorded_at");

-- CreateIndex
CREATE INDEX "scrap_records_scrap_type_idx" ON "factory"."scrap_records"("scrap_type");

-- CreateIndex
CREATE INDEX "incomplete_item_records_order_id_idx" ON "factory"."incomplete_item_records"("order_id");

-- CreateIndex
CREATE INDEX "inventory_bags_warehouse_id_model_id_part_id_idx" ON "factory"."inventory_bags"("warehouse_id", "model_id", "part_id");

-- CreateIndex
CREATE INDEX "inventory_bags_model_id_idx" ON "factory"."inventory_bags"("model_id");

-- CreateIndex
CREATE INDEX "inventory_bags_model_id_part_id_warehouse_id_idx" ON "factory"."inventory_bags"("model_id", "part_id", "warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_bags_warehouse_id_model_id_part_id_key" ON "factory"."inventory_bags"("warehouse_id", "model_id", "part_id");

-- CreateIndex
CREATE INDEX "wip_inventory_order_id_part_id_idx" ON "factory"."wip_inventory"("order_id", "part_id");

-- CreateIndex
CREATE INDEX "wip_inventory_line_id_idx" ON "factory"."wip_inventory"("line_id");

-- CreateIndex
CREATE UNIQUE INDEX "wip_inventory_order_id_part_id_key" ON "factory"."wip_inventory"("order_id", "part_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_model_id_executed_at_idx" ON "factory"."inventory_transactions"("model_id", "executed_at");

-- CreateIndex
CREATE INDEX "inventory_transactions_txn_type_executed_at_idx" ON "factory"."inventory_transactions"("txn_type", "executed_at");

-- CreateIndex
CREATE INDEX "inventory_transactions_txn_reference_idx" ON "factory"."inventory_transactions"("txn_reference");

-- CreateIndex
CREATE INDEX "inventory_transactions_executed_by_executed_at_idx" ON "factory"."inventory_transactions"("executed_by", "executed_at");

-- CreateIndex
CREATE UNIQUE INDEX "physical_bags_bag_code_key" ON "factory"."physical_bags"("bag_code");

-- CreateIndex
CREATE INDEX "physical_bags_container_id_idx" ON "factory"."physical_bags"("container_id");

-- CreateIndex
CREATE INDEX "physical_bags_model_id_part_id_idx" ON "factory"."physical_bags"("model_id", "part_id");

-- CreateIndex
CREATE INDEX "physical_bags_status_idx" ON "factory"."physical_bags"("status");

-- CreateIndex
CREATE INDEX "physical_bags_current_warehouse_id_idx" ON "factory"."physical_bags"("current_warehouse_id");

-- CreateIndex
CREATE INDEX "physical_bag_movements_bag_id_performed_at_idx" ON "factory"."physical_bag_movements"("bag_id", "performed_at");

-- CreateIndex
CREATE UNIQUE INDEX "physical_bag_reservations_bag_id_order_id_key" ON "factory"."physical_bag_reservations"("bag_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "physical_bag_contents_bag_id_color_id_size_id_key" ON "factory"."physical_bag_contents"("bag_id", "color_id", "size_id");

-- CreateIndex
CREATE INDEX "quality_output_boxes_order_id_idx" ON "factory"."quality_output_boxes"("order_id");

-- CreateIndex
CREATE INDEX "quality_output_boxes_order_id_color_id_size_id_idx" ON "factory"."quality_output_boxes"("order_id", "color_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_output_boxes_order_id_color_id_size_id_key" ON "factory"."quality_output_boxes"("order_id", "color_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "packing_orders_production_order_id_key" ON "factory"."packing_orders"("production_order_id");

-- CreateIndex
CREATE INDEX "packing_orders_production_order_id_idx" ON "factory"."packing_orders"("production_order_id");

-- CreateIndex
CREATE INDEX "packing_orders_status_idx" ON "factory"."packing_orders"("status");

-- CreateIndex
CREATE INDEX "dozen_assemblies_packing_order_id_idx" ON "factory"."dozen_assemblies"("packing_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "dozen_assemblies_packing_order_id_assembly_sequence_key" ON "factory"."dozen_assemblies"("packing_order_id", "assembly_sequence");

-- CreateIndex
CREATE INDEX "dozen_assembly_lines_assembly_id_idx" ON "factory"."dozen_assembly_lines"("assembly_id");

-- CreateIndex
CREATE INDEX "dozen_assembly_lines_quality_box_id_idx" ON "factory"."dozen_assembly_lines"("quality_box_id");

-- CreateIndex
CREATE UNIQUE INDEX "dozen_assembly_lines_assembly_id_color_id_size_id_key" ON "factory"."dozen_assembly_lines"("assembly_id", "color_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "packing_verifications_packing_order_id_key" ON "factory"."packing_verifications"("packing_order_id");

-- CreateIndex
CREATE INDEX "finished_goods_bags_model_id_created_at_idx" ON "factory"."finished_goods_bags"("model_id", "created_at");

-- CreateIndex
CREATE INDEX "finished_goods_bags_customer_id_idx" ON "factory"."finished_goods_bags"("customer_id");

-- CreateIndex
CREATE INDEX "finished_goods_bags_cmo_line_id_idx" ON "factory"."finished_goods_bags"("cmo_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "factory"."employees"("employee_code");

-- CreateIndex
CREATE INDEX "employees_primary_stage_id_idx" ON "factory"."employees"("primary_stage_id");

-- CreateIndex
CREATE INDEX "employees_primary_line_id_idx" ON "factory"."employees"("primary_line_id");

-- CreateIndex
CREATE INDEX "employee_attendance_employee_id_attendance_date_idx" ON "factory"."employee_attendance"("employee_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "employee_attendance_employee_id_attendance_date_shift_type_key" ON "factory"."employee_attendance"("employee_id", "attendance_date", "shift_type");

-- CreateIndex
CREATE INDEX "employee_stage_assignments_order_id_stage_id_idx" ON "factory"."employee_stage_assignments"("order_id", "stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_stage_assignments_employee_id_assignment_date_shif_key" ON "factory"."employee_stage_assignments"("employee_id", "assignment_date", "shift_type");

-- CreateIndex
CREATE INDEX "employee_daily_output_employee_id_output_date_idx" ON "factory"."employee_daily_output"("employee_id", "output_date");

-- CreateIndex
CREATE INDEX "employee_daily_output_order_id_stage_id_output_date_idx" ON "factory"."employee_daily_output"("order_id", "stage_id", "output_date");

-- CreateIndex
CREATE UNIQUE INDEX "employee_daily_output_employee_id_order_id_stage_id_output__key" ON "factory"."employee_daily_output"("employee_id", "order_id", "stage_id", "output_date", "shift_type");

-- CreateIndex
CREATE INDEX "stage_standard_minutes_model_id_stage_id_effective_from_idx" ON "factory"."stage_standard_minutes"("model_id", "stage_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "stage_standard_minutes_model_id_stage_id_effective_from_key" ON "factory"."stage_standard_minutes"("model_id", "stage_id", "effective_from");

-- CreateIndex
CREATE INDEX "employee_kpi_daily_kpi_date_idx" ON "factory"."employee_kpi_daily"("kpi_date");

-- CreateIndex
CREATE UNIQUE INDEX "employee_kpi_daily_employee_id_kpi_date_order_id_stage_id_key" ON "factory"."employee_kpi_daily"("employee_id", "kpi_date", "order_id", "stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "line_kpi_summary_line_id_period_type_period_start_order_id_key" ON "factory"."line_kpi_summary"("line_id", "period_type", "period_start", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "machines_machine_code_key" ON "factory"."machines"("machine_code");

-- CreateIndex
CREATE UNIQUE INDEX "machines_serial_number_key" ON "factory"."machines"("serial_number");

-- CreateIndex
CREATE INDEX "machines_machine_type_idx" ON "factory"."machines"("machine_type");

-- CreateIndex
CREATE INDEX "machines_status_idx" ON "factory"."machines"("status");

-- CreateIndex
CREATE INDEX "machines_assigned_line_id_idx" ON "factory"."machines"("assigned_line_id");

-- CreateIndex
CREATE INDEX "machine_assignments_machine_id_assigned_from_idx" ON "factory"."machine_assignments"("machine_id", "assigned_from");

-- CreateIndex
CREATE INDEX "machine_downtime_events_machine_id_started_at_idx" ON "factory"."machine_downtime_events"("machine_id", "started_at");

-- CreateIndex
CREATE INDEX "machine_downtime_events_machine_id_idx" ON "factory"."machine_downtime_events"("machine_id");

-- CreateIndex
CREATE INDEX "machine_downtime_events_downtime_reason_started_at_idx" ON "factory"."machine_downtime_events"("downtime_reason", "started_at");

-- CreateIndex
CREATE INDEX "machine_oee_snapshots_snapshot_date_line_id_idx" ON "factory"."machine_oee_snapshots"("snapshot_date", "line_id");

-- CreateIndex
CREATE UNIQUE INDEX "machine_oee_snapshots_machine_id_snapshot_date_shift_type_key" ON "factory"."machine_oee_snapshots"("machine_id", "snapshot_date", "shift_type");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_template_code_key" ON "factory"."workflow_templates"("template_code");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_template_steps_template_id_step_number_key" ON "factory"."workflow_template_steps"("template_id", "step_number");

-- CreateIndex
CREATE INDEX "workflow_instances_entity_type_entity_id_idx" ON "factory"."workflow_instances"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "factory"."workflow_instances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_instances_entity_type_entity_id_key" ON "factory"."workflow_instances"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_step_actions_instance_id_action_at_idx" ON "factory"."workflow_step_actions"("instance_id", "action_at");

-- CreateIndex
CREATE INDEX "workflow_step_actions_action_by_action_at_idx" ON "factory"."workflow_step_actions"("action_by", "action_at");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_material_requests_request_number_key" ON "factory"."supplementary_material_requests"("request_number");

-- CreateIndex
CREATE INDEX "supplementary_material_requests_order_id_requested_at_idx" ON "factory"."supplementary_material_requests"("order_id", "requested_at");

-- CreateIndex
CREATE INDEX "supplementary_material_requests_status_idx" ON "factory"."supplementary_material_requests"("status");

-- CreateIndex
CREATE INDEX "supplementary_material_requests_reason_type_requested_at_idx" ON "factory"."supplementary_material_requests"("reason_type", "requested_at");

-- CreateIndex
CREATE INDEX "supplementary_request_lines_request_id_idx" ON "factory"."supplementary_request_lines"("request_id");

-- CreateIndex
CREATE INDEX "supplementary_request_lines_part_id_request_id_idx" ON "factory"."supplementary_request_lines"("part_id", "request_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_request_lines_request_id_part_id_key" ON "factory"."supplementary_request_lines"("request_id", "part_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplementary_request_negligence_request_id_key" ON "factory"."supplementary_request_negligence"("request_id");

-- CreateIndex
CREATE INDEX "supplementary_request_negligence_responsible_employee_id_re_idx" ON "factory"."supplementary_request_negligence"("responsible_employee_id", "reported_at");

-- CreateIndex
CREATE INDEX "supplementary_request_negligence_stage_id_reported_at_idx" ON "factory"."supplementary_request_negligence"("stage_id", "reported_at");

-- CreateIndex
CREATE INDEX "supplementary_request_negligence_root_cause_category_idx" ON "factory"."supplementary_request_negligence"("root_cause_category");

-- CreateIndex
CREATE INDEX "supplementary_request_negligence_closure_status_idx" ON "factory"."supplementary_request_negligence"("closure_status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_manufacturing_orders_cmo_number_key" ON "factory"."customer_manufacturing_orders"("cmo_number");

-- CreateIndex
CREATE INDEX "customer_manufacturing_orders_customer_id_idx" ON "factory"."customer_manufacturing_orders"("customer_id");

-- CreateIndex
CREATE INDEX "customer_manufacturing_orders_status_idx" ON "factory"."customer_manufacturing_orders"("status");

-- CreateIndex
CREATE INDEX "customer_manufacturing_orders_requested_delivery_date_idx" ON "factory"."customer_manufacturing_orders"("requested_delivery_date");

-- CreateIndex
CREATE INDEX "customer_manufacturing_order_lines_cmo_id_idx" ON "factory"."customer_manufacturing_order_lines"("cmo_id");

-- CreateIndex
CREATE INDEX "customer_manufacturing_order_lines_model_id_idx" ON "factory"."customer_manufacturing_order_lines"("model_id");

-- CreateIndex
CREATE INDEX "customer_manufacturing_order_lines_remaining_dozens_idx" ON "factory"."customer_manufacturing_order_lines"("remaining_dozens");

-- CreateIndex
CREATE UNIQUE INDEX "customer_manufacturing_order_lines_cmo_id_model_id_color_id_key" ON "factory"."customer_manufacturing_order_lines"("cmo_id", "model_id", "color_id", "size_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "factory"."vehicles"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_orders_shipping_order_number_key" ON "factory"."shipping_orders"("shipping_order_number");

-- CreateIndex
CREATE INDEX "shipping_orders_customer_id_idx" ON "factory"."shipping_orders"("customer_id");

-- CreateIndex
CREATE INDEX "shipping_orders_status_idx" ON "factory"."shipping_orders"("status");

-- CreateIndex
CREATE INDEX "shipping_orders_planned_dispatch_date_idx" ON "factory"."shipping_orders"("planned_dispatch_date");

-- CreateIndex
CREATE INDEX "shipping_order_lines_shipping_order_id_idx" ON "factory"."shipping_order_lines"("shipping_order_id");

-- CreateIndex
CREATE INDEX "shipping_order_lines_cmo_line_id_idx" ON "factory"."shipping_order_lines"("cmo_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_order_lines_shipping_order_id_cmo_line_id_key" ON "factory"."shipping_order_lines"("shipping_order_id", "cmo_line_id");

-- CreateIndex
CREATE INDEX "shipping_line_fg_bags_shipping_line_id_idx" ON "factory"."shipping_line_fg_bags"("shipping_line_id");

-- CreateIndex
CREATE INDEX "shipping_line_fg_bags_fg_bag_id_idx" ON "factory"."shipping_line_fg_bags"("fg_bag_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_line_fg_bags_shipping_line_id_fg_bag_id_key" ON "factory"."shipping_line_fg_bags"("shipping_line_id", "fg_bag_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_loadings_shipping_order_id_key" ON "factory"."vehicle_loadings"("shipping_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_notes_delivery_note_number_key" ON "factory"."delivery_notes"("delivery_note_number");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_notes_shipping_order_id_key" ON "factory"."delivery_notes"("shipping_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "proof_of_delivery_shipping_order_id_key" ON "factory"."proof_of_delivery"("shipping_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_investigations_investigation_number_key" ON "factory"."inventory_investigations"("investigation_number");

-- CreateIndex
CREATE INDEX "inventory_investigations_closure_status_idx" ON "factory"."inventory_investigations"("closure_status");

-- CreateIndex
CREATE INDEX "inventory_investigations_responsible_employee_id_idx" ON "factory"."inventory_investigations"("responsible_employee_id");

-- CreateIndex
CREATE INDEX "inventory_investigations_warehouse_id_idx" ON "factory"."inventory_investigations"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_investigation_actions_investigation_id_performed__idx" ON "factory"."inventory_investigation_actions"("investigation_id", "performed_at");

-- CreateIndex
CREATE INDEX "user_password_history_user_id_changed_at_idx" ON "factory"."user_password_history"("user_id", "changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "factory"."password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_status_idx" ON "factory"."password_reset_tokens"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "role_groups_group_code_key" ON "factory"."role_groups"("group_code");

-- CreateIndex
CREATE UNIQUE INDEX "screens_screen_code_key" ON "factory"."screens"("screen_code");

-- CreateIndex
CREATE UNIQUE INDEX "screen_permissions_role_id_screen_id_permission_type_key" ON "factory"."screen_permissions"("role_id", "screen_id", "permission_type");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_idx" ON "factory"."user_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_sessions_device_id_idx" ON "factory"."user_sessions"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_policy_role_id_key" ON "factory"."session_policy"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_config_key_key" ON "factory"."system_config"("config_key");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_year_label_key" ON "factory"."fiscal_years"("year_label");

-- CreateIndex
CREATE UNIQUE INDEX "working_shifts_shift_code_key" ON "factory"."working_shifts"("shift_code");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_sequence_code_key" ON "factory"."number_sequences"("sequence_code");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_is_read_created_at_idx" ON "factory"."notifications"("recipient_user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_notification_type_channel_key" ON "factory"."notification_preferences"("user_id", "notification_type", "channel");

-- CreateIndex
CREATE INDEX "system_health_snapshots_component_captured_at_idx" ON "factory"."system_health_snapshots"("component", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_definitions_job_code_key" ON "factory"."job_definitions"("job_code");

-- CreateIndex
CREATE INDEX "job_execution_log_job_id_started_at_idx" ON "factory"."job_execution_log"("job_id", "started_at");

-- CreateIndex
CREATE INDEX "job_execution_log_status_started_at_idx" ON "factory"."job_execution_log"("status", "started_at");

-- AddForeignKey
ALTER TABLE "factory"."departments" ADD CONSTRAINT "departments_parent_department_id_fkey" FOREIGN KEY ("parent_department_id") REFERENCES "factory"."departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."models" ADD CONSTRAINT "models_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "factory"."customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."model_parts" ADD CONSTRAINT "model_parts_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."model_colors" ADD CONSTRAINT "model_colors_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."model_colors" ADD CONSTRAINT "model_colors_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."model_sizes" ADD CONSTRAINT "model_sizes_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."model_sizes" ADD CONSTRAINT "model_sizes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."roles" ADD CONSTRAINT "roles_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "factory"."roles"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."roles" ADD CONSTRAINT "roles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "factory"."departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "factory"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "factory"."departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "factory"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "factory"."permissions"("permission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."audit_events" ADD CONSTRAINT "audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_patterns" ADD CONSTRAINT "packing_patterns_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_patterns" ADD CONSTRAINT "packing_patterns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_pattern_lines" ADD CONSTRAINT "packing_pattern_lines_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "factory"."packing_patterns"("pattern_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_pattern_lines" ADD CONSTRAINT "packing_pattern_lines_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_pattern_lines" ADD CONSTRAINT "packing_pattern_lines_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."containers" ADD CONSTRAINT "containers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "factory"."suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."containers" ADD CONSTRAINT "containers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."containers" ADD CONSTRAINT "containers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packaging_list_items" ADD CONSTRAINT "packaging_list_items_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "factory"."containers"("container_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packaging_list_items" ADD CONSTRAINT "packaging_list_items_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packaging_list_items" ADD CONSTRAINT "packaging_list_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packaging_list_items" ADD CONSTRAINT "packaging_list_items_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packaging_list_items" ADD CONSTRAINT "packaging_list_items_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_audit_items" ADD CONSTRAINT "receiving_audit_items_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "factory"."containers"("container_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_audit_items" ADD CONSTRAINT "receiving_audit_items_packaging_list_item_id_fkey" FOREIGN KEY ("packaging_list_item_id") REFERENCES "factory"."packaging_list_items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_audit_items" ADD CONSTRAINT "receiving_audit_items_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_audit_items" ADD CONSTRAINT "receiving_audit_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_audit_items" ADD CONSTRAINT "receiving_audit_items_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_audit_items" ADD CONSTRAINT "receiving_audit_items_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_audit_items" ADD CONSTRAINT "receiving_audit_items_audited_by_fkey" FOREIGN KEY ("audited_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_discrepancies" ADD CONSTRAINT "receiving_discrepancies_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "factory"."containers"("container_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."receiving_discrepancies" ADD CONSTRAINT "receiving_discrepancies_packaging_list_item_id_fkey" FOREIGN KEY ("packaging_list_item_id") REFERENCES "factory"."packaging_list_items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_orders" ADD CONSTRAINT "production_orders_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_orders" ADD CONSTRAINT "production_orders_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_orders" ADD CONSTRAINT "production_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_orders" ADD CONSTRAINT "production_orders_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_orders" ADD CONSTRAINT "production_orders_cmo_line_id_fkey" FOREIGN KEY ("cmo_line_id") REFERENCES "factory"."customer_manufacturing_order_lines"("cmo_line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_order_parts" ADD CONSTRAINT "production_order_parts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_order_parts" ADD CONSTRAINT "production_order_parts_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_order_parts" ADD CONSTRAINT "production_order_parts_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."release_groups" ADD CONSTRAINT "release_groups_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."release_groups" ADD CONSTRAINT "release_groups_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."release_group_lines" ADD CONSTRAINT "release_group_lines_release_group_id_fkey" FOREIGN KEY ("release_group_id") REFERENCES "factory"."release_groups"("release_group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."release_group_lines" ADD CONSTRAINT "release_group_lines_order_part_id_fkey" FOREIGN KEY ("order_part_id") REFERENCES "factory"."production_order_parts"("order_part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."release_group_lines" ADD CONSTRAINT "release_group_lines_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_stage_logs" ADD CONSTRAINT "production_stage_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_stage_logs" ADD CONSTRAINT "production_stage_logs_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_stage_logs" ADD CONSTRAINT "production_stage_logs_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_stage_logs" ADD CONSTRAINT "production_stage_logs_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."production_stage_logs" ADD CONSTRAINT "production_stage_logs_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."scrap_records" ADD CONSTRAINT "scrap_records_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "factory"."production_stage_logs"("log_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."scrap_records" ADD CONSTRAINT "scrap_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."scrap_records" ADD CONSTRAINT "scrap_records_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."scrap_records" ADD CONSTRAINT "scrap_records_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."scrap_records" ADD CONSTRAINT "scrap_records_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."scrap_records" ADD CONSTRAINT "scrap_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."incomplete_item_records" ADD CONSTRAINT "incomplete_item_records_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "factory"."production_stage_logs"("log_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."incomplete_item_records" ADD CONSTRAINT "incomplete_item_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."incomplete_item_records" ADD CONSTRAINT "incomplete_item_records_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."incomplete_item_records" ADD CONSTRAINT "incomplete_item_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."return_transactions" ADD CONSTRAINT "return_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."return_transactions" ADD CONSTRAINT "return_transactions_destination_warehouse_id_fkey" FOREIGN KEY ("destination_warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."return_transactions" ADD CONSTRAINT "return_transactions_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."return_transactions" ADD CONSTRAINT "return_transactions_returned_by_fkey" FOREIGN KEY ("returned_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_bags" ADD CONSTRAINT "inventory_bags_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_bags" ADD CONSTRAINT "inventory_bags_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_bags" ADD CONSTRAINT "inventory_bags_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."wip_inventory" ADD CONSTRAINT "wip_inventory_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."wip_inventory" ADD CONSTRAINT "wip_inventory_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."wip_inventory" ADD CONSTRAINT "wip_inventory_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "factory"."containers"("container_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_audit_item_id_fkey" FOREIGN KEY ("audit_item_id") REFERENCES "factory"."receiving_audit_items"("audit_item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "factory"."customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_current_warehouse_id_fkey" FOREIGN KEY ("current_warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_current_order_id_fkey" FOREIGN KEY ("current_order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bags" ADD CONSTRAINT "physical_bags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_movements" ADD CONSTRAINT "physical_bag_movements_bag_id_fkey" FOREIGN KEY ("bag_id") REFERENCES "factory"."physical_bags"("bag_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_movements" ADD CONSTRAINT "physical_bag_movements_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_movements" ADD CONSTRAINT "physical_bag_movements_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_movements" ADD CONSTRAINT "physical_bag_movements_from_order_id_fkey" FOREIGN KEY ("from_order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_movements" ADD CONSTRAINT "physical_bag_movements_to_order_id_fkey" FOREIGN KEY ("to_order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_movements" ADD CONSTRAINT "physical_bag_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_reservations" ADD CONSTRAINT "physical_bag_reservations_bag_id_fkey" FOREIGN KEY ("bag_id") REFERENCES "factory"."physical_bags"("bag_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_reservations" ADD CONSTRAINT "physical_bag_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_reservations" ADD CONSTRAINT "physical_bag_reservations_reserved_by_fkey" FOREIGN KEY ("reserved_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_contents" ADD CONSTRAINT "physical_bag_contents_bag_id_fkey" FOREIGN KEY ("bag_id") REFERENCES "factory"."physical_bags"("bag_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_contents" ADD CONSTRAINT "physical_bag_contents_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_contents" ADD CONSTRAINT "physical_bag_contents_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_content_adjustments" ADD CONSTRAINT "physical_bag_content_adjustments_bag_id_fkey" FOREIGN KEY ("bag_id") REFERENCES "factory"."physical_bags"("bag_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_content_adjustments" ADD CONSTRAINT "physical_bag_content_adjustments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "factory"."physical_bag_contents"("content_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_content_adjustments" ADD CONSTRAINT "physical_bag_content_adjustments_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_content_adjustments" ADD CONSTRAINT "physical_bag_content_adjustments_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."physical_bag_content_adjustments" ADD CONSTRAINT "physical_bag_content_adjustments_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."quality_output_boxes" ADD CONSTRAINT "quality_output_boxes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."quality_output_boxes" ADD CONSTRAINT "quality_output_boxes_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."quality_output_boxes" ADD CONSTRAINT "quality_output_boxes_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."quality_output_boxes" ADD CONSTRAINT "quality_output_boxes_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_orders" ADD CONSTRAINT "packing_orders_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_orders" ADD CONSTRAINT "packing_orders_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "factory"."packing_patterns"("pattern_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_orders" ADD CONSTRAINT "packing_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_orders" ADD CONSTRAINT "packing_orders_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_orders" ADD CONSTRAINT "packing_orders_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_orders" ADD CONSTRAINT "packing_orders_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."dozen_assemblies" ADD CONSTRAINT "dozen_assemblies_packing_order_id_fkey" FOREIGN KEY ("packing_order_id") REFERENCES "factory"."packing_orders"("packing_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."dozen_assemblies" ADD CONSTRAINT "dozen_assemblies_assembled_by_fkey" FOREIGN KEY ("assembled_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."dozen_assembly_lines" ADD CONSTRAINT "dozen_assembly_lines_assembly_id_fkey" FOREIGN KEY ("assembly_id") REFERENCES "factory"."dozen_assemblies"("assembly_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."dozen_assembly_lines" ADD CONSTRAINT "dozen_assembly_lines_quality_box_id_fkey" FOREIGN KEY ("quality_box_id") REFERENCES "factory"."quality_output_boxes"("box_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."dozen_assembly_lines" ADD CONSTRAINT "dozen_assembly_lines_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."dozen_assembly_lines" ADD CONSTRAINT "dozen_assembly_lines_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."dozen_assembly_lines" ADD CONSTRAINT "dozen_assembly_lines_pattern_line_id_fkey" FOREIGN KEY ("pattern_line_id") REFERENCES "factory"."packing_pattern_lines"("pattern_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_verifications" ADD CONSTRAINT "packing_verifications_packing_order_id_fkey" FOREIGN KEY ("packing_order_id") REFERENCES "factory"."packing_orders"("packing_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."packing_verifications" ADD CONSTRAINT "packing_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."finished_goods_bags" ADD CONSTRAINT "finished_goods_bags_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."finished_goods_bags" ADD CONSTRAINT "finished_goods_bags_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "factory"."customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."finished_goods_bags" ADD CONSTRAINT "finished_goods_bags_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."finished_goods_bags" ADD CONSTRAINT "finished_goods_bags_cmo_line_id_fkey" FOREIGN KEY ("cmo_line_id") REFERENCES "factory"."customer_manufacturing_order_lines"("cmo_line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "factory"."departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employees" ADD CONSTRAINT "employees_primary_stage_id_fkey" FOREIGN KEY ("primary_stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employees" ADD CONSTRAINT "employees_primary_line_id_fkey" FOREIGN KEY ("primary_line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_attendance" ADD CONSTRAINT "employee_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "factory"."employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_attendance" ADD CONSTRAINT "employee_attendance_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_stage_assignments" ADD CONSTRAINT "employee_stage_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "factory"."employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_stage_assignments" ADD CONSTRAINT "employee_stage_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_stage_assignments" ADD CONSTRAINT "employee_stage_assignments_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_stage_assignments" ADD CONSTRAINT "employee_stage_assignments_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_stage_assignments" ADD CONSTRAINT "employee_stage_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_daily_output" ADD CONSTRAINT "employee_daily_output_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "factory"."employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_daily_output" ADD CONSTRAINT "employee_daily_output_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "factory"."employee_stage_assignments"("assignment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_daily_output" ADD CONSTRAINT "employee_daily_output_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_daily_output" ADD CONSTRAINT "employee_daily_output_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_daily_output" ADD CONSTRAINT "employee_daily_output_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."stage_standard_minutes" ADD CONSTRAINT "stage_standard_minutes_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."stage_standard_minutes" ADD CONSTRAINT "stage_standard_minutes_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."stage_standard_minutes" ADD CONSTRAINT "stage_standard_minutes_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_kpi_daily" ADD CONSTRAINT "employee_kpi_daily_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "factory"."employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_kpi_daily" ADD CONSTRAINT "employee_kpi_daily_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."employee_kpi_daily" ADD CONSTRAINT "employee_kpi_daily_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."line_kpi_summary" ADD CONSTRAINT "line_kpi_summary_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."line_kpi_summary" ADD CONSTRAINT "line_kpi_summary_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machines" ADD CONSTRAINT "machines_assigned_stage_id_fkey" FOREIGN KEY ("assigned_stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machines" ADD CONSTRAINT "machines_assigned_line_id_fkey" FOREIGN KEY ("assigned_line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machines" ADD CONSTRAINT "machines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_assignments" ADD CONSTRAINT "machine_assignments_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "factory"."machines"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_assignments" ADD CONSTRAINT "machine_assignments_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_assignments" ADD CONSTRAINT "machine_assignments_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_assignments" ADD CONSTRAINT "machine_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_status_log" ADD CONSTRAINT "machine_status_log_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "factory"."machines"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_status_log" ADD CONSTRAINT "machine_status_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_maintenance_schedule" ADD CONSTRAINT "machine_maintenance_schedule_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "factory"."machines"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_maintenance_schedule" ADD CONSTRAINT "machine_maintenance_schedule_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_downtime_events" ADD CONSTRAINT "machine_downtime_events_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "factory"."machines"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_downtime_events" ADD CONSTRAINT "machine_downtime_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_downtime_events" ADD CONSTRAINT "machine_downtime_events_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_downtime_events" ADD CONSTRAINT "machine_downtime_events_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_oee_snapshots" ADD CONSTRAINT "machine_oee_snapshots_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "factory"."machines"("machine_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_oee_snapshots" ADD CONSTRAINT "machine_oee_snapshots_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "factory"."production_lines"("line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."machine_oee_snapshots" ADD CONSTRAINT "machine_oee_snapshots_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."workflow_template_steps" ADD CONSTRAINT "workflow_template_steps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "factory"."workflow_templates"("template_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."workflow_template_steps" ADD CONSTRAINT "workflow_template_steps_required_role_id_fkey" FOREIGN KEY ("required_role_id") REFERENCES "factory"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."workflow_template_steps" ADD CONSTRAINT "workflow_template_steps_escalation_role_id_fkey" FOREIGN KEY ("escalation_role_id") REFERENCES "factory"."roles"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."workflow_instances" ADD CONSTRAINT "workflow_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "factory"."workflow_templates"("template_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."workflow_instances" ADD CONSTRAINT "workflow_instances_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."workflow_step_actions" ADD CONSTRAINT "workflow_step_actions_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "factory"."workflow_instances"("instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."workflow_step_actions" ADD CONSTRAINT "workflow_step_actions_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_material_requests" ADD CONSTRAINT "supplementary_material_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "factory"."production_orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_material_requests" ADD CONSTRAINT "supplementary_material_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_material_requests" ADD CONSTRAINT "supplementary_material_requests_transferred_by_fkey" FOREIGN KEY ("transferred_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_lines" ADD CONSTRAINT "supplementary_request_lines_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "factory"."supplementary_material_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_lines" ADD CONSTRAINT "supplementary_request_lines_order_part_id_fkey" FOREIGN KEY ("order_part_id") REFERENCES "factory"."production_order_parts"("order_part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_lines" ADD CONSTRAINT "supplementary_request_lines_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_lines" ADD CONSTRAINT "supplementary_request_lines_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_negligence" ADD CONSTRAINT "supplementary_request_negligence_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "factory"."supplementary_material_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_negligence" ADD CONSTRAINT "supplementary_request_negligence_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "factory"."employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_negligence" ADD CONSTRAINT "supplementary_request_negligence_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "factory"."production_stages"("stage_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_negligence" ADD CONSTRAINT "supplementary_request_negligence_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."supplementary_request_negligence" ADD CONSTRAINT "supplementary_request_negligence_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."customer_manufacturing_orders" ADD CONSTRAINT "customer_manufacturing_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "factory"."customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."customer_manufacturing_orders" ADD CONSTRAINT "customer_manufacturing_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."customer_manufacturing_orders" ADD CONSTRAINT "customer_manufacturing_orders_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."customer_manufacturing_order_lines" ADD CONSTRAINT "customer_manufacturing_order_lines_cmo_id_fkey" FOREIGN KEY ("cmo_id") REFERENCES "factory"."customer_manufacturing_orders"("cmo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."customer_manufacturing_order_lines" ADD CONSTRAINT "customer_manufacturing_order_lines_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."customer_manufacturing_order_lines" ADD CONSTRAINT "customer_manufacturing_order_lines_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "factory"."colors"("color_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."customer_manufacturing_order_lines" ADD CONSTRAINT "customer_manufacturing_order_lines_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "factory"."sizes"("size_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."drivers" ADD CONSTRAINT "drivers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "factory"."employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_orders" ADD CONSTRAINT "shipping_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "factory"."customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_orders" ADD CONSTRAINT "shipping_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "factory"."vehicles"("vehicle_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_orders" ADD CONSTRAINT "shipping_orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "factory"."drivers"("driver_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_orders" ADD CONSTRAINT "shipping_orders_dispatched_by_fkey" FOREIGN KEY ("dispatched_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_orders" ADD CONSTRAINT "shipping_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_order_lines" ADD CONSTRAINT "shipping_order_lines_shipping_order_id_fkey" FOREIGN KEY ("shipping_order_id") REFERENCES "factory"."shipping_orders"("shipping_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_order_lines" ADD CONSTRAINT "shipping_order_lines_cmo_line_id_fkey" FOREIGN KEY ("cmo_line_id") REFERENCES "factory"."customer_manufacturing_order_lines"("cmo_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_line_fg_bags" ADD CONSTRAINT "shipping_line_fg_bags_shipping_line_id_fkey" FOREIGN KEY ("shipping_line_id") REFERENCES "factory"."shipping_order_lines"("shipping_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."shipping_line_fg_bags" ADD CONSTRAINT "shipping_line_fg_bags_fg_bag_id_fkey" FOREIGN KEY ("fg_bag_id") REFERENCES "factory"."finished_goods_bags"("fg_bag_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."vehicle_loadings" ADD CONSTRAINT "vehicle_loadings_shipping_order_id_fkey" FOREIGN KEY ("shipping_order_id") REFERENCES "factory"."shipping_orders"("shipping_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."vehicle_loadings" ADD CONSTRAINT "vehicle_loadings_loaded_by_fkey" FOREIGN KEY ("loaded_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."delivery_notes" ADD CONSTRAINT "delivery_notes_shipping_order_id_fkey" FOREIGN KEY ("shipping_order_id") REFERENCES "factory"."shipping_orders"("shipping_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."delivery_notes" ADD CONSTRAINT "delivery_notes_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_shipping_order_id_fkey" FOREIGN KEY ("shipping_order_id") REFERENCES "factory"."shipping_orders"("shipping_order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "factory"."warehouses"("warehouse_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "factory"."containers"("container_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_bag_id_fkey" FOREIGN KEY ("bag_id") REFERENCES "factory"."physical_bags"("bag_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "factory"."models"("model_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "factory"."model_parts"("part_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_responsible_department_id_fkey" FOREIGN KEY ("responsible_department_id") REFERENCES "factory"."departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "factory"."employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigations" ADD CONSTRAINT "inventory_investigations_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigation_actions" ADD CONSTRAINT "inventory_investigation_actions_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "factory"."inventory_investigations"("investigation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."inventory_investigation_actions" ADD CONSTRAINT "inventory_investigation_actions_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."user_password_history" ADD CONSTRAINT "user_password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."user_password_history" ADD CONSTRAINT "user_password_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."screens" ADD CONSTRAINT "screens_parent_screen_id_fkey" FOREIGN KEY ("parent_screen_id") REFERENCES "factory"."screens"("screen_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."screen_permissions" ADD CONSTRAINT "screen_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "factory"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."screen_permissions" ADD CONSTRAINT "screen_permissions_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "factory"."screens"("screen_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."screen_permissions" ADD CONSTRAINT "screen_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."approval_permissions" ADD CONSTRAINT "approval_permissions_workflow_template_id_fkey" FOREIGN KEY ("workflow_template_id") REFERENCES "factory"."workflow_templates"("template_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."approval_permissions" ADD CONSTRAINT "approval_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "factory"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."approval_permissions" ADD CONSTRAINT "approval_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."user_sessions" ADD CONSTRAINT "user_sessions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."session_policy" ADD CONSTRAINT "session_policy_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "factory"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."session_policy" ADD CONSTRAINT "session_policy_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."system_config" ADD CONSTRAINT "system_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."fiscal_years" ADD CONSTRAINT "fiscal_years_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."number_sequences" ADD CONSTRAINT "number_sequences_last_reset_by_fkey" FOREIGN KEY ("last_reset_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."master_data_change_requests" ADD CONSTRAINT "master_data_change_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."master_data_change_requests" ADD CONSTRAINT "master_data_change_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."job_definitions" ADD CONSTRAINT "job_definitions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."job_execution_log" ADD CONSTRAINT "job_execution_log_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "factory"."job_definitions"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."job_execution_log" ADD CONSTRAINT "job_execution_log_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."db_backup_log" ADD CONSTRAINT "db_backup_log_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."db_restore_log" ADD CONSTRAINT "db_restore_log_backup_id_fkey" FOREIGN KEY ("backup_id") REFERENCES "factory"."db_backup_log"("backup_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."db_restore_log" ADD CONSTRAINT "db_restore_log_authorized_by_fkey" FOREIGN KEY ("authorized_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."db_restore_log" ADD CONSTRAINT "db_restore_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "factory"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factory"."db_maintenance_log" ADD CONSTRAINT "db_maintenance_log_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "factory"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

