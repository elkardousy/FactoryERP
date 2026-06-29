# 02 — Project Governance

**Document:** FEOS-02  
**Category:** Governance  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-01 (Constitution), FEOS-04 (Implementation Governance), FEOS-10 (Git Governance)  
**Related KEB:** KEB-12 (Git Baseline), KEB-14 (Project Timeline)

---

## Purpose

This document defines the governance model for the FactoryERP project: who holds engineering authority, how decisions are made, how ownership is assigned, and how conflicts and escalations are resolved.

## Scope

All engineering decisions, sprint approvals, architectural changes, release approvals, and conflict resolutions for the FactoryERP codebase.

## Audience

All contributors — human engineers, AI agents, and automated systems.

---

## Governance Model

FactoryERP is a single-owner, architect-led engineering project. At the time of FEOS 1.0, the project has one human engineer acting as sole contributor. The governance structure is designed to scale when additional contributors are added.

### Roles and Authority

| Role | Authority | Decision Rights |
|------|-----------|----------------|
| Chief Software Architect | Highest engineering authority | Architectural decisions, FEOS amendments, schema changes, release approvals |
| Principal Engineer | Implementation authority | Sprint scoping, code review, module design |
| AI Agent (Claude Code) | Execution authority | Implementation within approved sprint scope |
| Automated Systems | None | CI/CD verification only, no approval rights |

At FEOS 1.0 baseline, the roles of Chief Software Architect and Principal Engineer are held by the same human (elkardousy). AI agents operate under execution authority only.

---

## Engineering Authority

### What Requires Architect Approval

The following actions require explicit approval from the Chief Software Architect before execution:

1. Modifying `prisma/schema.prisma` outside a planned sprint.
2. Executing any DDL against the PostgreSQL database.
3. Amending or overriding a frozen architectural decision (see FEOS-01, Article V).
4. Creating a new NestJS module not in the approved roadmap.
5. Adding a new npm dependency to `package.json`.
6. Force-pushing to the `main` branch.
7. Amending a published commit.
8. Modifying `CLAUDE.md` or any FEOS document.
9. Changing the global filter registration order in `main.ts`.
10. Running `prisma db pull` (requires approval AND documented rationale).

### What Engineers May Do Without Approval

Within an approved sprint scope:

- Implement use cases, services, repositories, controllers.
- Write tests for planned features.
- Fix lint errors.
- Fix failing tests.
- Write ADRs for decisions made within the sprint.
- Update KEB documents to reflect changes.
- Read any file in the repository.

---

## Sprint Governance

### Sprint Approval

A sprint is approved when:

1. The scope is defined (list of features, use cases, endpoints, models affected).
2. Prerequisites are verified as complete (per KEB-07, KEB-08).
3. The sprint is explicitly initiated by the architect/principal engineer.

AI agents do not self-approve sprints. An AI agent operates within the scope of the current session's explicit instructions only.

### Sprint Scope Boundary

An AI agent executing a sprint must not:

- Implement features beyond the explicitly approved scope.
- Modify modules outside the sprint's stated scope.
- Add dependencies not in the approved sprint plan.
- Create commits not requested by the principal engineer.

Scope creep by an AI agent is a governance violation and the output must be reverted.

### Sprint Completion Approval

A sprint is declared Complete (per FEOS-01, Article IV) by the principal engineer after verifying all gates pass. AI agents do not self-declare completion.

---

## Decision Process

### Architectural Decision

1. Engineer identifies the need for a non-obvious or non-reversible decision.
2. Engineer writes an ADR (docs/architecture/adr/) with context, options, decision, and consequences.
3. ADR is committed with the implementing code.
4. ADR number follows the sequence (current highest: ADR-026).

### Schema Change Decision

1. Engineer identifies required schema change.
2. Write migration SQL to `prisma/migrations/<timestamp>_<name>/migration.sql`.
3. Execute migration as postgres superuser (see FEOS-05, FEOS-06).
4. Execute `prisma migrate resolve --applied`.
5. Execute `prisma generate`.
6. Update `prisma/schema.prisma` to reflect the change.
7. Write or update affected KEB document.

### Dependency Addition Decision

1. Engineer identifies a needed npm package.
2. Verify no existing package satisfies the need.
3. Verify the package is actively maintained and has no critical CVEs.
4. Add to `package.json`.
5. Update KEB-01 (Technology Stack).
6. Write ADR if the dependency is architecturally significant.

---

## Ownership Model

| Artifact | Owner | Reviewer |
|----------|-------|----------|
| `prisma/schema.prisma` | Chief Software Architect | — |
| `prisma/migrations/` | Chief Software Architect | — |
| `src/core/` | Chief Software Architect | Principal Engineer |
| `src/modules/auth/` | Principal Engineer | Architect |
| `src/modules/authorization/` | Principal Engineer | Architect |
| `src/modules/inventory/` | Principal Engineer | Architect |
| `src/modules/<domain>/` | Principal Engineer | Architect |
| `docs/architecture/adr/` | Principal Engineer | Architect |
| `docs/feos/` | Chief Software Architect | — |
| `docs/knowledge/` | AI Agent (under architect direction) | Principal Engineer |
| `CLAUDE.md` | Chief Software Architect | — |

---

## Escalation

### When to Escalate

An engineer or AI agent must escalate and stop work when:

1. A required action falls outside the approved sprint scope.
2. Executing a task would violate an FEOS rule.
3. A prerequisite module, model, or service is found to be incomplete or broken.
4. A blocking risk not previously documented is discovered.
5. A required action would require `prisma db pull` or DDL without the migration workflow.

### Escalation Protocol

1. Stop the current task.
2. Report the blocking condition in clear terms: what was being done, what was discovered, what is blocked.
3. Await explicit instruction before proceeding.

AI agents do not self-resolve escalations. The human engineer resolves escalations.

---

## Project Phases and Roadmap Authority

The FactoryERP project roadmap is defined in KEB-14 (Project Timeline). The roadmap is owned by the Chief Software Architect. The following phase structure is the approved roadmap as of FEOS 1.0:

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 0 | Database schema (all 98 models) | COMPLETE |
| Phase 1 | NestJS platform foundation | COMPLETE |
| Phase 2 | Auth, Authorization, Master Data | COMPLETE |
| Phase 3 | Schema hardening, Sprint 0 gates | COMPLETE |
| Sprint 11 | Inventory Engine | 11.1-11.3 COMPLETE |
| Sprint 12 | Container Receiving Engine | PLANNED |
| Sprint 13 | Production Orders Engine | PLANNED |
| Sprint 14 | WIP Tracking Engine | PLANNED |
| Sprint 15 | Packing / Finished Goods Engine | PLANNED |
| Sprint 16+ | CMO, Shipping, HR, Machines, OEE | PLANNED |

No sprint may be initiated without architect approval of its scope and readiness criteria.

---

## Compliance Rules

### Rule G-001 — Scope Boundary

**Classification:** MANDATORY  
**Statement:** All work must be within the explicitly approved sprint scope. Work outside scope requires architect approval before execution.  
**Violation Impact:** Work product may be reverted.  
**Risk:** Unplanned scope causes regressions and unreviewed changes.  
**Recovery:** Revert out-of-scope changes. Reopen scope discussion.  
**Approval Required:** Chief Software Architect.

### Rule G-002 — ADR Completeness

**Classification:** MANDATORY  
**Statement:** All architectural decisions made during a sprint must have a corresponding ADR committed by sprint completion.  
**Violation Impact:** Sprint is not marked Complete.  
**Risk:** Lost rationale, repeated debates, inconsistent future decisions.  
**Recovery:** Write and commit the missing ADR.  
**Approval Required:** None — ADR is the engineer's responsibility.

### Rule G-003 — Dependency Transparency

**Classification:** MANDATORY  
**Statement:** No new npm dependency may be added without updating KEB-01 and, if architecturally significant, writing an ADR.  
**Violation Impact:** Audit finding.  
**Risk:** Untracked dependencies introduce supply chain risk.  
**Recovery:** Update KEB-01. Write ADR if applicable.  
**Approval Required:** Principal Engineer.

### Rule G-004 — AI Self-Approval Prohibition

**Classification:** MANDATORY  
**Statement:** AI agents may not self-approve sprint scope, declare sprint completion, or approve their own architectural decisions.  
**Violation Impact:** AI output may not be accepted.  
**Risk:** Uncontrolled scope expansion, unapproved changes.  
**Recovery:** Human engineer reviews and approves or reverts AI output.  
**Approval Required:** Chief Software Architect or Principal Engineer.

---

## Exceptions

No governance exceptions are self-granted. Any exception to rules in this document requires architect approval and a written record.
