# 15 — Recovery Playbook

**Document:** FEOS-15  
**Category:** Recovery  
**Authority:** MANDATORY — follow exactly when recovering from failure  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per failure incident  
**Related FEOS:** FEOS-05 (Database Governance), FEOS-06 (Prisma Governance), FEOS-14 (Operational Playbook)  
**Related KEB:** KEB-11 (Risk Register)

---

## Purpose

This document defines the exact recovery procedures for all known failure modes in FactoryERP: build failures, test failures, lint failures, migration failures, Prisma schema drift, dependency corruption, and git conflict scenarios.

## Scope

All failure scenarios that affect the FactoryERP build, test, database, or repository state.

## Audience

Engineers and AI agents responding to failures. Follow these procedures exactly — do not improvise recovery steps.

---

## Recovery Procedure Index

| Failure | Section |
|---------|---------|
| TypeScript build failure | Section 1 |
| ESLint lint failure | Section 2 |
| Jest test failure | Section 3 |
| Prisma schema drift (`prisma db pull` run accidentally) | Section 4 |
| Migration failure (partial application) | Section 5 |
| Prisma client out of sync | Section 6 |
| Dependency corruption (`node_modules`) | Section 7 |
| Git conflict on main | Section 8 |
| Database connection failure | Section 9 |
| Application startup failure | Section 10 |

---

## Section 1 — TypeScript Build Failure

**Symptom:** `npm run build` exits non-zero.

**Recovery Steps:**

1. Read the full error output. TypeScript errors include: file path, line number, error code (TS2xxx), and description.
2. Open the failing file at the reported line.
3. Understand the root cause:
   - **TS2345 (argument type mismatch):** A type is being passed where an incompatible type is expected. Fix the source type or the argument.
   - **TS2339 (property does not exist):** A property is used that doesn't exist on the type. Check if you're using the correct type or if a Prisma regeneration is needed.
   - **TS2307 (module not found):** Import path is wrong. Check the path. Run `npm run build` after fixing.
   - **TS1205 (isolatedModules):** A type is exported without `export type`. Add `type` keyword.
4. Fix the root cause. Do not add `@ts-ignore` or `as any` to suppress errors.
5. Re-run `npm run build`.
6. Verify lint and tests still pass.

**Do not:**
- Suppress with `@ts-ignore`.
- Cast to `any` to bypass the error.
- Change the TypeScript configuration to make errors disappear.

---

## Section 2 — ESLint Lint Failure

**Symptom:** `npm run lint` exits non-zero or reports errors.

**Recovery Steps:**

1. Read the full lint output. ESLint errors include: file path, line, column, rule name, and description.
2. Common lint errors and fixes:

| Error | Fix |
|-------|-----|
| `no-explicit-any` | Replace `any` with a specific type or `unknown` |
| `no-console` | Replace `console.log()` with `this.logger.info()` |
| `@typescript-eslint/no-unused-vars` | Remove unused variables or imports |
| `@typescript-eslint/no-explicit-any` in mocks | Type callback as `(cb: (tx: unknown) => Promise<unknown>)` |

3. Run `npm run lint` again after fixes.
4. If the lint error is a false positive, do not suppress with `// eslint-disable` without architect approval.

**Known acceptable ESLint suppression:** None at FEOS 1.0.

---

## Section 3 — Jest Test Failure

**Symptom:** `npm run test` exits non-zero or reports one or more failing tests.

**Recovery Steps:**

1. Read the full test output. Jest reports: test file, test name, expected vs received, and stack trace.
2. Identify which spec file and which test is failing.
3. Determine the root cause:
   - **Mock not returning expected value:** Update `jest.fn().mockResolvedValue(...)` in the `beforeEach` or test body.
   - **Use case not calling expected method:** The implementation is wrong — fix the use case.
   - **Assertion mismatch:** The expected value is wrong or the implementation changed — decide which is correct.
   - **Dependency not injected:** The test's module setup is missing a provider.
4. Fix the root cause in the code or the test (whichever is wrong).
5. Re-run the specific test: `npm run test -- --testPathPattern=<spec-file>`.
6. Run all tests: `npm run test`.

**Never:**
- Delete a failing test.
- Comment out the failing assertion.
- Change the expected value to match wrong behavior.

---

## Section 4 — Prisma Schema Drift (prisma db pull Run Accidentally)

**Symptom:** `prisma/schema.prisma` has been overwritten by `prisma db pull`. Indicators:
- `ReservationStatusEnum` is missing or has `EXPIRED` value.
- `@updatedAt` directives are gone.
- Relation names have changed.
- TypeScript build fails with 6+ type errors.

**Recovery Steps (in exact order):**

```bash
# Step 1: Restore the committed schema
git checkout HEAD -- prisma/schema.prisma

# Step 2: Verify the schema is restored
# Check that ReservationStatusEnum contains ACTIVE, RELEASED, CANCELLED (no EXPIRED)

# Step 3: Regenerate Prisma Client from the restored schema
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate

# Step 4: Rebuild
npm run build

# Step 5: Run all tests
npm run test
```

**If Step 1 fails (git checkout fails):**
- The schema was committed in its overwritten state. Escalate to architect immediately.
- Reconstruct the schema from the last known-good commit using `git show <commit>:prisma/schema.prisma`.

---

## Section 5 — Migration Failure (Partial Application)

**Symptom:** A migration was started but did not complete. `prisma migrate status` shows the migration as "pending" but the DDL was partially applied.

**Diagnosis:**

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate status
```

**Recovery Steps:**

1. Identify which SQL statements were applied and which failed.
2. Connect to the database as `postgres` superuser:
   ```bash
   PGPASSWORD="<postgres-password>" psql -U postgres -h localhost -p 5432 -d factory_erp
   ```
3. Manually complete the remaining SQL statements or roll back the partial changes.
4. If the migration is complete in the database but not marked in Prisma:
   ```bash
   DATABASE_URL="..." npx prisma migrate resolve --applied "<migration-name>"
   ```
5. If the migration is incomplete and partially applied, roll back the partial changes:
   - Write a rollback SQL file.
   - Execute it as `postgres` superuser.
   - Do not mark the migration as applied.
6. Regenerate Prisma client:
   ```bash
   DATABASE_URL="..." npx prisma generate
   ```
7. Run `npm run build` to verify.

**Escalate to architect if:** The rollback SQL would cause data loss or the migration state cannot be determined.

---

## Section 6 — Prisma Client Out of Sync

**Symptom:** Prisma generates TypeScript errors because the client doesn't match the schema. Or: Prisma operations fail with "unknown field" or "model does not exist" errors at runtime.

**Cause:** `prisma/schema.prisma` was modified but `prisma generate` was not run afterward.

**Recovery Steps:**

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
npm run build
```

This is a fast, safe recovery. `prisma generate` reads the schema and regenerates the TypeScript client without touching the database.

---

## Section 7 — Dependency Corruption (node_modules)

**Symptom:** Import errors at build time for packages that should exist. Or: Prisma client not found. Or: `npm run test` fails with module import errors.

**Recovery Steps:**

```bash
# Remove corrupted node_modules
rm -rf node_modules

# Remove lock file only if absolutely necessary (preserves installed versions)
# rm package-lock.json  <-- only if lock file is corrupted

# Reinstall all dependencies
npm install

# Regenerate Prisma client
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate

# Rebuild
npm run build
```

**Note:** Do not remove `package-lock.json` unless it is corrupted. The lock file ensures deterministic installs.

---

## Section 8 — Git Conflict on Main

**Symptom:** A merge conflict exists on main (should not occur in single-contributor model, but documented for completeness).

**Recovery Steps:**

1. Do not use `git checkout .` or `git restore .` — these discard all uncommitted changes.
2. Read the conflict markers in the affected files.
3. Resolve each conflict by choosing the correct version or merging the changes.
4. After resolving all conflicts:
   ```bash
   git add <resolved-files>
   git commit -m "fix: resolve merge conflict in <file>"
   ```
5. Run all three gates to verify the resolution is correct.

**If the conflict cannot be safely resolved:** Escalate to architect. Do not force-push to overwrite the conflict.

---

## Section 9 — Database Connection Failure

**Symptom:** Application fails to start with a database connection error. Or: Prisma CLI commands fail with connection timeout.

**Diagnosis Steps:**

1. Verify PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```
2. Verify the connection string in `.env`:
   ```
   DATABASE_URL=postgresql://elkardousy:250686@localhost:5432/factory_erp
   ```
3. Test the connection:
   ```bash
   psql -U elkardousy -h localhost -p 5432 -d factory_erp -c "SELECT 1;"
   ```

**Common Causes and Fixes:**

| Cause | Fix |
|-------|-----|
| PostgreSQL not running | Start PostgreSQL service |
| Wrong port | Verify port 5432 |
| Wrong database name | Verify `factory_erp` |
| Wrong password | Verify `250686` for `elkardousy` |
| `factory` schema not created | Run initial migration as `postgres` |

---

## Section 10 — Application Startup Failure

**Symptom:** `npm run start:dev` or `npm run start:prod` fails to start. NestJS throws at module initialization.

**Common Causes and Recovery:**

| Error Pattern | Cause | Fix |
|--------------|-------|-----|
| `Nest cannot resolve dependencies of <X>` | Provider not in module's `providers` array | Add the missing provider to the module |
| `ENV validation failed: JWT_SECRET is required` | Missing env var | Add to `.env` |
| `Cannot connect to database` | Database not running or wrong credentials | See Section 9 |
| `MODULE_NOT_FOUND` at runtime | Built with wrong `dist/` — stale build | Run `npm run build` again |
| `PrismaClientInitializationError` | `prisma generate` not run | Run `prisma generate` |
| `Cannot read properties of undefined` in guard | Circular dependency | Check AppModule import order |

---

## Risk Register References

These recovery procedures correspond to risks in KEB-11:

| Risk | Section |
|------|---------|
| RISK-001 (composite PK findUnique) | Section 3 (test failure) |
| RISK-002 (BigInt serialization) | Section 3 (test failure) |
| RISK-003 (prisma db pull) | **Section 4** (critical) |
| RISK-004 (superuser password) | Section 5 (migration) |
| RISK-005 (race condition) | Not yet recoverable — open risk |
| RISK-006 (permission cache) | Section 10 (restart app to clear) |
| RISK-007 (multiSchema preview) | Section 6 (Prisma client sync) |
| RISK-008 (DDL privileges) | Section 5 (migration failure) |
