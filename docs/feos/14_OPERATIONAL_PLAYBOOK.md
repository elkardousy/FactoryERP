# 14 — Operational Playbook

**Document:** FEOS-14  
**Category:** Operations  
**Authority:** RECOMMENDED  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-04 (Implementation Governance), FEOS-15 (Recovery Playbook), FEOS-16 (Release Playbook), FEOS-18 (Checklists)  
**Related KEB:** KEB-08 (Implementation Status), KEB-12 (Git Baseline)

---

## Purpose

This document defines the daily engineering workflow, sprint execution process, and phase review procedures for FactoryERP. It provides the operational context for how engineering work is organized and executed day-to-day.

## Scope

Day-to-day engineering workflow, sprint initiation and closure, and phase reviews.

## Audience

Engineers and AI agents executing FactoryERP sprint work.

---

## Daily Engineering Workflow

### At Session Start

1. Verify current git state: `git status`, `git log --oneline -5`.
2. Confirm the repository is clean (no uncommitted changes from prior sessions).
3. Verify build state: `npm run build`.
4. Verify test state: `npm run test`.
5. Confirm the approved sprint scope for the current session.
6. Load relevant FEOS documents (FEOS-12, FEOS-01, and scope-relevant governance docs).
7. Load relevant KEB documents (KEB-07, KEB-02, KEB-08 as applicable).

### During Implementation

1. Work within the approved sprint scope only.
2. Implement in layer order: repository → service → use case → controller.
3. Run the build gate after each significant change: `npm run build`.
4. Run the lint gate after completing a file: `npm run lint`.
5. Write tests before declaring a use case complete.
6. Run the test gate after writing tests: `npm run test`.
7. Report any blocker immediately rather than working around it.

### At Session End

1. Run all three gates: `npm run build && npm run lint && npm run test`.
2. Report the gate status explicitly.
3. Summarize what was completed in the session.
4. Summarize what remains in the sprint scope.
5. Identify any open blockers or risks discovered.
6. Do not commit unless explicitly instructed.

---

## Sprint Execution Process

### Sprint Initiation

A sprint is initiated when the engineer:

1. States the sprint scope (named list of features, use cases, models).
2. Verifies prerequisites are complete via KEB-07.
3. Confirms the three quality gates were passing at session start.
4. Specifies the acceptance criteria.

### Sprint Execution

The sprint proceeds through the implementation workflow defined in FEOS-04:

1. **Schema verification** — confirm all Prisma models are available.
2. **Repository layer** — implement new repository methods.
3. **Service layer** — implement validators, mappers, factories.
4. **Use case layer** — implement command and query use cases.
5. **Controller layer** — wire use cases to endpoints.
6. **DTO layer** — define request/response DTOs.
7. **Test layer** — write unit tests for all use cases.
8. **Documentation** — write ADRs for new decisions.
9. **Gate check** — run all three quality gates.

### Sprint Closure

A sprint is closed when:

1. All gates pass.
2. Sprint report is committed.
3. KEB is updated.
4. Git tag is created.
5. Engineer declares the sprint Complete.

---

## Development Server Operations

### Starting Development Mode

```bash
npm run start:dev
```

This runs NestJS in watch mode — file changes trigger automatic restart. Use this during active development.

### Starting Production Mode

```bash
npm run build
npm run start:prod
```

Build first, then run the compiled output from `./dist`.

### Prisma Studio

To browse the database in a browser GUI:

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma studio
```

Opens on port 5555 by default. Use for data inspection only — do not modify production data through Prisma Studio.

---

## Database Operations

### Checking Migration Status

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate status
```

This shows applied, pending, and failed migrations without modifying anything.

### Connecting to PostgreSQL Directly

```bash
# As application user (no DDL)
psql -U elkardousy -h localhost -p 5432 -d factory_erp

# As superuser (for DDL execution)
PGPASSWORD="<postgres-password>" psql -U postgres -h localhost -p 5432 -d factory_erp
```

### Executing a Migration

Full workflow documented in FEOS-05 and FEOS-06. Summary:

```bash
# 1. Execute DDL as superuser
PGPASSWORD="<postgres-password>" psql -U postgres -h localhost -p 5432 -d factory_erp -f prisma/migrations/<dir>/migration.sql

# 2. Mark applied
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma migrate resolve --applied "<migration-name>"

# 3. Regenerate client
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate

# 4. Verify build
npm run build
```

---

## Test Operations

### Running Tests

```bash
npm run test                                           # All unit tests
npm run test -- --testPathPattern=inventory           # Filter by path
npm run test -- --testNamePattern="CreateReservation" # Filter by test name
npm run test:cov                                       # With coverage
npm run test:e2e                                       # E2E tests
npm run test:watch                                     # Watch mode
```

### Investigating a Test Failure

1. Read the full error output — jest prints the test name, expected vs received, and stack trace.
2. Identify which use case is failing.
3. Read the spec file for context.
4. Read the use case implementation.
5. Fix the root cause (code or test).
6. Re-run the specific test: `npm run test -- --testNamePattern="<failing test name>"`.
7. Re-run all tests to verify no regressions.

---

## Phase Review Process

A phase review occurs at the end of a major phase (Phase 1, 2, 3, etc.) or at significant milestones.

### Phase Review Checklist

1. All sprints in the phase are Complete (per FEOS-01 Article IV).
2. All quality gates pass.
3. All ADRs are committed and complete.
4. KEB documents are updated to reflect the phase's delivered features.
5. Risk Register (KEB-11) is updated with any new or resolved risks.
6. Phase summary document is written in `docs/checkpoints/`.
7. Phase tag is created in git.
8. Readiness for the next phase is assessed.

---

## Incident Response

If the main branch enters a broken state (build failing, tests failing, lint errors):

1. **Stop all sprint work immediately.**
2. Identify the commit that introduced the failure: `git bisect` if needed.
3. Fix the root cause in a new commit (never amend `main`).
4. Verify all three gates pass after the fix.
5. Document the incident in the sprint report.

If the database state is inconsistent (schema mismatch, failed migration):

1. Check migration status: `prisma migrate status`.
2. Identify the point of divergence.
3. Follow FEOS-15 (Recovery Playbook), Section: Migration Failure Recovery.

---

## Environment Variables Checklist

Before running the application, verify all required env vars are set:

```bash
# Check .env file exists and contains all required vars
cat .env

# Required vars:
NODE_ENV=development
DATABASE_URL=postgresql://elkardousy:250686@localhost:5432/factory_erp
JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
```

If startup fails with validation errors, `env.validation.ts` will print which variable is missing.

---

## Common Operations Quick Reference

| Operation | Command |
|-----------|---------|
| Build | `npm run build` |
| Development mode | `npm run start:dev` |
| Production mode | `npm run start:prod` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Tests | `npm run test` |
| Tests (coverage) | `npm run test:cov` |
| Prisma validate | `DATABASE_URL=... npx prisma validate` |
| Prisma generate | `DATABASE_URL=... npx prisma generate` |
| Prisma status | `DATABASE_URL=... npx prisma migrate status` |
| Prisma studio | `DATABASE_URL=... npx prisma studio` |
| Git status | `git status` |
| Git log | `git log --oneline -10` |
| Git tag | `git tag -a <name> -m "<message>"` |
