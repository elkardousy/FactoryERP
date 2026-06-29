# 01 — Engineering Constitution

**Document:** FEOS-01  
**Category:** Governance  
**Authority:** MANDATORY — applies to all contributors without exception  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per major phase completion  
**Related FEOS:** FEOS-02 (Project Governance), FEOS-03 (Architecture Governance)  
**Related KEB:** KEB-01 (Technology Stack), KEB-20 (Engineering Baseline)

---

## Purpose

This document establishes the fundamental engineering principles, values, and non-negotiable rules that govern all work on FactoryERP. The Engineering Constitution is the highest normative document within FEOS. All other FEOS documents derive their authority from this constitution.

## Scope

All human engineers, AI agents, automated systems, and tooling that interact with the FactoryERP codebase, database, schema, documentation, or CI/CD infrastructure.

## Audience

All contributors. This document must be read in full before any engineering work begins.

---

## Article I — Core Principles

### Principle 1: Correctness Before Velocity

A feature that is incomplete but correct is preferable to a feature that is complete but wrong. Build state, lint state, and test state must be verified before any sprint is declared complete. No exceptions are granted on behalf of delivery speed.

### Principle 2: Explicit Over Implicit

Every engineering constraint, every prohibition, every exception to a rule must be written down. An undocumented constraint does not exist and cannot be enforced. Engineers must not rely on oral tradition, session memory, or assumed knowledge.

### Principle 3: Layer Discipline Is Absolute

The Clean Architecture layer ordering — Controllers → Use Cases → Services → Repositories → PrismaService — is not a guideline. It is the enforced structure of this codebase. Violations are blocking review findings. A pull request that violates layer ordering is not merged.

### Principle 4: Schema Is Sovereign

`prisma/schema.prisma` and the PostgreSQL `factory` schema are the authoritative record of the FactoryERP data model. They are not modified casually. Every schema change follows the documented migration workflow. `prisma db pull` is explicitly prohibited.

### Principle 5: Documentation Is an Engineering Deliverable

Architecture Decision Records (ADRs), sprint reports, governance documents, and knowledge baselines are engineering deliverables with the same standing as code. They are required for sprint acceptance. A sprint whose code is complete but whose documentation is absent is not a complete sprint.

### Principle 6: The Repository Compiles, Passes Lint, and Passes Tests at Every Merge

The main branch must never be left in a broken state. A commit that breaks the build, introduces lint errors, or causes test failures is a severity-1 defect that is resolved before any other work proceeds.

### Principle 7: Security Is Not Optional

Authentication, authorization, secrets management, and audit logging are mandatory infrastructure. They are not deferred to future sprints. No endpoint exposes data without JWT authentication and role/screen permission checks, unless explicitly documented as a deliberate exception.

---

## Article II — Definition of Ready

A sprint or task is **Ready** when all of the following conditions are met:

1. The business requirement is stated in terms the engineering team can verify.
2. All prerequisite modules, schema models, and services it depends on are complete and committed.
3. The schema models it will operate on are defined in `prisma/schema.prisma` and migrated to the database.
4. All blocking KEB knowledge gaps relevant to the feature have been identified and documented.
5. The test approach has been determined (unit, integration, acceptance).

---

## Article III — Definition of Done

A feature or task is **Done** when all of the following conditions are met:

1. All planned use cases are implemented and committed.
2. `npm run build` exits with code 0.
3. `npm run lint` exits with code 0 (0 ESLint errors).
4. `npm run test` exits with code 0 (all tests pass, no regressions).
5. All new use cases have unit test coverage.
6. All new API endpoints are documented in the Swagger configuration.
7. All new architectural decisions are recorded as ADRs in `docs/architecture/adr/`.
8. The KEB document relevant to the modified module has been updated or noted as requiring update.

---

## Article IV — Definition of Complete

A sprint is **Complete** when all of the following conditions are met:

1. All features in scope are Done (per Article III).
2. The sprint report is written and committed.
3. Any new RISK REGISTER entries have been documented in KEB-11.
4. Any new ADRs are committed.
5. The git tag for the sprint is created.
6. No open blocking defects exist.

---

## Article V — Architecture Freeze Policy

The core architectural decisions for FactoryERP were made in Phase 1–3 and are documented in ADR-001 through ADR-026. These decisions are **frozen**. They cannot be reversed or circumvented without:

1. A new ADR documenting the rationale for change.
2. Architect review and explicit approval.
3. A migration plan if the change affects schema, module structure, or layer ordering.

**Frozen decisions include (non-exhaustive):**
- NestJS 11 as the framework
- Prisma 6 as the ORM
- PostgreSQL as the database
- Clean Architecture layer ordering
- `factory` PostgreSQL schema name
- BigInt primary keys
- JWT authentication (15m/7d)
- Role + screen permission authorization
- Unified response envelope
- URI versioning at `/v1/`
- Global modules: PrismaModule, LoggerModule, AuditModule, DocumentNumberingModule

---

## Article VI — Decision Hierarchy

When a conflict exists between engineering guidance sources, the following precedence applies (highest to lowest):

1. **This Constitution (FEOS-01)** — non-negotiable
2. **FEOS documents** — FEOS-02 through FEOS-20
3. **CLAUDE.md** — project-level AI execution rules
4. **ADRs** — specific, documented architectural decisions
5. **KEB documents** — verified engineering facts
6. **Code conventions** — patterns observed in existing code
7. **AI agent judgment** — lowest precedence, always deferring to documented rules

---

## Article VII — Engineering Ethics

### What Engineers Must Do

- Document the true state of the codebase — not the desired state.
- Report risks honestly, even if they are blockers.
- Raise blocking issues before they become defects.
- Refuse to commit code that is known to be incorrect.

### What Engineers Must Not Do

- Commit code that bypasses authentication or authorization checks without documented approval.
- Skip lint or test steps to "save time."
- Leave the main branch in a broken state.
- Suppress errors without understanding and documenting the root cause.
- Add dead code, placeholder implementations, or `TODO` comments without a linked issue.

---

## Compliance

### Rule C-001 — Build Gate

**Classification:** MANDATORY  
**Statement:** No sprint is accepted if `npm run build` exits with a non-zero code.  
**Violation Impact:** Sprint failure. No merges proceed until resolved.  
**Risk:** Data loss, runtime errors, broken deployments.  
**Recovery:** See FEOS-15, Section: Build Failure Recovery.  
**Approval Required:** None — build must pass.

### Rule C-002 — Lint Gate

**Classification:** MANDATORY  
**Statement:** No sprint is accepted if `npm run lint` exits with a non-zero code or reports 1 or more errors.  
**Violation Impact:** Sprint failure.  
**Risk:** Code quality regression, type unsafety.  
**Recovery:** Fix all reported errors. ESLint auto-fix is permitted (`npm run lint`).  
**Approval Required:** None — lint must pass.

### Rule C-003 — Test Gate

**Classification:** MANDATORY  
**Statement:** No sprint is accepted if `npm run test` exits with a non-zero code or reports 1 or more test failures.  
**Violation Impact:** Sprint failure.  
**Risk:** Undetected regressions.  
**Recovery:** Fix the failing tests or the code that broke them. Do not delete tests to make them pass.  
**Approval Required:** None — tests must pass.

### Rule C-004 — Layer Ordering

**Classification:** MANDATORY  
**Statement:** The sequence Controllers → Use Cases → Services → Repositories → PrismaService must be respected. No layer may import from a layer below its immediate subordinate's subordinates.  
**Violation Impact:** Architecture violation. Blocking review finding.  
**Risk:** Circular dependencies, untestable code, maintenance burden.  
**Recovery:** Refactor the violating layer. Do not add exceptions.  
**Approval Required:** Architect sign-off on any claimed exception.

### Rule C-005 — ADR Requirement

**Classification:** MANDATORY  
**Statement:** Every architectural decision that is non-obvious, non-reversible, or cross-cutting must be recorded as an ADR before the sprint is accepted.  
**Violation Impact:** Sprint is not marked Complete.  
**Risk:** Lost institutional knowledge, future engineers repeating past mistakes.  
**Recovery:** Write and commit the ADR.  
**Approval Required:** None — ADR authorship is the engineer's responsibility.

### Rule C-006 — Single Main Branch

**Classification:** MANDATORY  
**Statement:** The `main` branch is the only long-lived branch. All work merges directly to `main`. Force pushes to `main` are prohibited.  
**Violation Impact:** History corruption, lost work.  
**Risk:** Irreversible data loss.  
**Recovery:** Restore from last known-good commit. Escalate immediately.  
**Approval Required:** Architect approval for any destructive git operation on main.

---

## Exceptions

No exceptions to Articles I–VI are permitted without written architect approval and a corresponding ADR. Exceptions granted for one sprint do not carry forward to subsequent sprints.

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-06-29 | Initial FEOS constitution |
