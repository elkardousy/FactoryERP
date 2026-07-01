# PLATFORM MASTER IMPLEMENTATION CONTRACT
# FactoryERP — Phase 4.5 — Cross-Platform Development Environment
# Part 1 of 3: Governance & Execution Authority
# Version 1.0

---

## Part Index

| Part | Title | Status |
|---|---|---|
| Part 1 | Governance & Execution Authority | COMPLETE |
| Part 2 | Feature Execution Contracts (F02–F10) | PENDING |
| Part 3 | Closure & Transition Protocol | PENDING |

---

# Part 1 — Governance & Execution Authority

---

## Section 1: Document Identity

### 1.1 Purpose

The Platform Master Implementation Contract (PMIC) is the supreme governing document for the execution of Phase 4.5 — Cross-Platform Development Environment. It binds all implementation work to the approved Infrastructure Execution Framework (IEF), defines execution authority, establishes stop conditions and recovery workflows, and governs engineering decisions made during implementation.

This document does not specify implementation details for individual features. Feature-level contracts reside in the IEF specification documents (`03`–`07`) and individual feature reports (`reports/FXX_REPORT.md`). The PMIC governs the process that surrounds all feature work.

### 1.2 Mission

Deliver a reproducible, cross-platform development environment for FactoryERP that:

- Eliminates developer machine variance across Windows 11, Ubuntu 24 LTS, and macOS 14
- Establishes automated quality gate enforcement via CI/CD
- Standardizes toolchain versions and developer workflows
- Documents all infrastructure decisions with traceability to the IEF and FEOS

All of this is accomplished without modifying application source code, database schema, test suites, or any other component of the existing FactoryERP system.

### 1.3 Scope

**In scope — Phase 4.5:**

All ten infrastructure features defined in the IEF Master Execution Contract (`00_PLATFORM_MASTER_EXECUTION_CONTRACT.md`):

| Feature | Description |
|---|---|
| F01 | Node Version Pinning |
| F02 | Repository Hygiene |
| F03 | Environment Standardization |
| F04 | Docker Development Environment |
| F05 | Bootstrap Scripts |
| F06 | DevContainer |
| F07 | CI Pipeline |
| F08 | Cross-Platform Validation |
| F09 | Developer Documentation |
| F10 | Platform Final Validation |

**Out of scope — permanently:**

- Application source code (`src/`)
- Prisma schema (`prisma/schema.prisma`)
- SQL migrations (`prisma/migrations/`)
- Test suites (`src/**/*.spec.ts`, `test/`)
- FEOS documents (`docs/feos/`)
- Knowledge Baseline (`docs/knowledge/`)
- Production module behavior
- Inventory module behavior
- Database schema design

### 1.4 Audience

| Role | Usage |
|---|---|
| Chief Software Architect | Authority validation; stop condition adjudication; engineering decision approval |
| Chief Platform Engineer | Feature execution; quality gate certification; recovery execution |
| Principal DevOps Engineer | CI/CD and Docker feature implementation |
| QA Director | Quality gate verification; acceptance criteria sign-off |
| Technical Program Manager | Progress tracking; feature transition authorization |
| Engineering Governance Lead | FEOS compliance; KEB compliance; decision traceability |

### 1.5 Authority

This document derives its authority from:

1. FEOS `01_ENGINEERING_CONSTITUTION.md` — supreme engineering authority
2. FEOS `04_IMPLEMENTATION_GOVERNANCE.md` — implementation conduct rules
3. FEOS `10_GIT_GOVERNANCE.md` — commit and branch governance
4. IEF `00_PLATFORM_MASTER_EXECUTION_CONTRACT.md` — Phase 4.5 feature scope

No provision of this document may contradict any FEOS document. In the event of conflict, FEOS prevails and the conflict is immediately escalated as a stop condition.

### 1.6 Dependencies

| Dependency | Type | State |
|---|---|---|
| FEOS (`docs/feos/`) | Authority | COMPLETE |
| Knowledge Baseline (`docs/knowledge/`) | Reference | COMPLETE |
| Infrastructure Execution Framework (`docs/execution/platform/00–10`) | Specification | COMPLETE |
| Repository at commit `db9881a` | Implementation baseline | CLEAN |
| F01 completion (`.nvmrc`, `package.json` engines) | Feature prerequisite | COMPLETE |

### 1.7 Document Ownership

**Primary owner:** Chief Software Architect  
**Contributing owner:** Chief Platform Engineer  
**Reviewer:** Engineering Governance Lead, QA Director  
**Update trigger:** Start of each Part; any stop condition that modifies governance scope

### 1.8 Review Cycle

- Part 1 reviewed at Phase 4.5 start (this document)
- Part 2 reviewed before F02 begins
- Part 3 reviewed after F10 completes
- Each part review confirms no FEOS conflicts have emerged

### 1.9 Version

| Version | Change | Date |
|---|---|---|
| 1.0 | Part 1 authored — governance and execution authority | 2026-07-01 |

---

## Section 2: Current Repository State

### 2.1 Completed Phases

| Phase | Name | Status | Commit |
|---|---|---|---|
| Phase 0 | Database Foundation (SQL scripts) | COMPLETE | Pre-Prisma |
| Phase 1 | Project Foundation | COMPLETE | Multiple |
| Phase 2 | Authentication & Authorization | COMPLETE | Multiple |
| Phase 3 | Transaction & Execution Engine | COMPLETE | `5a5e3d6` |
| Phase 4 | Production Execution Engine (P01–P11) | COMPLETE | `1ad61b6` |
| MMCC | Production Module Official Closure | COMPLETE | `d8b5b4b` |
| IEF | Infrastructure Execution Framework | COMPLETE | `42982a7` |
| Phase 4.5 F01 | Node Version Pinning | COMPLETE | `fd04f2a` |

### 2.2 Completed Modules

| Module | Type | Status |
|---|---|---|
| `auth` | Business | COMPLETE |
| `authorization` | Business | COMPLETE |
| `customers` | Business | COMPLETE |
| `garment-models` | Business | COMPLETE |
| `measurements` | Business | COMPLETE |
| `organization` | Business | COMPLETE |
| `production-setup` | Business | COMPLETE |
| `suppliers` | Business | COMPLETE |
| `warehouses` | Business | COMPLETE |
| `inventory` | Business | COMPLETE |
| `production` (P01–P11) | Business | COMPLETE |
| `warehouse-locations` | Business | COMPLETE |
| PrismaModule | Infrastructure | COMPLETE |
| LoggerModule | Infrastructure | COMPLETE |
| AuditModule | Infrastructure | COMPLETE |
| DocumentNumberingModule | Infrastructure | COMPLETE |
| ConfigModule | Infrastructure | COMPLETE |

### 2.3 Current Infrastructure State

| Infrastructure Component | State | Gap |
|---|---|---|
| `.nvmrc` | PRESENT — `24.16.0` | None (F01 COMPLETE) |
| `package.json` engines | PRESENT — `>=24.0.0 <25.0.0` | None (F01 COMPLETE) |
| `.gitattributes` | ABSENT | F02 target |
| `.editorconfig` | ABSENT | F02 target |
| `.env.example` | ABSENT | F03 target |
| `docker-compose.dev.yml` | ABSENT | F04 target |
| `scripts/` | ABSENT | F05 target |
| `.devcontainer/` | ABSENT | F06 target |
| `.github/workflows/` | ABSENT | F07 target |
| `.vscode/` | ABSENT | F09 target |
| Cross-platform CI validation | ABSENT | F07/F08 target |
| `README.md` onboarding section | ABSENT | F09 target |

### 2.4 Current Repository Health

| Gate | State | Last Run |
|---|---|---|
| `npm run build` | PASS | 2026-07-01 (F01 commit) |
| `npm run lint` | PASS — 0 errors | 2026-07-01 (F01 commit) |
| `npm run test` | PASS — 482/482 | 2026-07-01 (F01 commit) |
| `npx prisma validate` | PASS | 2026-07-01 (F01 commit) |
| Git status | CLEAN | 2026-07-01 |
| Uncommitted changes | NONE | — |

### 2.5 Current Implementation Progress

| Feature | Status | Commit | Date |
|---|---|---|---|
| F01 — Node Version Pinning | DONE | `fd04f2a` | 2026-07-01 |
| F02 — Repository Hygiene | PENDING | — | — |
| F03 — Environment Standardization | PENDING | — | — |
| F04 — Docker Development Environment | PENDING | — | — |
| F05 — Bootstrap Scripts | PENDING | — | — |
| F06 — DevContainer | PENDING | — | — |
| F07 — CI Pipeline | PENDING | — | — |
| F08 — Cross-Platform Validation | PENDING | — | — |
| F09 — Developer Documentation | PENDING | — | — |
| F10 — Platform Final Validation | PENDING | — | — |

### 2.6 Remaining Work Summary

9 of 10 infrastructure features remain. No source code, schema, test, or FEOS modifications are required to complete Phase 4.5. All remaining features produce configuration files, infrastructure definitions, and documentation only.

---

## Section 3: Authority Hierarchy

### 3.1 Authority Order

When any conflict arises between documents, systems, or engineering judgments, the following hierarchy governs resolution. Lower-priority items yield to higher-priority items unconditionally.

| Priority | Authority | Location | Override Rights |
|---|---|---|---|
| 1 | FEOS | `docs/feos/` | Overrides ALL |
| 2 | Knowledge Baseline (KEB) | `docs/knowledge/` | Overrides 3–6 |
| 3 | Infrastructure Execution Framework (IEF) | `docs/execution/platform/00–10` | Overrides 4–6 |
| 4 | This Contract (PMIC) | `docs/execution/platform/PLATFORM_MASTER_IMPLEMENTATION_CONTRACT.md` | Overrides 5–6 |
| 5 | Repository state | All committed files | Overrides 6 |
| 6 | Engineering Decisions | `ENGINEERING_DECISION_REPORT_FXX.md` | Governs implementation only |

### 3.2 FEOS Authority

FEOS documents are the supreme authority. No Phase 4.5 implementation may:

- Contradict any engineering rule in FEOS `01_ENGINEERING_CONSTITUTION.md`
- Bypass code governance rules in FEOS `07_CODE_GOVERNANCE.md`
- Violate git governance in FEOS `10_GIT_GOVERNANCE.md`
- Compromise security rules in FEOS `09_SECURITY_GOVERNANCE.md`
- Deviate from operational playbook structure in FEOS `14_OPERATIONAL_PLAYBOOK.md`

If a FEOS rule and an IEF rule conflict, FEOS prevails. The IEF rule is documented as an Engineering Decision and the FEOS-compliant path is taken.

### 3.3 Knowledge Baseline Authority

The Knowledge Baseline documents the current state of modules, implementation status, and architectural decisions. Phase 4.5 infrastructure work MUST NOT:

- Introduce assumptions about module internals that contradict `07_MODULE_STATUS.md`
- Alter the implementation status recorded in `08_IMPLEMENTATION_STATUS.md`
- Modify KEB documents (they are updated only at module closure, per FEOS)

### 3.4 IEF Authority

The Infrastructure Execution Framework (documents 00–10 in `docs/execution/platform/`) defines the specification for each feature. Implementation MUST follow the specification. If the specification cannot be satisfied exactly, an Engineering Decision Report documents the deviation before any modified implementation proceeds.

### 3.5 Repository Authority

The committed repository state is authoritative over any undocumented assumption. If the repository contains a file or configuration that conflicts with the IEF specification, the repository state is acknowledged, the conflict is documented in an Engineering Decision Report, and the resolution is determined before implementation proceeds.

### 3.6 Engineering Decisions

Engineering Decision Reports govern implementation-level choices that deviate from specifications. They do not override FEOS, KEB, or the IEF. They record: the problem, constraints, alternatives considered, the decision taken, and its impact. All Engineering Decision Reports are traceably linked to the feature that generated them.

### 3.7 Conflict Resolution Order

When a conflict is detected:

1. **Identify** the conflicting documents and their positions in the authority hierarchy
2. **Do not implement** any resolution before documenting the conflict
3. **Document** the conflict in `ENGINEERING_DECISION_REPORT_FXX.md` for the current feature
4. **Apply** the higher-authority rule
5. **Continue** implementation only after the Engineering Decision Report is committed
6. **Escalate** if the conflict cannot be resolved by following the hierarchy (stop condition)

---

## Section 4: Execution Philosophy

### 4.1 Engineering Principles

**Principle of Single Feature Execution**

Exactly one infrastructure feature is implemented per execution cycle. No feature may begin until the preceding feature is complete, committed, and passing all quality gates. Parallel feature implementation is prohibited.

**Principle of Repository Safety**

Every implementation step preserves the repository's build, lint, test, and Prisma validation state. No intermediate state may be committed in which any quality gate fails. The repository MUST be in a valid state at every commit boundary.

**Principle of Minimum Footprint**

Each feature creates or modifies only the files its specification requires. Files outside the feature's defined scope are not touched, regardless of observed improvement opportunities.

**Principle of Traceability**

Every file created or modified during Phase 4.5 traces to a specific feature (FXX), a specification document (03–07), and a quality gate outcome. No artifact is created without documented justification.

**Principle of Immutable Precedent**

Completed features are not revisited except to satisfy a blocking dependency of a later feature. If a completed feature file requires modification to accommodate a later feature, this is documented as an Engineering Decision and scoped to the later feature's commit.

### 4.2 Infrastructure-First Philosophy

Phase 4.5 implements infrastructure in dependency order. A downstream feature that depends on an upstream feature never begins before its dependency is complete. This is the correct execution order for Phase 4.5:

```
F01 (Node pinning)
  └─ F02 (Repository hygiene — .gitattributes must precede file additions)
       └─ F03 (Environment standardization — .env.example needed before Docker)
            └─ F04 (Docker — local infrastructure needed before DevContainer)
                 └─ F05 (Bootstrap scripts — verifies Docker + Node + env)
                      └─ F06 (DevContainer — depends on Docker Compose topology)
                           └─ F07 (CI — validates all prior features in matrix)
                                └─ F08 (Cross-platform validation — CI results analyzed)
                                     └─ F09 (Documentation — all infrastructure complete)
                                          └─ F10 (Final validation — acceptance criteria)
```

Deviation from this dependency order requires a documented Engineering Decision.

### 4.3 Feature Isolation

The boundary of each feature is precisely defined by its IEF specification. Implementation that reaches outside the feature boundary — even for legitimate reasons — constitutes an undocumented deviation and triggers the stop condition `Undocumented engineering decision`.

If an implementation observation reveals that a future feature's file must be partially created now (e.g., a shared configuration key that two features reference), this is documented in an Engineering Decision Report before any cross-feature action is taken.

### 4.4 Repository Safety

Repository safety is enforced by the following non-negotiable invariant:

> **At every commit, `npm run build`, `npm run lint`, `npm run test`, and `npx prisma validate` must all pass.**

No exception exists to this invariant during Phase 4.5. A commit that breaks any quality gate is rolled back immediately and the stop condition protocol is invoked.

### 4.5 Incremental Execution

Phase 4.5 proceeds in the smallest safe increments. An increment is defined as a single feature: one implementation commit (or two when a documentation-only second commit is warranted). No feature spans more than two commits (implementation + documentation), except under the Commit Exception policy defined in Section 5.5.

### 4.6 Quality-First Implementation

Quality gates are not a post-implementation check. They are a constraint that shapes implementation decisions. If a correct implementation of a feature cannot pass all quality gates, the implementation approach is wrong and must be reconsidered. Quality gate failure is never accepted as a known issue to be resolved later.

### 4.7 Architecture Preservation

Phase 4.5 adds infrastructure around the application. It does not modify the application. The NestJS architecture (`Controllers → Use Cases → Services → Repositories → PrismaService`), module structure, dependency injection configuration, and all business logic are frozen for the duration of Phase 4.5.

### 4.8 Business Logic Protection

The following are permanently protected during Phase 4.5:

- All files under `src/`
- All files under `prisma/migrations/`
- `prisma/schema.prisma`
- All `*.spec.ts` test files
- All `test/` directory contents
- FEOS (`docs/feos/`)
- Knowledge Baseline (`docs/knowledge/`)

A request to modify any of these during Phase 4.5 is a stop condition regardless of justification.

### 4.9 Documentation-First Governance

Every feature produces documentation before its implementation is considered complete:

1. Implementation commit (files created/modified)
2. Quality gates verified
3. `reports/FXX_REPORT.md` created
4. `09_PLATFORM_PROGRESS_TEMPLATE.md` updated
5. Engineering Decision Reports committed if applicable

Documentation is not optional. A feature without its report and progress update is not COMPLETE by definition.

---

## Section 5: Continuous Execution Policy

### 5.1 Execution Philosophy

Phase 4.5 executes sequentially and continuously. After a feature is confirmed COMPLETE (all quality gates pass, documentation committed), execution proceeds to the next feature without requiring manual confirmation, **unless a stop condition is encountered**.

This policy exists because:
- Feature transitions within Phase 4.5 carry no architectural risk (features are isolated)
- Quality gates provide continuous validation
- The dependency order is fixed and pre-approved by this contract

Manual confirmation is required ONLY at:
- Phase 4.5 completion (F10 → PMIC Part 3)
- Any stop condition
- Any engineering decision that requires architect approval

### 5.2 Automatic Feature Progression

When a feature transitions to COMPLETE, the following conditions authorize automatic progression to the next feature:

| Condition | Required State |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS — 0 errors |
| `npm run test` | PASS — all tests passing |
| `npx prisma validate` | PASS |
| `reports/FXX_REPORT.md` | COMMITTED |
| `09_PLATFORM_PROGRESS_TEMPLATE.md` | UPDATED |
| Engineering Decision Reports | COMMITTED (if any) |
| Git status | CLEAN — no uncommitted changes |
| Stop conditions | NONE active |

If all conditions are met, the next feature in dependency order begins immediately.

### 5.3 Sequential Implementation

Features execute in the dependency order defined in Section 4.2. This order is not negotiable during execution. If a feature dependency cannot be satisfied, execution stops and the stop condition protocol is invoked.

The current dependency order for remaining features:

| Next | Feature | Dependency |
|---|---|---|
| **F02** | Repository Hygiene | F01 COMPLETE ✓ |
| F03 | Environment Standardization | F02 COMPLETE |
| F04 | Docker Development Environment | F03 COMPLETE |
| F05 | Bootstrap Scripts | F04 COMPLETE |
| F06 | DevContainer | F04 COMPLETE + F05 COMPLETE |
| F07 | CI Pipeline | F01–F06 COMPLETE |
| F08 | Cross-Platform Validation | F07 COMPLETE |
| F09 | Developer Documentation | F04–F08 COMPLETE |
| F10 | Platform Final Validation | F01–F09 COMPLETE |

### 5.4 Dependency Validation

Before each feature begins, the following dependency check is performed:

1. Confirm all predecessor features are in DONE state in `09_PLATFORM_PROGRESS_TEMPLATE.md`
2. Confirm all predecessor feature commits exist in git log
3. Confirm quality gate state is PASS for the current repository HEAD
4. Confirm no stop condition is active

If any dependency check fails, execution stops and the stop condition protocol (Section 6) is invoked.

### 5.5 Feature Completion Requirements

A feature is COMPLETE only when ALL of the following are true:

| Requirement | Verified By |
|---|---|
| All files in feature scope created/modified per specification | Manual review against IEF spec |
| `npm run build` exits 0 | Execution |
| `npm run lint` exits 0 with 0 errors | Execution |
| `npm run test` exits 0, all tests passing | Execution |
| `npx prisma validate` exits 0 | Execution |
| Implementation commit exists | `git log` |
| `reports/FXX_REPORT.md` committed | `git log` |
| `09_PLATFORM_PROGRESS_TEMPLATE.md` updated | File review |
| No stop condition active | Section 6 check |

A feature that has not satisfied all requirements remains IN PROGRESS regardless of implementation state.

### 5.6 Commit Exception Policy

The standard commit structure is:
- Commit 1: Implementation (all feature files)
- Commit 2 (optional): Documentation only (`FXX_REPORT.md` + progress template update)

If a third commit is required (e.g., a quality gate failure discovered after commit 1 requires a fix), this is a Commit Exception. Commit Exceptions MUST be:
1. Documented in `reports/FXX_REPORT.md` under the heading "Commit Exception"
2. Limited to the scope of the failing quality gate
3. Committed before the feature is declared COMPLETE

A Commit Exception does not trigger a stop condition. It is an expected allowance for implementation corrections within a single feature cycle.

### 5.7 Transition Policy

On transitioning from feature FXX to feature FYY:

1. Verify all FXX completion requirements are satisfied
2. Update FXX status to DONE in progress template
3. Set FYY status to IN PROGRESS in progress template
4. Review FYY specification documents before writing any code
5. Verify current quality gate state before writing any code
6. Begin FYY implementation

Step 4 and 5 are non-negotiable. A feature that begins without reviewing its specification and verifying the quality gate baseline has violated the Execution Philosophy (Section 4).

---

## Section 6: Stop Conditions

### 6.1 Stop Condition Classification

Stop conditions are classified by their source and recovery complexity:

| Class | Source | Recovery |
|---|---|---|
| Class A — Quality Gate | Build/lint/test/prisma failure | Rollback to last clean commit; fix; re-implement |
| Class B — Architecture | Application/schema/test modification required | Halt; architect review; Engineering Decision |
| Class C — Authority | FEOS/KEB/IEF conflict discovered | Halt; document conflict; await resolution |
| Class D — Repository | Corruption, unexpected state, unknown dependencies | Halt; full repository audit; architect approval |
| Class E — External | Docker/CI/DevContainer platform limitation | Engineering Decision; alternative specification; re-implementation |

### 6.2 Complete Stop Condition Register

#### SC-001: Build Failure

| Field | Value |
|---|---|
| **Class** | A |
| **Trigger** | `npm run build` exits non-zero at any commit boundary |
| **Impact** | Repository left in non-compilable state; all downstream features blocked |
| **Risk** | TypeScript errors introduced by feature implementation; cross-module type conflict |
| **Recovery** | Rollback to previous clean commit; diagnose error; correct implementation; re-run quality gates |
| **Required Approval** | None — self-recoverable |

#### SC-002: Lint Failure

| Field | Value |
|---|---|
| **Class** | A |
| **Trigger** | `npm run lint` reports one or more errors |
| **Impact** | Code quality gate broken; CI would fail |
| **Risk** | ESLint rule violated by new configuration files (e.g., JSON files inadvertently linted) |
| **Recovery** | Identify offending file; apply fix or add ESLint ignore with justification; re-run lint |
| **Required Approval** | None — self-recoverable |

#### SC-003: Test Failure

| Field | Value |
|---|---|
| **Class** | A |
| **Trigger** | Any of the 482 tests fail after a feature commit |
| **Impact** | Existing functionality may be broken; regression introduced |
| **Risk** | Infrastructure changes (e.g., `.env.example`, Docker environment) inadvertently affecting test configuration |
| **Recovery** | Identify failing test(s); determine cause; if test logic is unchanged and infrastructure is the cause, isolate the infrastructure change; rollback if necessary |
| **Required Approval** | None — self-recoverable IF no test file was modified; architect approval REQUIRED if test modification seems necessary |

#### SC-004: Prisma Validation Failure

| Field | Value |
|---|---|
| **Class** | A |
| **Trigger** | `npx prisma validate` exits non-zero |
| **Impact** | Prisma schema invalid; application cannot boot |
| **Risk** | Extremely low — no Phase 4.5 feature touches `prisma/schema.prisma` |
| **Recovery** | Verify `prisma/schema.prisma` has not been modified; run `git diff prisma/schema.prisma`; if modified, restore with `git checkout HEAD -- prisma/schema.prisma && npx prisma generate` |
| **Required Approval** | None if no schema modification; architect approval if schema restoration changes behavior |

#### SC-005: Architecture Violation

| Field | Value |
|---|---|
| **Class** | B |
| **Trigger** | Any file under `src/`, `prisma/schema.prisma`, `prisma/migrations/`, or `test/` is modified |
| **Impact** | Application logic altered outside authorized scope |
| **Risk** | Business logic corruption; module behavior change; test invalidation |
| **Recovery** | Immediate rollback of all changes in the current feature cycle; `git checkout HEAD -- <modified-files>`; halt execution |
| **Required Approval** | Chief Software Architect required before ANY resumption |

#### SC-006: FEOS Conflict

| Field | Value |
|---|---|
| **Class** | C |
| **Trigger** | An IEF specification or implementation decision contradicts a FEOS governance rule |
| **Impact** | Implementation violates the supreme engineering authority |
| **Risk** | Governance breakdown; downstream enforcement failures |
| **Recovery** | Halt; document the specific conflict citing both the FEOS rule and the IEF provision; the FEOS-compliant path is taken; the IEF provision is noted as superseded |
| **Required Approval** | Chief Software Architect + Engineering Governance Lead |

#### SC-007: Knowledge Baseline Conflict

| Field | Value |
|---|---|
| **Class** | C |
| **Trigger** | A Phase 4.5 implementation assumption contradicts `07_MODULE_STATUS.md` or `08_IMPLEMENTATION_STATUS.md` |
| **Impact** | Infrastructure built on incorrect assumptions about module state |
| **Risk** | CI pipeline or DevContainer fails because module state differs from assumed |
| **Recovery** | Halt; verify current KEB state; correct the assumption; update Engineering Decision if needed |
| **Required Approval** | Engineering Governance Lead |

#### SC-008: IEF Specification Conflict

| Field | Value |
|---|---|
| **Class** | C |
| **Trigger** | Two IEF documents (03–07) conflict on a specification detail, or repository state conflicts with IEF assumptions |
| **Impact** | Unclear implementation target; risk of incorrect artifact |
| **Risk** | Wrong configuration committed; requires rollback |
| **Recovery** | Halt; identify the conflicting specifications; document conflict in Engineering Decision Report; apply the higher-authority IEF rule (lower document number = higher authority within IEF); continue |
| **Required Approval** | None if resolved within IEF; architect approval if FEOS or KEB consulted |

#### SC-009: Repository Corruption

| Field | Value |
|---|---|
| **Class** | D |
| **Trigger** | Unexpected files, merge conflicts, detached HEAD, or unreachable commits discovered |
| **Impact** | Repository integrity at risk |
| **Risk** | Lost commits; untracked changes; history rewrite |
| **Recovery** | Halt immediately; run `git status`, `git log`, `git fsck`; do NOT force-push or reset hard without explicit architect authorization |
| **Required Approval** | Chief Software Architect; Engineering Governance Lead |

#### SC-010: Unknown Dependency Discovered

| Field | Value |
|---|---|
| **Class** | D |
| **Trigger** | An implementation dependency not documented in the IEF is discovered (e.g., a file that must exist before another can be created; a package required before a script runs) |
| **Impact** | Dependency order may be incorrect; current feature may be incomplete without the dependency |
| **Risk** | Partial implementation committed; future features blocked |
| **Recovery** | Halt current feature; document the dependency in Engineering Decision Report; evaluate whether dependency can be satisfied within current feature or requires reordering; continue only after resolution |
| **Required Approval** | None if reordering is within the approved dependency graph; architect approval if new ordering contradicts Section 4.2 |

#### SC-011: Docker / Container Limitation

| Field | Value |
|---|---|
| **Class** | E |
| **Trigger** | A Docker, Docker Compose, or DevContainer behavior differs from the IEF specification in a way that prevents the implementation from functioning |
| **Impact** | Feature cannot be implemented as specified |
| **Risk** | Infrastructure gap; developer environment non-functional |
| **Recovery** | Document the platform limitation and the alternative approach in Engineering Decision Report; implement the alternative; verify quality gates pass with the alternative |
| **Required Approval** | Chief Platform Engineer; Engineering Governance Lead if spec section must be marked superseded |

#### SC-012: CI Platform Limitation

| Field | Value |
|---|---|
| **Class** | E |
| **Trigger** | GitHub Actions runner behavior, available actions, or matrix constraints differ from the IEF CI specification |
| **Impact** | CI pipeline cannot be implemented as specified |
| **Risk** | CI quality gate gap; cross-platform validation incomplete |
| **Recovery** | Document the limitation in Engineering Decision Report; implement closest-compliance alternative; note the gap in acceptance criteria |
| **Required Approval** | Principal DevOps Engineer; architect sign-off for any quality gate reduction |

#### SC-013: Cross-Platform Incompatibility Requiring Redesign

| Field | Value |
|---|---|
| **Class** | E |
| **Trigger** | An OS-specific behavior prevents the feature from working on one or more target platforms (Windows, Ubuntu, macOS) in a way that requires changing the IEF specification |
| **Impact** | Cross-platform requirement cannot be met as specified |
| **Risk** | Platform excluded from support; CI matrix incomplete |
| **Recovery** | Document the specific platform incompatibility; determine minimum viable cross-platform behavior; document in Engineering Decision Report with the affected acceptance criteria |
| **Required Approval** | Chief Software Architect; QA Director |

#### SC-014: Undocumented Engineering Decision

| Field | Value |
|---|---|
| **Class** | B |
| **Trigger** | An implementation choice deviates from the IEF specification without a corresponding Engineering Decision Report |
| **Impact** | Traceability broken; governance non-compliant |
| **Risk** | Decision cannot be reviewed or overridden; silently wrong implementation |
| **Recovery** | Halt; retrospectively document the decision in `ENGINEERING_DECISION_REPORT_FXX.md`; commit the report before any further implementation |
| **Required Approval** | Engineering Governance Lead |

---

## Section 7: Recovery Policy

### 7.1 Failure Classification

| Failure Type | Classification | Recovery Path |
|---|---|---|
| Quality gate failure (post-commit) | Class A | Rollback or fix-forward |
| Quality gate failure (pre-commit) | Class A | Fix before committing; never commit failing code |
| Architecture violation | Class B | Immediate rollback; halt; architect review |
| FEOS conflict | Class C | Halt; document; FEOS-compliant path taken |
| Repository corruption | Class D | Halt; audit; no destructive operations without approval |
| Platform limitation | Class E | Engineering Decision; alternative implementation |

### 7.2 Recovery Workflow

```
FAILURE DETECTED
      │
      ▼
Classify failure (Class A–E)
      │
      ▼
Stop all implementation work
      │
      ├─ Class A ──► Is failure in committed code?
      │                    ├─ YES ──► git revert or rollback; diagnose; fix; re-verify gates
      │                    └─ NO ──►  Fix before committing; re-verify gates; continue
      │
      ├─ Class B ──► git checkout HEAD -- <protected-files>; halt; architect approval
      │
      ├─ Class C ──► Document conflict; apply higher-authority rule; continue
      │
      ├─ Class D ──► git status + git log + git fsck; HALT; no changes until approval
      │
      └─ Class E ──► Document in Engineering Decision; alternative implementation; re-verify
```

### 7.3 Repository Preservation Rules

| Rule | Classification | Detail |
|---|---|---|
| Never force-push to `main` | MANDATORY | FEOS `10_GIT_GOVERNANCE.md` prohibition |
| Never reset `--hard` to a commit before the last clean quality gate | MANDATORY | Data loss risk |
| Never delete committed feature reports | MANDATORY | Audit trail required |
| Never amend pushed commits | MANDATORY | FEOS governance |
| Rollback via `git revert` when feature commit must be undone | MANDATORY | Creates a traceable revert commit |
| `git stash` permitted for pre-commit state preservation | RECOMMENDED | Safe working state save |

### 7.4 Rollback Rules

A rollback is triggered when a committed implementation fails a quality gate that cannot be fixed by a Commit Exception.

Rollback procedure:
1. `git revert <failing-commit-hash> --no-edit` — creates a revert commit
2. Verify quality gates pass on the revert commit
3. Document the rollback cause in `reports/FXX_REPORT.md` under "Rollback Event"
4. Diagnose the root cause
5. Redesign the implementation
6. Re-implement the feature from the clean state

### 7.5 Restart Rules

After rollback, a feature may restart when:
- The root cause of the failure is documented
- A corrected implementation approach is identified
- The current repository HEAD passes all quality gates
- No stop condition remains active

### 7.6 Engineering Decision Integration in Recovery

If a recovery path requires an implementation choice that was not in the original specification:
1. Create `ENGINEERING_DECISION_REPORT_FXX.md` before re-implementing
2. Document: failure cause, attempted implementation, alternative approach, rationale
3. Commit the Engineering Decision Report as a standalone documentation commit
4. Then proceed with the corrected implementation

### 7.7 Partial Implementation Handling

A partial implementation (feature started but not complete) MUST NOT be committed to `main`. If a session ends with a partial implementation:
- Working tree changes: `git stash` or discard
- If already committed: `git revert` (see §7.4)
- The feature resumes from the last clean repository state

### 7.8 Repository Validation After Recovery

After any recovery action, verify:

```
npm run build    → exits 0
npm run lint     → exits 0, 0 errors
npm run test     → exits 0, 482/482
npx prisma validate → exits 0
git status       → clean
git log --oneline -3  → recovery commit visible
```

All four gates must pass before any further feature work begins.

---

## Section 8: Engineering Decision Policy

### 8.1 Mandatory Trigger Conditions

An Engineering Decision Report (EDR) MUST be created when ANY of the following occurs:

| Trigger | Example |
|---|---|
| IEF specification cannot be implemented exactly as written | Docker image unavailable for arm64; alternative needed |
| Two specifications conflict and judgment is required | IEF doc 03 and IEF doc 04 specify incompatible network configurations |
| Repository state differs from IEF assumptions | A file the IEF expects to be absent already exists |
| A dependency not in the IEF is discovered | A package must be installed that the spec didn't list |
| A platform limitation prevents the specified approach | Windows line endings affect a POSIX-only feature |
| A stop condition resolves with a non-standard path | Lint failure fixed by approach different from spec |
| A feature boundary is crossed for a justifiable reason | A later feature's config must be partially created now |
| FEOS and IEF conflict | A FEOS rule supersedes an IEF recommendation |
| Version choices differ from what the spec recommends | A newer PostgreSQL minor version is chosen |

### 8.2 Engineering Decision Report Structure

Every EDR contains the following sections without exception:

```
# ENGINEERING_DECISION_REPORT_FXX.md

## Header
Feature: FXX — <Feature Name>
Decision ID: ED-P45-XXX
Date: YYYY-MM-DD
Status: DECIDED | PENDING | SUPERSEDED

## Problem Statement
What conflict, limitation, or unknown necessitated this decision.

## Constraint
What system, governance rule, or platform limitation creates the constraint.

## Alternatives Considered
| Alternative | Pros | Cons | Rejected Because |
|---|---|---|---|

## Decision
The chosen approach, stated precisely.

## Rationale
Why this alternative was chosen over others.
Must cite the highest applicable authority that supports the decision.

## Impact
What changes from the original specification.
Which acceptance criteria are affected.

## Future Work
If the decision defers anything, what and when.

## Approval
Required approver(s) per stop condition classification.
Date approved.
```

### 8.3 Naming Convention

```
ENGINEERING_DECISION_REPORT_F<XX>.md
```

Where `<XX>` is the two-digit feature number (01–10). Multiple decisions for the same feature reside in a single file under separate `## Decision ED-P45-XXX` headers.

Location: `docs/execution/platform/ENGINEERING_DECISION_REPORT_FXX.md`

### 8.4 Approval Process

| Stop Class | Required Approver |
|---|---|
| Class A (quality gate) | None — self-approved when gates pass |
| Class B (architecture) | Chief Software Architect |
| Class C (authority) | Chief Software Architect + Engineering Governance Lead |
| Class D (repository) | Chief Software Architect + Engineering Governance Lead |
| Class E (platform limitation) | Chief Platform Engineer + Engineering Governance Lead |

### 8.5 Relationship with FEOS

EDRs do not override FEOS. If a decision appears to require overriding a FEOS rule, the decision is escalated as a Class C stop condition. The FEOS-compliant alternative is taken. The EDR records what was considered and why FEOS was determinative.

### 8.6 Relationship with Knowledge Baseline

EDRs do not modify the Knowledge Baseline. The KEB is updated only at module closure milestones. If a decision reveals a KEB inaccuracy, the inaccuracy is noted in the EDR and flagged for the next authorized KEB update.

### 8.7 Relationship with IEF

EDRs record deviations from IEF specifications. Each EDR cites the specific section of the IEF it modifies. The IEF specification documents themselves are never modified as a result of an EDR — the EDR is the record of deviation, not an amendment to the specification.

---

## Section 9: Governance Principles

### 9.1 Engineering Rule Classification

Every rule in this contract and in the IEF is classified:

| Classification | Meaning | Violation Consequence |
|---|---|---|
| MANDATORY | Must be followed; no discretion | Stop condition triggered on violation |
| RECOMMENDED | Should be followed; deviation requires documentation | Noted in EDR; implementation proceeds |
| OPTIONAL | May be followed; decision at implementation time | No documentation required |

### 9.2 Governance Principle Register

| Principle | Classification | Impact of Violation | Risk | Recovery | Approval |
|---|---|---|---|---|---|
| One feature per execution cycle | MANDATORY | Uncontrolled scope; mixed commits; audit trail lost | HIGH | Rollback mixed commit; re-implement features separately | Chief Architect |
| Quality gates before commit | MANDATORY | Broken repository state | HIGH | Rollback; fix; re-verify | None (self-correcting) |
| Quality gates before feature declaration | MANDATORY | Incomplete feature declared done | HIGH | Re-run gates; fix failures | None |
| No source code modification | MANDATORY | Business logic at risk | CRITICAL | Immediate rollback; architect review | Chief Architect |
| No schema modification | MANDATORY | Database contract broken | CRITICAL | Immediate rollback; prisma restore | Chief Architect |
| No FEOS modification | MANDATORY | Governance authority undermined | CRITICAL | Restore FEOS; escalate | Chief Architect + Governance Lead |
| EDR before deviating from IEF | MANDATORY | Undocumented deviation; governance gap | HIGH | Retrospective EDR; commit before continuing | Governance Lead |
| Feature report for every feature | MANDATORY | Audit trail incomplete | MEDIUM | Create report retrospectively | None |
| Progress template update for every feature | MANDATORY | Dashboard inaccurate | LOW | Update template | None |
| Document-first on stop conditions | MANDATORY | Untracked resolution path | HIGH | Retrospective documentation | Governance Lead |
| Forward-slash paths in all scripts | MANDATORY | Windows CI failure | HIGH | Fix path; re-test | None |
| No hardcoded credentials in any committed file | MANDATORY | Security breach | CRITICAL | Rotate credentials; remove from history | Chief Architect + Security Lead |
| Exact image version pinning in Docker | MANDATORY | Environment drift | MEDIUM | Update Compose file; re-test | None |
| `npm ci` in CI (not `npm install`) | MANDATORY | Lock file bypass | HIGH | Update CI workflow; re-run | None |
| Workflow permissions declared explicitly | MANDATORY | Supply chain risk | HIGH | Add permissions block | None |
| EditorConfig at repo root before first file addition | RECOMMENDED | Encoding inconsistency in new files | MEDIUM | Add EditorConfig; normalize existing files | None |
| Docker health checks using `pg_isready` | RECOMMENDED | Fragile container readiness | LOW | Update health check | None |
| Alpine image variants for infrastructure | RECOMMENDED | Larger image footprint | LOW | Switch to alpine | None |

---

## Section 10: Validation

This document is valid when:

- [ ] No implementation has been performed (source, schema, tests, FEOS, KEB unchanged)
- [ ] All stop conditions have defined Impact, Risk, Recovery, and Required Approval
- [ ] Authority hierarchy is consistent with FEOS and IEF
- [ ] Engineering Decision Policy is consistent with IEF document naming conventions
- [ ] Recovery Policy covers all five stop condition classes
- [ ] Continuous Execution Policy defines all transition conditions
- [ ] Governance Principle Register classifies every rule MANDATORY/RECOMMENDED/OPTIONAL
- [ ] Part 2 scope (Feature Execution Contracts F02–F10) is clearly delineated

---

## Document Status

| Field | Value |
|---|---|
| Part 1 | COMPLETE |
| Part 2 | PENDING — Feature Execution Contracts (F02–F10) |
| Part 3 | PENDING — Closure and Transition Protocol |
