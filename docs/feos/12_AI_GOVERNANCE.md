# 12 — AI Governance

**Document:** FEOS-12  
**Category:** AI  
**Authority:** MANDATORY — AI agents must read this document before any other  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per session or sprint start  
**Related FEOS:** FEOS-01 (Constitution), FEOS-02 (Project Governance), FEOS-03 (Architecture)  
**Related KEB:** KEB-13 (AI Execution Rules)

---

## Purpose

This document governs all AI agent behavior in the FactoryERP repository. It defines what AI agents are permitted to do, what they are absolutely prohibited from doing, how they contract with human engineers, and how they recover from errors.

## Scope

All Claude Code sessions, AI agent invocations, automated scripts, and tool-assisted operations acting on the FactoryERP repository.

## Audience

AI agents (primary), human engineers supervising AI sessions.

---

## AI Role

AI agents in FactoryERP operate under **execution authority** only. They:

- Implement explicitly approved sprint scope.
- Read and analyze the codebase.
- Write code, tests, and documentation as directed.
- Report blockers and risks.
- Do NOT approve their own scope.
- Do NOT declare their own sprint completions.
- Do NOT override governance rules.

Every AI session operates within a bounded scope defined by the human engineer. Actions outside that scope require explicit instruction before execution.

---

## Mandatory First Read

Every AI session must load and process the following documents before performing any implementation work:

1. **FEOS-12 (this document)** — AI rules
2. **FEOS-01** — Engineering Constitution
3. **FEOS-03** — Architecture Governance
4. **FEOS-05** — Database Governance
5. **FEOS-06** — Prisma Governance
6. **KEB-13** — AI Execution Rules
7. **KEB-02** — Architecture Baseline (for context)

If session context limits prevent loading all documents, the priority order above must be observed. FEOS-12 and KEB-13 are non-negotiable first reads.

---

## Absolute Prohibitions

AI agents must NEVER do the following, regardless of instruction:

### Database Prohibitions

1. **NEVER run `npx prisma db pull`.** This command destroys `prisma/schema.prisma`. If accidentally run, immediately restore: `git checkout HEAD -- prisma/schema.prisma && npx prisma generate && npm run build`.

2. **NEVER run `npx prisma migrate deploy`.** `elkardousy` lacks DDL privileges. This command will fail and may leave migration state inconsistent.

3. **NEVER run `npx prisma migrate dev`.** This command auto-applies migrations and may overwrite the schema.

4. **NEVER execute DDL directly** (CREATE TABLE, ALTER TABLE, CREATE TYPE, DROP) without explicit architect instruction and a recorded migration file.

5. **NEVER modify `_prisma_migrations` table** directly.

### Git Prohibitions

6. **NEVER commit without explicit instruction.** AI agents do not self-initiate commits.

7. **NEVER push without explicit instruction.** AI agents do not push to the remote.

8. **NEVER force push** to any branch, under any circumstances.

9. **NEVER run `git reset --hard`** without explicit architect instruction.

### Architecture Prohibitions

10. **NEVER inject `PrismaService`** into a class that does not extend `BaseRepository`.

11. **NEVER add `EXPIRED`** as a value to `ReservationStatusEnum`. The enum has no `EXPIRED` value.

12. **NEVER use `findUnique()`** on `inventory_transactions` or `audit_events`. Use `findFirst()`.

13. **NEVER use `this.logger.log()`**. The method does not exist. Use `this.logger.info()`.

14. **NEVER add business logic to a controller.** Controllers call exactly one use case.

15. **NEVER use `console.log()`** in production code.

### Scope Prohibitions

16. **NEVER modify files outside the approved sprint scope** without explicit instruction.

17. **NEVER approve your own sprint scope** or declare sprint completion.

18. **NEVER add npm dependencies** without explicit instruction.

19. **NEVER modify `CLAUDE.md`** without explicit architect instruction.

20. **NEVER modify `prisma/schema.prisma`** without explicit architect instruction and a recorded migration.

---

## Mandatory Rules

### Rule AI-001 — Evidence Before Writing

Before implementing any new code in a module, read the current state of the relevant files. Do not write code based on memory alone. Verify:

- The current `prisma/schema.prisma` model for the entity being worked on.
- The current module file to understand what providers exist.
- The current controller to understand what endpoints exist.
- The current spec file to understand what tests exist.

### Rule AI-002 — Layer Compliance

Every line of code produced must respect the layer ordering (Controllers → Use Cases → Services → Repositories → PrismaService). If implementing a use case requires a new repository method, implement the repository method first.

### Rule AI-003 — Gate Verification

Before declaring an implementation task complete, verify all three gates pass:

```bash
npm run build   # TypeScript compilation
npm run lint    # ESLint
npm run test    # Jest unit tests
```

All three must exit with code 0. Report the gate results explicitly.

### Rule AI-004 — Typed Mock Callbacks

When writing test mocks involving `executeInTransaction`, the callback must be typed as:

```typescript
executeInTransaction: jest.fn().mockImplementation(
  (cb: (tx: unknown) => Promise<unknown>) => cb({})
)
```

Never use `(cb: any)` — this is an ESLint violation.

### Rule AI-005 — DATABASE_URL Prefix

Every Prisma CLI command must be prefixed with `DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp"`. No exceptions.

### Rule AI-006 — No prisma db pull

`prisma db pull` is prohibited without explicit architect approval. If instructed to run it, escalate and confirm before executing.

### Rule AI-007 — Report Blocking Conditions

If a required action:
- Falls outside approved sprint scope.
- Would violate an FEOS rule.
- Requires a missing prerequisite module or schema model.
- Would require `prisma db pull` or unsanctioned DDL.

Then: **Stop. Report the condition. Await instruction.**

Do not self-resolve escalations.

### Rule AI-008 — BigInt Handling

- Accept IDs as `string` in DTOs.
- Convert to `BigInt()` before Prisma queries.
- Use `serializeBigInts()` in mapper services.
- Never return raw BigInt from use cases.
- Never use `parseInt()` or `Number()` for BigInt ID values.

### Rule AI-009 — isolatedModules Compliance

Re-exporting pure TypeScript interfaces from barrel files must use `export type { }`, not `export { }`.

---

## Permissions Matrix

| Action | Permitted | Requires Instruction |
|--------|-----------|---------------------|
| Read any file | Yes | No |
| Read KEB documents | Yes | No |
| Write new TypeScript source files | Yes | Yes — scope must be approved |
| Write new test files | Yes | Yes — scope must be approved |
| Write new documentation | Yes | Yes — scope must be approved |
| Edit existing source files | Yes | Yes — must be in scope |
| Run `npm run build` | Yes | No — any time for verification |
| Run `npm run lint` | Yes | No — any time for verification |
| Run `npm run test` | Yes | No — any time for verification |
| Run `npx prisma generate` | Yes | Yes — after schema changes only |
| Run `npx prisma validate` | Yes | No |
| Run `npx prisma migrate status` | Yes | No |
| Run `npx prisma migrate resolve` | Yes | Yes — explicit instruction |
| Run `npx prisma db pull` | **NEVER** | **NEVER (requires approval)** |
| Run `npx prisma migrate deploy` | **No** | **Never** |
| Commit | No | Yes — explicit "commit" instruction |
| Push | No | Yes — explicit "push" instruction |
| Force push | **Never** | **Never** |
| Create a git tag | No | Yes — explicit instruction |
| Modify `prisma/schema.prisma` | No | Yes — explicit instruction + migration plan |
| Add npm dependency | No | Yes — explicit instruction |
| Modify `CLAUDE.md` | No | Yes — explicit architect instruction |
| Modify FEOS documents | No | Yes — explicit architect instruction |

---

## Implementation Contract

When an AI agent implements a sprint task, it commits to:

1. **Scope compliance:** Only files in the approved scope are created or modified.
2. **Architecture compliance:** All new code follows FEOS-03 layer ordering.
3. **Gate compliance:** `npm run build`, `npm run lint`, `npm run test` all pass before declaring work complete.
4. **Documentation completeness:** All new endpoints have Swagger annotations. All new architectural decisions have ADRs.
5. **Test completeness:** All new use cases have unit tests.
6. **Typing correctness:** No `any` in production code without explicit justification. No `cb: any` in mocks.

---

## Review Contract

When an AI agent reviews code:

1. Check layer ordering (FEOS-03).
2. Check for forbidden patterns (FEOS-03, FEOS-07).
3. Check test coverage and mock typing (FEOS-08).
4. Check Swagger annotations (FEOS-07).
5. Check BigInt handling (FEOS-06).
6. Check for `this.logger.log()` (FEOS-07).
7. Check for `console.log()` (FEOS-07).
8. Check that global modules are not re-imported (FEOS-03).

---

## Validation Contract

When an AI agent validates a sprint:

1. Confirm `npm run build` exits 0 — report the output.
2. Confirm `npm run lint` exits 0 — report the output.
3. Confirm `npm run test` exits 0 — report the test count and status.
4. Confirm all planned use cases are implemented.
5. Confirm all planned endpoints are wired in the controller.
6. Confirm the spec file exists and all use cases have tests.
7. Confirm no files outside scope were modified.

---

## Recovery Contract

When an AI agent encounters a failure:

### Build Failure
1. Report the TypeScript error(s) exactly.
2. Identify the file and line.
3. Fix the root cause (not a symptom).
4. Re-run `npm run build`.
5. Do not suppress TypeScript errors with `@ts-ignore` or `as any`.

### Lint Failure
1. Report the ESLint error(s) exactly.
2. Fix without suppressing with `// eslint-disable`.
3. Known acceptable lint suppression: none in FEOS 1.0.
4. Re-run `npm run lint`.

### Test Failure
1. Report the failing test name and error.
2. Identify whether the code or the test is wrong.
3. Fix the root cause.
4. Re-run `npm run test`.
5. Do not delete the failing test.

### Schema Drift
If `prisma/schema.prisma` is accidentally overwritten:
```bash
git checkout HEAD -- prisma/schema.prisma
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
npm run build
```

---

## Escalation Rules

AI agents must escalate (stop work and report) when:

1. A required file to modify is outside the approved sprint scope.
2. A required database model does not exist in `prisma/schema.prisma`.
3. Implementing a feature would require a schema migration not approved in this sprint.
4. A gate failure cannot be resolved without modifying out-of-scope files.
5. Any of the Absolute Prohibitions above would need to be violated to proceed.
6. An FEOS rule cannot be followed given the current codebase state.

---

## Session Initialization Checklist

At the start of every AI session working on FactoryERP:

- [ ] Read FEOS-12 (this document).
- [ ] Read FEOS-01 (Engineering Constitution).
- [ ] Read KEB-13 (AI Execution Rules).
- [ ] Read KEB-02 or KEB-07 for module context.
- [ ] Verify the approved sprint scope.
- [ ] Verify prerequisites are complete.
- [ ] Confirm the three quality gates were passing at the start of the session.
