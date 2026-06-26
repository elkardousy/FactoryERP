# Migration Playbook

Step-by-step procedure for creating, reviewing, and applying Prisma database migrations safely.

This playbook supplements `.ai/PLAYBOOKS/Database_Playbook.md`. Use both together for schema changes.

---

## Migration Safety Rules

1. **Never edit a migration file after it has been applied to any environment.** If a mistake was made, create a new migration to correct it.
2. **Never delete migration files.** Prisma migration history is the authoritative record of schema evolution.
3. **Every migration must be reversible** — unless reversibility is genuinely impossible (e.g., dropping a column with no way to recover the data). Document irreversible migrations in a comment in the migration SQL file.
4. **Migrations that touch large tables** (> 100K rows) require explicit analysis — see Large Table section below.

---

## Phase 1 — Pre-Migration Checklist

```bash
# Confirm schema validates:
npx prisma validate

# Check current migration state:
npx prisma migrate status

# Confirm no pending unapplied migrations exist from previous sessions:
# Expected output: "All migrations have been applied"
```

- [ ] `prisma validate` exits 0
- [ ] No previously unapplied migrations pending
- [ ] Schema changes in `prisma/schema.prisma` are committed / ready to commit

---

## Phase 2 — Create Migration

```bash
npx prisma migrate dev --name {migration_name}
```

**Naming conventions:**

| Change type | Example name |
|-------------|--------------|
| Add table | `add_physical_bags` |
| Add column | `add_deactivated_at_to_employees` |
| Add index | `add_index_status_to_production_orders` |
| Add FK | `add_fk_cmo_to_customers` |
| Drop column | `drop_legacy_reference_from_garment_models` |
| Rename column | `rename_ref_to_document_number_in_cmo` |

Do NOT use generic names like `update_schema`, `fix`, `changes`.

---

## Phase 3 — Review the Generated SQL

Prisma generates a `.sql` file in `prisma/migrations/{timestamp}_{name}/migration.sql`.

Read it:
```bash
cat prisma/migrations/{latest}/migration.sql
```

Check for:
- [ ] Only the expected tables/columns are created or altered
- [ ] No unexpected DROP statements
- [ ] FK constraints have appropriate ON DELETE behavior
- [ ] Indexes are present for new FK columns

---

## Phase 4 — Large Table Analysis

If a migration touches a table that will have > 100K rows (e.g., `audit_logs`, `inventory_transactions`):

- [ ] Does the migration add a NOT NULL column without a default? → **Dangerous** — will lock table during backfill
- [ ] Does the migration drop an index? → Verify no query depends on it
- [ ] Does the migration add a FK? → Verify the referenced table's rows all exist

Mitigation for NOT NULL without default:
1. Add column as nullable first (migration 1)
2. Backfill data (migration 2 or application code)
3. Add NOT NULL constraint (migration 3)

---

## Phase 5 — Test Migration

```bash
npm run build
npm run test
npx prisma migrate status
# Expected: "All migrations have been applied"
```

---

## Phase 6 — Commit Migration

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): {description}"
```

The migration file and schema change must be in the same commit.

---

## Phase 7 — Production Deployment (future)

When deploying to a production environment:
```bash
npx prisma migrate deploy
# (NOT migrate dev — deploy is for non-interactive production environments)
```

`migrate deploy` applies pending migrations without creating new ones and without prompting.
