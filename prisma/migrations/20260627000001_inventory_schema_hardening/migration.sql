-- Migration: inventory_schema_hardening
-- Gate Conditions: G-4 (R2), G-5 (R3), G-6 (R5), G-7 (R4 — Prisma-only, no DDL)
-- Date: 2026-06-27

-- ============================================================
-- R2: ReservationStatusEnum (Gate G-4)
-- Replace VARCHAR(20) status column with a typed PostgreSQL enum
-- ============================================================

-- CreateEnum
CREATE TYPE "factory"."reservation_status_enum" AS ENUM ('ACTIVE', 'RELEASED', 'CANCELLED');

-- AlterTable: migrate status column from VARCHAR(20) to the new enum type
-- PRE-CHECK (run before this migration if database has existing data):
--   SELECT DISTINCT status FROM factory.physical_bag_reservations
--     WHERE status NOT IN ('ACTIVE', 'RELEASED', 'CANCELLED');
--   (must return 0 rows)
ALTER TABLE "factory"."physical_bag_reservations" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "factory"."physical_bag_reservations"
    ALTER COLUMN "status" TYPE "factory"."reservation_status_enum"
    USING "status"::"factory"."reservation_status_enum";

ALTER TABLE "factory"."physical_bag_reservations" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- ============================================================
-- R3: Missing indexes on physical_bag_reservations (Gate G-5)
-- ============================================================

-- Index A: Serves StockReservationsRepository.findActiveByBagId()
-- Query: WHERE bag_id = $1 AND status = 'ACTIVE'
CREATE INDEX "physical_bag_reservations_bag_id_status_idx"
    ON "factory"."physical_bag_reservations"("bag_id", "status");

-- Index B: Serves StockReservationsRepository.findActiveByOrderId()
-- Query: WHERE order_id = $1 AND status = 'ACTIVE'
CREATE INDEX "physical_bag_reservations_order_id_status_idx"
    ON "factory"."physical_bag_reservations"("order_id", "status");

-- Index C: Serves global status queries and dashboards
-- Query: WHERE status = 'ACTIVE'
CREATE INDEX "physical_bag_reservations_status_idx"
    ON "factory"."physical_bag_reservations"("status");

-- ============================================================
-- R5 (Gate G-6): current_order_id index on physical_bags
-- Serves: production release queries — all bags assigned to an order
-- Query: WHERE current_order_id = $1
-- ============================================================
CREATE INDEX "physical_bags_current_order_id_idx"
    ON "factory"."physical_bags"("current_order_id");

-- ============================================================
-- R4 (Gate G-7): @updatedAt on physical_bags.updated_at
-- No DDL change required.
-- Prisma sets updated_at = NOW() at the application layer on every UPDATE.
-- The PostgreSQL column definition is unchanged: TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- This migration advances Prisma migration history to record the behavioral change.
-- ============================================================
