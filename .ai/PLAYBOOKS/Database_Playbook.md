# Database Playbook

Step-by-step procedure for making changes to the Prisma schema and database.

**Warning:** Schema changes are irreversible in production. Follow every step.

---

## Before You Start

- [ ] Read the current schema: `prisma/schema.prisma`
- [ ] Read ADR-005 (Database: BigInt PKs), ADR-006 (Prisma multi-schema), ADR-007 (Soft Delete)
- [ ] Confirm change is minimal — do not add columns you do not need yet
- [ ] Confirm all PKs are `BigInt @default(autoincrement())`
- [ ] Confirm all timestamps are `DateTime @db.Timestamptz(6) @default(now())`
- [ ] Confirm all monetary amounts are `Decimal @db.Decimal(12,3)`

---

## Phase 1 — Design the Schema Change

**New table checklist:**
```prisma
model {table_name} {
  id         BigInt   @id @default(autoincrement())
  // ... domain fields ...
  is_active  Boolean  @default(true)
  created_at DateTime @db.Timestamptz(6) @default(now())
  updated_at DateTime @db.Timestamptz(6) @updatedAt

  @@schema("factory")
}
```

Required for every table:
- [ ] `@@schema("factory")` — all models in the `factory` schema
- [ ] `@id @default(autoincrement())` with `BigInt` type
- [ ] `created_at` and `updated_at` with `@db.Timestamptz(6)`
- [ ] `is_active Boolean @default(true)` (unless it is a lookup/reference table — see ADR-007)
- [ ] FK columns named `{entity}_id` with `BigInt` type and `@relation` annotation

**Index checklist:**
- [ ] FK columns get `@@index([{fk}_id])`
- [ ] Status/filter columns used in WHERE get `@@index([status])` or `@@index([is_active])`
- [ ] Composite filter patterns get composite indexes

---

## Phase 2 — Validate Schema

```bash
npx prisma validate
```

Must exit 0 before proceeding.

---

## Phase 3 — Generate Client

```bash
npx prisma generate
```

Must exit 0 before proceeding.

---

## Phase 4 — Build Check

```bash
npm run build
```

If TypeScript errors appear, fix them before running the migration.

---

## Phase 5 — Migration (requires live PostgreSQL)

```bash
# Development:
npx prisma migrate dev --name {descriptive-migration-name}
# Example: --name add-inventory-bags-table

# Verify migration file was created:
ls prisma/migrations/
```

Migration naming convention: `{action}_{entity}` — e.g.:
- `add_physical_bags_table`
- `add_status_index_to_production_orders`
- `add_deactivated_at_to_employees`

---

## Phase 6 — Verify Migration

```bash
# Check migration applies cleanly:
npx prisma migrate status

# Open Prisma Studio to visually inspect (optional):
npx prisma studio
```

---

## Phase 7 — Run Tests

```bash
npm run test
```

Any test using the affected tables must still pass.

---

## Phase 8 — Commit

Stage migration files along with schema and generated client changes:

```bash
git add prisma/schema.prisma
git add prisma/migrations/
git add src/  # if application code changed
git commit -m "feat(db): {description of schema change}"
```

Example: `feat(db): add physical_bags and inventory_bags tables with indexes`
