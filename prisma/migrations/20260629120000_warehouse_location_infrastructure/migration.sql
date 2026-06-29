-- Platform Phase F01: Warehouse Location Infrastructure
-- EXECUTE AS: postgres superuser
-- Command: psql -U postgres -h localhost -p 5432 -d factory_erp -f migration.sql
-- After execution: npx prisma migrate resolve --applied "20260629120000_warehouse_location_infrastructure"
-- Then: npx prisma generate

CREATE TABLE factory.warehouse_locations (
    location_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    zone_code VARCHAR(20) NOT NULL,
    rack_code VARCHAR(20),
    shelf_code VARCHAR(20),
    bin_code VARCHAR(20),
    location_code VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    capacity_dozens DECIMAL(12, 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_warehouse_locations__warehouse FOREIGN KEY (warehouse_id)
        REFERENCES factory.warehouses(warehouse_id),
    CONSTRAINT uq_warehouse_locations__code UNIQUE (warehouse_id, location_code),
    CONSTRAINT chk_rack_requires_zone CHECK (rack_code IS NULL OR zone_code IS NOT NULL),
    CONSTRAINT chk_shelf_requires_rack CHECK (shelf_code IS NULL OR rack_code IS NOT NULL),
    CONSTRAINT chk_bin_requires_shelf CHECK (bin_code IS NULL OR shelf_code IS NOT NULL)
);

CREATE INDEX idx_warehouse_locations__warehouse_id ON factory.warehouse_locations(warehouse_id);
CREATE INDEX idx_warehouse_locations__warehouse_active ON factory.warehouse_locations(warehouse_id, is_active);

ALTER TABLE factory.physical_bags
    ADD COLUMN location_id BIGINT,
    ADD CONSTRAINT fk_physical_bags__location FOREIGN KEY (location_id)
        REFERENCES factory.warehouse_locations(location_id);

CREATE INDEX idx_physical_bags__location_id ON factory.physical_bags(location_id);

GRANT SELECT, INSERT, UPDATE ON factory.warehouse_locations TO elkardousy;
