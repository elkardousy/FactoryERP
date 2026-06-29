# 04 — Implementation Governance

**Document:** FEOS-04  
**Category:** Process  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-03 (Architecture Governance), FEOS-07 (Code Governance), FEOS-08 (Test Governance), FEOS-11 (Module Governance)  
**Related KEB:** KEB-07 (Module Status), KEB-08 (Implementation Status), KEB-03 (Business Knowledge)

---

## Purpose

This document defines the lifecycle for all implementation work in FactoryERP: how features move from definition to acceptance, how sprints are executed, what the mandatory workflow steps are, and how regressions are handled.

## Scope

All feature implementation, bug fixes, use case development, repository extensions, and API endpoint additions.

## Audience

Engineers and AI agents executing implementation tasks.

---

## Sprint Lifecycle

```
Define → Ready? → Implement → Gate Check → Review → Accept → Close
                                    ↓
                               (fail) → Fix → Gate Check
```

### Phase 1 — Define

Before execution begins, the following must be established:

1. **Scope statement:** Named list of use cases, endpoints, models, and modules to be created or modified.
2. **Prerequisite verification:** All modules and schema models this sprint depends on are confirmed complete (via KEB-07).
3. **Risk identification:** Any known risks (from KEB-11) relevant to this sprint are acknowledged.
4. **Test approach:** What will be unit-tested and at what level.

### Phase 2 — Ready Check (Definition of Ready)

Per FEOS-01, Article II. Sprint does not start until all Ready conditions are verified.

### Phase 3 — Implement

Implementation follows the module structure in FEOS-11 and the coding standards in FEOS-07. All implementation work proceeds in this order:

1. **Schema verification** — confirm all required Prisma models are available in `prisma/schema.prisma`.
2. **Repository layer** — implement or extend repositories.
3. **Service layer** — implement validators, mappers, factories.
4. **Use case layer** — implement command and query use cases.
5. **Controller layer** — wire endpoints to use cases.
6. **DTOs** — implement request and response DTOs with class-validator decorators.
7. **Tests** — write unit tests for all use cases.
8. **Documentation** — write ADRs for any architectural decisions made.

### Phase 4 — Gate Check

Run all three quality gates after implementation:

```bash
npm run build       # must exit 0
npm run lint        # must exit 0
npm run test        # must exit 0
```

All three must pass. A gate failure stops the sprint. The failing gate is fixed and the check is repeated.

### Phase 5 — Review

Review covers:

- **Architecture compliance** — layer ordering respected, no forbidden patterns.
- **Code quality** — naming conventions, no dead code, no suppressed errors.
- **Test completeness** — all use cases covered, mocks correct.
- **Documentation completeness** — ADRs written, Swagger annotations present.
- **API correctness** — DTOs match schema, HTTP codes correct, versioning applied.

### Phase 6 — Accept

Sprint is accepted when:

- All gates pass.
- All review criteria met.
- Sprint report written.
- Git tag created.
- KEB updated.

### Phase 7 — Close

Sprint is committed to `main`. No further changes to sprint scope are accepted after Close.

---

## Feature Implementation Workflow

### New Module

When a new business domain module is implemented:

1. Verify prerequisites in KEB-07 (Module Status).
2. Follow the module template in FEOS-11.
3. Register the module in `AppModule`.
4. Add all use cases, services, repositories following the inventory module pattern.
5. Create controller following the existing controller pattern.
6. Verify no global module is imported (PrismaModule, LoggerModule, etc.).
7. Run build, lint, test gates.
8. Write ADR if any non-obvious design choices were made.
9. Update KEB-07 (Module Status) after completion.

### New Use Case

When a new use case is added to an existing module:

1. Create directory: `src/modules/<domain>/use-cases/<feature>/<command|query>/`.
2. Implement the use case class with an `execute()` method.
3. Create the corresponding DTO(s) in `src/modules/<domain>/use-cases/<feature>/dto/` or module-level `dto/`.
4. Register in the module's `providers` array.
5. Wire to a controller endpoint.
6. Write a unit test.
7. Add Swagger annotation to the endpoint.

### New Repository Method

When a new repository query method is needed:

1. Add the method to the repository class (in `src/modules/<domain>/repositories/`).
2. Implement using `this.db` (alias for `this.prisma`).
3. For composite PK tables: use `findFirst()`, not `findUnique()`.
4. For atomic multi-record operations: use `this.executeInTransaction()`.
5. The callback receives `tx as PrismaService` — treat it as `Prisma.TransactionClient` inside.
6. Update relevant tests if the mock needs extending.

---

## Bug Fix Workflow

1. Identify the failing test or behavior.
2. Identify the root cause (which layer, which file, which line).
3. Fix the root cause — not a symptom.
4. Run all three gates.
5. Verify the test that was failing now passes.
6. Verify no other tests regressed.
7. If the bug reveals an undocumented risk, add it to KEB-11.

Do not fix bugs by:
- Deleting the failing test.
- Catching and suppressing the error.
- Adding `// @ts-ignore` or `as any` casts.
- Bypassing the layer that contains the bug.

---

## Inventory Module as Reference Implementation

The Inventory module at `src/modules/inventory/` is the canonical reference implementation. When implementing any new module, the Inventory module structure, patterns, and conventions take precedence over any generic NestJS patterns.

Specifically, the Inventory module demonstrates:

- CQRS separation (commands in `/use-cases/<feature>/<verb>-<noun>.use-case.ts`, queries in same structure).
- Mapper, Factory, Validator service pattern.
- `executeInTransaction()` for atomic multi-record writes (TRANSFER operation).
- Repository naming conventions.
- BigInt serialization via `serializeBigInts()` in response DTOs.
- `findFirst()` instead of `findUnique()` for composite PK queries.
- DTO design with `@ApiProperty()` and `class-validator` decorators.
- Mock patterns in spec files (typed callback, no `cb: any`).

---

## Regression Policy

A regression is any test that was passing at the previous commit and fails after the current change.

Regressions are not acceptable at sprint closure. If a change causes a regression:

1. Identify the regression (which test, which module).
2. Identify why the change caused it (coupling, shared service, changed interface).
3. Fix the regression in the same sprint.
4. If fixing the regression requires changes outside the sprint scope, escalate to architect.

Regressions are never masked by updating the test to match the broken behavior.

---

## Rollback Policy

If an implementation is accepted and later found to be incorrect:

1. A new commit reverts the incorrect change (do not amend or force-push main).
2. A bug report is opened.
3. A new sprint or hot-fix scope is defined for the correct implementation.

Do not use `git reset --hard`, `git rebase`, or force push to hide incorrect commits on main.

---

## Compliance Rules

### Rule I-001 — Gate Sequence

**Classification:** MANDATORY  
**Statement:** All three gates (build, lint, test) must pass before a sprint is accepted. They must be run in sequence: build → lint → test. A failure at any gate stops progression.  
**Violation Impact:** Sprint not accepted.  
**Risk:** Broken main branch, undetected regressions.  
**Recovery:** Fix the failing gate. Rerun all three.  
**Approval Required:** None — gates are automated.

### Rule I-002 — Implement in Layer Order

**Classification:** MANDATORY  
**Statement:** During implementation, proceed from the innermost layer outward: repository → service → use case → controller. Do not implement the controller before the use case exists.  
**Violation Impact:** Incomplete wiring, runtime DI errors.  
**Risk:** Startup failures, untestable code.  
**Recovery:** Complete the inner layer before wiring the outer.  
**Approval Required:** None.

### Rule I-003 — No Silent Error Suppression

**Classification:** MANDATORY  
**Statement:** Errors must be thrown, not silently caught and discarded. Catch blocks must either re-throw, transform to an appropriate HTTP exception, or log and re-throw.  
**Violation Impact:** Silent data corruption, unmaintainable error handling.  
**Risk:** Data loss, undetected failures.  
**Recovery:** Refactor catch block to throw appropriately.  
**Approval Required:** None.

### Rule I-004 — Use Case Test Coverage

**Classification:** MANDATORY  
**Statement:** Every use case must have at least one unit test covering the happy path and one covering the primary failure path.  
**Violation Impact:** Sprint not accepted.  
**Risk:** Regressions not caught.  
**Recovery:** Write the missing tests.  
**Approval Required:** None.

### Rule I-005 — No Out-of-Scope Modifications

**Classification:** MANDATORY  
**Statement:** Files outside the approved sprint scope must not be modified unless a regression in those files was caused by the sprint's changes.  
**Violation Impact:** Governance violation, potential revert.  
**Risk:** Unreviewed changes in unrelated modules.  
**Recovery:** Revert out-of-scope modifications. Create separate sprint for those changes.  
**Approval Required:** Architect approval to modify files outside sprint scope.
