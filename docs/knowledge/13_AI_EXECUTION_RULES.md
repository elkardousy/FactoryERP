# 13 — AI Execution Rules

**Generated:** 2026-06-29  
**Commit:** 5a5e3d6

---

## Purpose

This document captures the rules and constraints that AI assistants (Claude Code) must follow when working in this repository. These rules are extracted from `CLAUDE.md`, `docs/architecture/`, and the accumulated sprint history.

---

## Source of Truth Files

| File | Authority |
|------|-----------|
| `CLAUDE.md` | Primary rules — always read before any implementation |
| `docs/architecture/ARCHITECTURE_PRINCIPLES.md` | Governing architecture principles |
| `docs/architecture/DEPENDENCY_RULES.md` | Import dependency constraints |
| `docs/architecture/REPOSITORY_RULES.md` | Repository pattern rules |
| `docs/architecture/CODING_STANDARDS.md` | Code style and naming |
| `docs/architecture/SPRINT11_CONTRACT.md` | Sprint 11 scope and gate conditions |

---

## ABSOLUTE PROHIBITIONS

### Database

1. **NEVER run `prisma db pull`** — overwrites `prisma/schema.prisma`, destroys `ReservationStatusEnum`, strips `@updatedAt`, renames relations, causes TypeScript errors.
2. **NEVER run `prisma migrate deploy`** — `elkardousy` lacks `ALTER TABLE` privileges on the `factory` schema.
3. **NEVER modify `prisma/schema.prisma` without explicit authorization** — it is the committed source of truth.
4. **NEVER write to `prisma/migrations/` without explicit authorization**.

### Code Quality

5. **NEVER use `this.logger.log()`** — `LoggerService` has no `.log()` method. Use `.info()`, `.warn()`, `.error()`, `.debug()`.
6. **NEVER inject `PrismaService` directly in Services or Use Cases** — only Repositories may inject PrismaService.
7. **NEVER use `findUnique` for `inventory_transactions` by `txn_id` alone** — use `findFirst` (composite PK).
8. **NEVER use `export { Foo }` for pure TypeScript interfaces/types in barrels** — use `export type { Foo }` (`isolatedModules: true`).
9. **NEVER use `process.env` directly** — use `ConfigService` (exceptions: PrismaService constructor, loggerConfig).

### Architecture

10. **NEVER bypass the layer ordering**: Controllers → Use Cases → Services → Repositories → PrismaService.
11. **NEVER import `PrismaModule` in feature modules** — it is `@Global()`.
12. **NEVER import `LoggerModule`, `AuditModule`, or `DocumentNumberingModule` in feature modules** — they are `@Global()`.

---

## MANDATORY RULES

### Before Writing Any Code

1. Read `CLAUDE.md` at the root of the repository.
2. Identify which sprint/phase the task belongs to.
3. Verify that the relevant Prisma models exist and match expectations.
4. Check that no schema changes are required (if schema changes are needed, STOP and flag).

### For Every New Feature

1. Controllers must stay thin — validate input, call one use case, return result.
2. Use Cases hold all business logic for the feature.
3. Services provide reusable capabilities only.
4. Repositories are the only layer touching Prisma.
5. Every new module must register providers in its `@Module()` decorator.
6. New endpoints must include: `@ApiBearerAuth('JWT')`, `@ApiOperation()`, `@ApiResponse()`, appropriate `@Roles()`.

### For Inventory Module Specifically

1. `inventory_transactions` — always use `findFirst` (never `findUnique`) when filtering by `txn_id` alone.
2. TRANSFER operations — must use `executeInTransaction` to atomically create two records (RELEASE + RECEIVING).
3. Available quantity — computed as `bag.current_dozens - SUM(ACTIVE reserved_dozens)`, not a stored field.
4. `ReservationStatusEnum.EXPIRED` does not exist — expire operations map to CANCELLED.
5. Bag movement history comes from `physical_bag_movements` table, NOT from `inventory_transactions`.

### Prisma CLI Commands

Always prefix with DATABASE_URL:

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma <command>
```

For DDL migrations:
```bash
# Step 1: Execute SQL as superuser
PGPASSWORD="<pw>" psql -U postgres -h localhost -p 5432 -d factory_erp -f prisma/migrations/<dir>/migration.sql
# Step 2: Mark applied
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate resolve --applied "<name>"
# Step 3: Regenerate
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
```

---

## REQUIRED CHECKS BEFORE SUBMITTING

### Build Gate

```bash
npm run build
```
Must exit with code 0. No TypeScript errors.

### Lint Gate

```bash
npm run lint
```
Must report 0 errors. Warnings acceptable.

### Test Gate

```bash
npm run test
```
All tests must pass. No new test failures.

---

## RECOVERY PROCEDURES

### If prisma db pull Was Accidentally Run

```bash
git checkout HEAD -- prisma/schema.prisma
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
npm run build
```

### If Build Fails After Prisma Generate

1. Check for TypeScript errors in generated client types.
2. Verify `prisma/schema.prisma` was not accidentally modified.
3. Run `git diff prisma/schema.prisma` to confirm schema is unchanged.

---

## AI ENGINEERING OPERATING SYSTEM (.ai/)

The `.ai/` directory contains the AI Engineering Operating System (EOS v1.0):

| Directory | Contents |
|-----------|---------|
| `.ai/AI_SESSION/` | Session state tracking |
| `.ai/CHECKLISTS/` | Pre/post implementation checklists |
| `.ai/PLAYBOOKS/` | Standard operating procedures |
| `.ai/QUALITY_GATES/` | Gate condition definitions |
| `.ai/RELEASE_PROMPTS/` | Release procedure prompts |
| `.ai/REVIEW_PROMPTS/` | Code review prompts |
| `.ai/SPRINT_PROMPTS/` | Sprint execution prompts |
| `.ai/TEMPLATES/` | Template files for new features |

---

## CODE STYLE RULES

### Comments

- Default: NO comments.
- Add comments only when the WHY is non-obvious (hidden constraint, workaround, subtle invariant).
- Never describe WHAT the code does (identifiers do that).
- Never reference the current task, issue, or caller in comments.

### Naming

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Methods/variables: `camelCase`
- Database fields: `snake_case` (matches Prisma schema)
- Enums: `PascalCase` (TypeScript) / `snake_case` (PostgreSQL mapping)

### DTOs

- Use `@ApiProperty()` for all DTO properties (Swagger).
- Use `@IsString()`, `@IsNumber()`, `@IsOptional()`, etc. from `class-validator`.
- Separate request DTOs, response DTOs, and filter DTOs.

### Commands and Queries

- Commands are immutable value objects (constructor-only).
- Queries are immutable value objects (constructor-only).
- No logic in commands/queries.

### Module Structure

Follow the established pattern:
```
src/modules/<name>/
  controllers/<name>.controller.ts
  dto/<request|response|filter>.dto.ts
  repositories/<name>.repository.ts
  services/<factory|mapper|validator|service>.ts
  use-cases/<feature>/
    commands/<name>.command.ts
    queries/<name>.query.ts
    <name>.use-case.ts
  contracts/<result>.interface.ts
  <name>.module.ts
```

---

## SPRINT EXECUTION RULES

When given a sprint prompt:

1. Read the MASTER EXECUTION PROMPT carefully.
2. Identify all files to create/modify.
3. Implement in dependency order (types → interfaces → commands → repositories → services → use cases → controller → module → tests).
4. Run build → lint → test after each major step.
5. Fix all lint errors before committing.
6. Do NOT change architecture.
7. Do NOT change Prisma schema.
8. Do NOT change SQL migrations.
9. Do NOT create commits unless explicitly asked.

---

## EVIDENCE RULE

When writing documentation or analysis:

- Only state facts that can be verified from repository source.
- If something cannot be verified: mark it `UNKNOWN`.
- Do not infer architecture that does not exist.
- Do not speculate about future changes.
- Do not guess about business rules — derive from code or schema.
