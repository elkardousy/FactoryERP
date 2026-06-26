# Database Review Prompt

**Purpose:** Verify that schema changes, migrations, and query patterns are correct, safe, and performant.

---

## Review Process

### Step 1 — Schema Compliance

For every new or modified Prisma model:
- [ ] Table is in `@@schema("factory")`
- [ ] PK is `BigInt @id @default(autoincrement())`
- [ ] All DateTime fields use `@db.Timestamptz(6)`
- [ ] Quantity fields use `Decimal(12,3)`
- [ ] Soft-delete uses `is_active Boolean @default(true)`
- [ ] Audit-trail fields: `created_at DateTime @default(now())`, `updated_at DateTime @updatedAt`
- [ ] String fields have appropriate `@db.VarChar(N)` length constraints

### Step 2 — Migration Safety

For each migration file in `prisma/migrations/`:
- [ ] Migration is additive — no column drops or type changes that lose data
- [ ] `NOT NULL` columns have either a `DEFAULT` value or were added to empty tables
- [ ] Foreign key constraints are explicitly declared (Prisma adds them via `@relation`)
- [ ] Migration file name is descriptive (not `migration_TIMESTAMP`)
- [ ] Migration has been reviewed before `prisma migrate deploy`

**Destructive change checklist (if applicable):**
- Column drop: Is this column used by application code?
- Type change: Is new type compatible with all existing data?
- Constraint addition: Does all existing data satisfy the constraint?

### Step 3 — Index Coverage

For each table with > 1000 expected rows, verify:
- [ ] All FK columns have an index
- [ ] Status/`is_active` columns used in list queries have an index
- [ ] Date columns used for range queries have an index
- [ ] Composite indexes declared for common multi-column WHERE patterns

### Step 4 — Referential Integrity

- [ ] All FK relationships are declared in Prisma schema
- [ ] Cascade delete is intentional — document in ADR if used
- [ ] Cascade delete is NOT used for operational data (inventory transactions, audit events)
- [ ] `onDelete: Restrict` or `onDelete: SetNull` for FK references to master data

### Step 5 — High-Volume Table Design

For tables that will accumulate > 1M rows/year:
- [ ] Composite primary key includes a timestamp column (for future partitioning)
- [ ] Documented in the relevant ADR (e.g., ADR-024 Scalability Provisions)

---

## Output Report

```
Database Review — Sprint {N} — {Date}

SCHEMA COMPLIANCE: [PASS / FAIL]
  Violations: {list or "none"}

MIGRATION SAFETY: [PASS / FAIL / NO MIGRATIONS]
  Destructive changes: {list or "none"}

INDEX COVERAGE: [PASS / CONDITIONAL]
  Missing indexes: {list or "none"}

REFERENTIAL INTEGRITY: [PASS / FAIL]
  Issues: {list or "none"}

HIGH-VOLUME DESIGN: [PASS / NOT APPLICABLE]

OVERALL: [PASS / CONDITIONAL / FAIL]
```

---

## Final Recommendation

- **PASS**: Database changes are safe and well-designed
- **CONDITIONAL**: Non-critical issues documented; proceed with acknowledgment
- **FAIL**: Destructive migration or missing FK. Do not deploy.
