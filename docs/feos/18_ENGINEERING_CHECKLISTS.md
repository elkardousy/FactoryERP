# 18 — Engineering Checklists

**Document:** FEOS-18  
**Category:** Quality  
**Authority:** MANDATORY (gate checklists) / RECOMMENDED (operational checklists)  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-01 (Constitution), FEOS-04 (Implementation), FEOS-11 (Module), FEOS-16 (Release)  
**Related KEB:** KEB-09 (Testing Baseline), KEB-20 (Engineering Baseline)

---

## Purpose

This document provides definitive checklists for all standard engineering operations in FactoryERP. Checklists are the operational execution form of governance rules.

## Scope

Session start, sprint gates, code review, module completion, database changes, release, and security review.

## Audience

All engineers and AI agents. Checklists must be completed in order — do not skip items.

---

## Checklist 01 — Session Start

Run before any implementation work in a new engineering session:

- [ ] `git status` — confirm clean working tree.
- [ ] `git log --oneline -5` — confirm knowledge of recent commits.
- [ ] `npm run build` exits 0.
- [ ] `npm run test` exits 0.
- [ ] Sprint scope confirmed with engineer.
- [ ] FEOS-12 (AI Governance) read if this is an AI session.
- [ ] KEB-07 checked for prerequisite module status.

---

## Checklist 02 — Pre-Commit Quality Gate

Run before any commit:

- [ ] `npm run build` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` exits 0.
- [ ] No `console.log()` in source files.
- [ ] No `this.logger.log()` in source files.
- [ ] No `cb: any` in test mock callbacks.
- [ ] No `export { Interface }` (must be `export type { Interface }`) for pure TypeScript types.
- [ ] No `findUnique()` on `inventory_transactions` or `audit_events`.
- [ ] No raw `PrismaService` injected in non-repository classes.
- [ ] No `process.env` access outside `PrismaService` and `loggerConfig`.

---

## Checklist 03 — Use Case Completion

For each new use case added to the codebase:

### Implementation
- [ ] Use case class created in correct directory.
- [ ] `execute()` method is the single entry point.
- [ ] Command or Query object created and used as input.
- [ ] All repository calls go through injected repository (not direct Prisma).
- [ ] All BigInt IDs converted from `string` (DTO) to `BigInt()` before Prisma.
- [ ] Logger used: `this.logger.info()` on success.
- [ ] Exceptions thrown as NestJS HTTP exceptions.
- [ ] Registered in module's `providers` array.

### Test Coverage
- [ ] Happy path test written.
- [ ] Primary failure path test written.
- [ ] Mock callbacks typed correctly (no `cb: any`).
- [ ] `jest.clearAllMocks()` in `beforeEach`.
- [ ] All tests pass.

### API
- [ ] Controller endpoint added.
- [ ] Endpoint calls exactly one use case.
- [ ] `@ApiOperation` annotation present.
- [ ] `@ApiResponse` annotation present.
- [ ] DTO has `@ApiProperty` on all fields.
- [ ] `@ApiBearerAuth('JWT')` on controller class.

---

## Checklist 04 — New Module Completion

Before marking a new NestJS module as Complete:

### Module Structure
- [ ] Module file exists with `@Module()` declaration.
- [ ] All providers in `providers` array.
- [ ] Module added to `AppModule.imports`.
- [ ] No global module (PrismaModule, LoggerModule, AuditModule, DocumentNumberingModule) in imports.

### Repositories
- [ ] All repositories extend `BaseRepository`.
- [ ] No repository injects `PrismaService` without extending `BaseRepository`.
- [ ] Composite PK tables use `findFirst()`.
- [ ] Atomic multi-record operations use `executeInTransaction()`.

### Services
- [ ] Factory service creates domain objects with all business invariants applied.
- [ ] Mapper service converts Prisma results to response DTOs.
- [ ] Validator service throws HTTP exceptions on rule violations.

### Use Cases
- [ ] All planned use cases implemented.
- [ ] All use cases have `execute()` as entry point.
- [ ] No use case calls another use case.

### Controller
- [ ] Controller uses `version: '1'` in `@Controller()`.
- [ ] Controller has `@ApiBearerAuth('JWT')`.
- [ ] Each action calls exactly one use case.
- [ ] No business logic in controller.

### Types
- [ ] BigInt IDs: accepted as `string` in DTO, converted to `BigInt()` before queries.
- [ ] Response DTOs: all BigInt fields are `string`, all Decimal fields are `string`.
- [ ] Interface exports from barrels use `export type { }`.

### Tests
- [ ] All use cases have happy path + failure path tests.
- [ ] All tests pass.
- [ ] No `cb: any` in mocks.

### Quality Gates
- [ ] `npm run build` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` exits 0.

### Documentation
- [ ] ADRs written for all new architectural decisions.
- [ ] KEB-07 updated to reflect COMPLETE status.
- [ ] Sprint report committed.

---

## Checklist 05 — Database Change

Before any schema or migration change:

### Preparation
- [ ] Migration SQL written to `prisma/migrations/<timestamp>_<name>/migration.sql`.
- [ ] SQL reviewed for safety (no DROP without explicit architect approval).
- [ ] SQL does not contain the postgres superuser password in plain text.

### Execution
- [ ] DDL executed as `postgres` superuser via `PGPASSWORD env var + psql`.
- [ ] `npx prisma migrate resolve --applied "<name>"` run (with DATABASE_URL prefix).
- [ ] `npx prisma generate` run (with DATABASE_URL prefix).
- [ ] `prisma/schema.prisma` updated to reflect the change.
- [ ] `npm run build` exits 0.

### Verification
- [ ] `npx prisma migrate status` shows the migration as applied.
- [ ] `npm run test` exits 0.
- [ ] No TypeScript errors introduced by schema change.

---

## Checklist 06 — Code Review

When reviewing a pull request or AI-generated implementation:

### Architecture
- [ ] No `PrismaService` injected outside repositories.
- [ ] Controllers call exactly one use case per action.
- [ ] Use cases do not call each other.
- [ ] No global module re-imported in feature module.
- [ ] Guard stack not modified without ADR.
- [ ] Filter order not modified.

### Code Quality
- [ ] No `console.log()` in production code.
- [ ] No `this.logger.log()`.
- [ ] No `process.env` access (except documented exceptions).
- [ ] No `cb: any` in test mocks.
- [ ] No `findUnique()` on composite PK tables.
- [ ] No `EXPIRED` added to `ReservationStatusEnum`.
- [ ] Interface re-exports use `export type`.

### API
- [ ] All endpoints have Swagger annotations.
- [ ] Response DTOs do not expose sensitive fields.
- [ ] Authentication not bypassed without documented `@Public()`.

### Tests
- [ ] All new use cases have tests.
- [ ] Tests pass.
- [ ] Test count has not decreased.

---

## Checklist 07 — Security Review

Before a module goes to production:

- [ ] All endpoints authenticated (JWT) or explicitly `@Public()`.
- [ ] All mutating endpoints have screen permission checks.
- [ ] No sensitive fields in response DTOs (passwords, tokens, session IDs).
- [ ] Audit logging wired to all data mutation use cases.
- [ ] No hardcoded credentials in source files.
- [ ] No sensitive data in log statements.
- [ ] `@Public()` endpoints are documented and architect-approved.
- [ ] CORS configured with origin whitelist (for production).
- [ ] Rate limiting active on all endpoints.

---

## Checklist 08 — Sprint Completion

Before declaring a sprint Complete (FEOS-01, Article IV):

- [ ] All use cases in sprint scope implemented.
- [ ] `npm run build` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` exits 0.
- [ ] All new endpoints have Swagger documentation.
- [ ] All new architectural decisions have ADRs.
- [ ] Sprint report written and committed.
- [ ] KEB document(s) updated.
- [ ] Git tag created: `git tag -a <tag> -m "<message>"`.
- [ ] No open blocking defects.

---

## Checklist 09 — Release

Before tagging a minor or major release:

- [ ] All sprints in the release are Sprint Complete.
- [ ] `npm run build` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` exits 0.
- [ ] `prisma migrate status` shows no pending migrations.
- [ ] Release notes written in `docs/releases/`.
- [ ] `package.json` version bumped.
- [ ] Release commit created: `git commit -m "release: v<version>"`.
- [ ] Annotated tag created: `git tag -a v<version> -m "Release v<version>"`.
- [ ] Post-release validation checklist (FEOS-16) completed.

---

## Checklist 10 — AI Session End

At the end of any AI engineering session:

- [ ] All three quality gates verified and results reported.
- [ ] Summary of completed work provided.
- [ ] Summary of remaining sprint scope provided.
- [ ] Any blockers or open risks reported.
- [ ] No uncommitted changes left unless explicitly requested to leave them staged.
- [ ] No out-of-scope files modified.
- [ ] No commits made without explicit instruction.
- [ ] No pushes made without explicit instruction.
