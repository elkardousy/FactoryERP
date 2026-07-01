-- Runs only on first container creation (when factory-postgres-data volume is empty).
-- Creates the factory schema that Prisma migrations expect.
CREATE SCHEMA IF NOT EXISTS factory;
