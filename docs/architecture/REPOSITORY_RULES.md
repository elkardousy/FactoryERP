# Repository Rules

Git workflow, branch strategy, and commit conventions for FactoryERP.

---

## Branch Strategy

### Main Branch

- **`main`** is the production-ready branch
- All code on `main` must pass lint, build, and all tests
- Direct commits to `main` are restricted — changes arrive via pull request

### Feature Branches

Branch naming convention:

```
<type>/<short-description>
```

Examples:
```
feat/customer-module
fix/refresh-token-expiry
refactor/auth-guard-stack
docs/adr-series
chore/upgrade-nestjs-11
```

Types mirror conventional commit types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`.

---

## Commit Message Convention

FactoryERP uses **Conventional Commits**:

```
<type>(<scope>): <short description>
```

- `type`: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `style`
- `scope`: module or area affected (`auth`, `customers`, `core`, `prisma`, `docs`)
- `short description`: imperative mood, lowercase, no period

**Examples from this project's git history:**
```
feat(auth): add password token and session services
refactor(auth): integrate JWT into auth module
feat(core): complete application foundation
feat(core): complete response wrapper foundation
feat(exceptions): add prisma exception filter
```

---

## Pull Request Rules

### Before Opening a PR

Verify locally:
```bash
npm run lint       # must exit 0
npm run build      # must succeed
npm run test       # all suites must pass
```

### PR Description

Include:
- **What changed**: brief summary of the feature or fix
- **Why**: the business or technical motivation
- **How to test**: specific scenarios to verify
- **Migrations**: if schema changed, note the migration name

### PR Size

- Prefer focused PRs that implement one feature or fix one bug
- Large feature sprints may use a feature branch with stacked commits, merged as one PR at sprint end
- Avoid PRs that mix feature work with unrelated refactoring

---

## Schema Migration Rules

### CRITICAL — `prisma db pull` is PROHIBITED

**Never run `prisma db pull` without explicit authorization from the lead developer.**

`prisma db pull` introspects the live database and **overwrites** `prisma/schema.prisma`. Because this project's database was originally created by SQL Phase 0–20 scripts (before Prisma was introduced), the live database schema diverges from the committed Prisma schema in ways Prisma cannot reconstruct:
- Custom enum types become raw `String` fields
- `@updatedAt` directives are removed
- Relation names change, breaking TypeScript compilation
- Index directives added for application-layer semantics are dropped

The committed `prisma/schema.prisma` is the **source of truth**. The live database adapts to it — not the other way around.

**If `prisma db pull` is accidentally run, recover immediately:**
```bash
git checkout HEAD -- prisma/schema.prisma
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
npm run build    # must exit 0 before proceeding
```

### Prisma CLI requires explicit DATABASE_URL

`prisma.config.ts` causes Prisma to skip automatic `.env` loading. Always prefix Prisma CLI commands:

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma <command>
```

### Migration execution workflow

The application user (`elkardousy`) lacks `ALTER TABLE` / `CREATE TYPE` privileges — those tables are owned by `postgres`. All migrations must be executed by the `postgres` superuser, then marked applied in Prisma:

```bash
# 1. Write migration SQL to prisma/migrations/<timestamp>_<name>/migration.sql
# 2. Execute as postgres:
PGPASSWORD="<postgres-pw>" "C:\Program Files\PostgreSQL\18\bin\psql.exe" \
  -U postgres -h localhost -p 5432 -d factory_erp \
  -f "prisma/migrations/<timestamp>_<name>/migration.sql"
# 3. Mark applied in Prisma:
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" \
  npx prisma migrate resolve --applied "<timestamp>_<name>"
# 4. Regenerate client:
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
```

### Recovering from a failed migration

```bash
# Mark the failed migration as rolled back so Prisma allows new runs:
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" \
  npx prisma migrate resolve --rolled-back "<migration-name>"
# Fix the SQL, re-execute as postgres, then mark applied as above.
```

### Never Manually Edit Migration Files

Once a migration file is committed, it is immutable. If a mistake is in a migration that has not reached production, revert it with a new migration — do not edit the existing file.

### After Schema Changes

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
```

Regenerates the Prisma client after any `schema.prisma` change. This must be run before `npm run build`.

---

## File Structure Rules

### New Module Checklist

When adding a new domain module:

```
src/modules/<domain>/
  controllers/
    <domain>.controller.ts
    <domain>.controller.spec.ts   (optional — thin controller, test at use-case level)
  dto/
    create-<domain>.dto.ts
    update-<domain>.dto.ts
  repositories/
    <domain>.repository.ts
  use-cases/
    create-<domain>/
      dto/
        create-<domain>.dto.ts    (if complex enough for own directory)
      <domain>-create.use-case.ts
      <domain>-create.use-case.spec.ts
      index.ts                    (barrel export)
    ... (one directory per use case)
  <domain>.module.ts
```

### Barrel Exports

Each `use-cases/<name>/` directory has an `index.ts` that re-exports:
- The use case class (plain `export {}`)
- Any DTO or contract interfaces (must use `export type {}` for interfaces)

---

## Versioning and Tagging

- Release tags follow `v<major>.<minor>.<patch>` (e.g., `v1.0.0`)
- Pre-release suffixes: `-alpha.1`, `-beta.1`, `-rc.1`
- Sprint completion tags: optional, named `sprint-<N>-complete`

---

## What Not to Commit

- `.env` files (environment-specific secrets)
- `node_modules/`
- `dist/` (build output)
- `.prisma/client/` (generated Prisma client)
- IDE-specific files (`.vscode/settings.json`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)

All of these are in `.gitignore`.
