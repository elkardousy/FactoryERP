# 05 — Database Governance

**Document:** FEOS-05  
**Category:** Database  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per schema change  
**Related FEOS:** FEOS-06 (Prisma Governance), FEOS-15 (Recovery Playbook)  
**Related KEB:** KEB-04 (Database Knowledge), KEB-05 (Prisma Knowledge)

---

## Purpose

This document governs all access to, modification of, and interaction with the FactoryERP PostgreSQL database. It defines ownership of the database schema, the DDL policy, naming standards, migration procedures, and explicitly forbidden operations.

## Scope

All interactions with the `factory_erp` PostgreSQL database, including schema changes, migrations, queries via Prisma, and direct SQL execution.

## Audience

All engineers and AI agents that interact with the database in any capacity.

---

## Database Identity

| Property | Value |
|----------|-------|
| DBMS | PostgreSQL 18 |
| Database name | `factory_erp` |
| Schema | `factory` |
| Host | localhost |
| Port | 5432 |
| App user | `elkardousy` (limited privileges) |
| Superuser | `postgres` (required for DDL) |
| App user password | `250686` |
| Superuser password | Contains `??` (URL-unsafe — use PGPASSWORD env only, never in URL) |
| Total models | 98 |
| Total enums | 32 |
| Migrations applied | 2 |

---

## Database Ownership

The PostgreSQL `factory` schema is **owned by the `postgres` superuser**. The `elkardousy` application user has read/write privileges on data but lacks DDL privileges (CREATE TABLE, ALTER TABLE, CREATE TYPE, DROP, etc.).

This ownership model is intentional and permanent. It prevents accidental schema changes from application code and enforces the migration workflow.

### Privilege Matrix

| Operation | `elkardousy` | `postgres` |
|-----------|-------------|-----------|
| SELECT | Yes | Yes |
| INSERT | Yes | Yes |
| UPDATE | Yes | Yes |
| DELETE | Yes | Yes |
| CREATE TABLE | **No** | Yes |
| ALTER TABLE | **No** | Yes |
| CREATE TYPE | **No** | Yes |
| DROP TABLE | **No** | Yes |
| CREATE INDEX | **No** | Yes |
| CREATE FUNCTION | **No** | Yes |
| CREATE TRIGGER | **No** | Yes |

---

## Migration Policy

### The Frozen Migration Workflow

All DDL changes to the FactoryERP database must follow this exact workflow. No deviation is permitted.

**Step 1 — Write Migration SQL**

Write the migration SQL file to:
```
prisma/migrations/<timestamp>_<descriptive-name>/migration.sql
```

Timestamp format: `YYYYMMDDHHMMSS` (e.g., `20260701120000_add_container_status_column`).

The SQL must be written to run safely on the current database state. Include `IF NOT EXISTS` guards where appropriate.

**Step 2 — Execute as Superuser**

```bash
PGPASSWORD="<postgres-password>" psql -U postgres -h localhost -p 5432 -d factory_erp -f prisma/migrations/<dir>/migration.sql
```

Note: The postgres superuser password contains characters that are URL-unsafe. Always use the `PGPASSWORD` environment variable. Never embed the password in a connection string.

**Step 3 — Mark Applied in Prisma**

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate resolve --applied "<migration-name>"
```

Where `<migration-name>` is the directory name (e.g., `20260701120000_add_container_status_column`).

**Step 4 — Regenerate Prisma Client**

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
```

**Step 5 — Update `prisma/schema.prisma`**

Add the new table, column, enum, or index to `prisma/schema.prisma`. The schema file must always reflect the current live database state.

**Step 6 — Verify Build**

```bash
npm run build
```

The build must pass after any Prisma schema or migration change.

---

## DDL Policy

### What Is DDL

DDL (Data Definition Language) includes: CREATE TABLE, ALTER TABLE, CREATE TYPE (enum), DROP TABLE, DROP COLUMN, ADD COLUMN, CREATE INDEX, CREATE TRIGGER, CREATE FUNCTION.

### DDL Rules

1. **No application code may execute DDL.** DDL is executed only via the migration workflow.
2. **All DDL is executed as `postgres` superuser.** `elkardousy` lacks DDL privileges.
3. **All DDL is recorded in a migration SQL file** before execution.
4. **All DDL changes update `prisma/schema.prisma`** after execution.
5. **DDL is never executed via `prisma migrate deploy`.** This command fails because `elkardousy` cannot execute DDL.
6. **DDL is never applied ad-hoc** without a recorded migration file.

---

## Naming Conventions

### Table Names

- `snake_case`, plural, nouns.
- Prefixed with domain when clarity requires it.
- All tables live in the `factory` schema.
- Examples: `physical_bags`, `inventory_transactions`, `production_lines`, `customer_manufacturing_orders`.

### Column Names

- `snake_case`.
- Primary keys: `<entity>_id` (e.g., `bag_id`, `txn_id`, `reservation_id`).
- Boolean flags: `is_<state>` (e.g., `is_active`, `is_confirmed`).
- Timestamps: `<event>_at` (e.g., `created_at`, `executed_at`, `reserved_at`).
- References: `<referenced_entity>_id` (e.g., `warehouse_id`, `model_id`).
- Counters / measures: descriptive noun (e.g., `current_dozens`, `reserved_dozens`, `net_pieces`).
- Version (optimistic lock): `version` (BigInt).

### Enum Names

- `PascalCase` in Prisma, `SCREAMING_SNAKE_CASE` values in PostgreSQL.
- Examples: `ReservationStatusEnum`, `TxnTypeEnum`, `RoleEnum`.

### Index Names

- `idx_<table>_<column(s)>` for standard indexes.
- `idx_<table>_<column>_trgm` for GIN trigram indexes.
- Examples: `idx_physical_bags_bag_code`, `idx_models_code_trgm`.

### Primary Keys

- All tables use BigInt PKs (except join tables that use composite PKs).
- Composite PK tables: `inventory_transactions` (`[txn_id, executed_at]`), `audit_events` (`[event_id, occurred_at]`).
- Join table composite PK: `role_permissions` (`[role_id, permission_id]`).

---

## Query Governance

### Composite PK Tables

Two tables have composite primary keys and require special query handling:

| Table | Composite PK Columns | Required Method |
|-------|---------------------|----------------|
| `inventory_transactions` | `txn_id`, `executed_at` | `findFirst()` |
| `audit_events` | `event_id`, `occurred_at` | `findFirst()` |

Using `findUnique()` on these tables throws a Prisma runtime error. All queries against these tables must use `findFirst()` with all composite PK columns in the `where` clause.

### Optimistic Locking

Four models have a `version` (BigInt) column for optimistic locking:

| Model | Optimistic Lock Column |
|-------|----------------------|
| `inventory_bags` | `version` |
| `wip_inventory` | `version` |
| `quality_output_boxes` | `version` |
| `customer_manufacturing_order_lines` | `version` |

When implementing updates to these models, the version must be checked and incremented atomically. The check-and-increment pattern must be implemented in a transaction. GAP-015 (KEB-19) notes that optimistic locking may not yet be implemented — this must be resolved before concurrent write scenarios arise in production.

### Computed Columns

Eight models have computed columns using `@default(dbgenerated())`:

- Values are computed by PostgreSQL functions/expressions.
- Do not attempt to write to these columns from application code.
- The database function that computes the value must exist (see GAP-011 in KEB-19 — verification pending).

### `Unsupported("inet")` Fields

Two tables have `Unsupported("inet")` columns:

| Table | Column |
|-------|--------|
| `audit_events` | `ip_address` |
| `user_sessions` | `ip_address` |

These columns cannot be written via the standard Prisma client. If needed, use a Prisma `$executeRaw` or `$queryRaw` statement.

---

## Forbidden Database Operations

The following operations are explicitly prohibited:

| Operation | Reason | Recovery |
|-----------|--------|---------|
| `npx prisma db pull` | Overwrites schema, destroys ReservationStatusEnum, strips @updatedAt, renames relations | `git checkout HEAD -- prisma/schema.prisma && npx prisma generate && npm run build` |
| `npx prisma migrate deploy` | `elkardousy` lacks DDL privileges — command will fail | Use documented migration workflow |
| Ad-hoc DDL via `psql` without migration file | Untracked schema change, Prisma schema becomes out of sync | Write migration file first, then execute |
| Dropping `factory` schema | Destroys all 98 tables | Restore from backup |
| Direct modification of `_prisma_migrations` table | Corrupts migration state | Investigate and use `prisma migrate resolve` |
| Writing to computed columns | Database rejects or overrides the value | Read only; do not include in INSERT/UPDATE |

---

## Performance Governance

### Query Performance Rules

1. All queries filtering by high-cardinality columns must use indexed columns.
2. Unbounded queries (no `take`/`skip` or `limit`) are forbidden on tables larger than reference data.
3. All paginated endpoints must use `PaginationDto` (skip/take pattern).
4. Full-table scans on `inventory_transactions` are prohibited — always filter by `bag_id` or `executed_at` range.

### GIN Index Policy

Three GIN trigram indexes exist for full-text search:

| Index | Table | Column |
|-------|-------|--------|
| `idx_models_code_trgm` | `models` | `model_code` |
| `idx_prod_orders_number_trgm` | `production_orders` | `order_number` |
| `idx_audit_payload` | `audit_events` | `payload` |

These indexes are managed by the initial SQL scripts (not Prisma). Their existence in the live database is not verified (GAP-010 in KEB-19). Do not add GIN indexes via Prisma schema — add via migration SQL.

---

## Compliance Rules

### Rule D-001 — Migration Workflow

**Classification:** MANDATORY  
**Statement:** All DDL changes must follow the documented 6-step migration workflow. Ad-hoc DDL is prohibited.  
**Violation Impact:** Prisma schema out of sync with database, application startup failures.  
**Risk:** Data model inconsistency, failed builds.  
**Recovery:** See FEOS-15, Section: Migration Failure Recovery.  
**Approval Required:** Chief Software Architect.

### Rule D-002 — Superuser DDL Only

**Classification:** MANDATORY  
**Statement:** All DDL must be executed as the `postgres` superuser, not as `elkardousy`. Using `elkardousy` for DDL will fail at the database level.  
**Violation Impact:** Migration fails silently or with permission denied.  
**Risk:** Incomplete schema changes, inconsistent state.  
**Recovery:** Re-execute the DDL as `postgres` superuser.  
**Approval Required:** None — this is a technical requirement.

### Rule D-003 — prisma db pull Prohibition

**Classification:** MANDATORY  
**Statement:** `prisma db pull` is prohibited without explicit architect approval. Execution without approval is a critical violation.  
**Violation Impact:** `prisma/schema.prisma` overwritten, custom definitions destroyed.  
**Risk:** Build failures, data model corruption, lost enum definitions.  
**Recovery:** `git checkout HEAD -- prisma/schema.prisma && npx prisma generate && npm run build`  
**Approval Required:** Chief Software Architect written approval.

### Rule D-004 — Composite PK Query Method

**Classification:** MANDATORY  
**Statement:** Queries against `inventory_transactions` and `audit_events` must use `findFirst()`, not `findUnique()`.  
**Violation Impact:** Runtime 500 error on all affected endpoints.  
**Risk:** Data retrieval failure.  
**Recovery:** Replace `findUnique()` with `findFirst()`.  
**Approval Required:** None.

### Rule D-005 — DATABASE_URL Prefix

**Classification:** MANDATORY  
**Statement:** All Prisma CLI commands must be prefixed with `DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp"`. The `prisma.config.ts` configuration causes Prisma to skip `.env` file loading.  
**Violation Impact:** Prisma CLI fails to connect.  
**Risk:** Migration commands fail silently.  
**Recovery:** Re-run the command with the DATABASE_URL prefix.  
**Approval Required:** None.
