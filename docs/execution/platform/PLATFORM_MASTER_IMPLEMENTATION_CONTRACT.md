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
| Part 2 | COMPLETE — Infrastructure Engineering Standards |
| Part 3 | PENDING — Closure and Transition Protocol |

---

---

# Part 2 — Infrastructure Engineering Standards

---

## Section 11: Infrastructure Engineering Standards

### 11.1 Purpose

Part 2 defines the engineering standards that govern every Phase 4.5 feature implementation. These standards are prescriptive, not advisory. Where a standard is classified MANDATORY, deviation triggers the Engineering Decision and stop condition protocols defined in Part 1. Where a standard is RECOMMENDED, deviation is recorded but does not halt execution.

### 11.2 Scope

Part 2 standards apply to all implementation work from F02 through F10. They supplement the feature specifications in the IEF (documents 03–07) and the feature-level contracts in Part 3 (PMIC Part 3, pending). They do not replace or supersede those documents — they add a cross-cutting engineering governance layer that operates above individual feature specifications.

### 11.3 Applicability

| Standard | Applies To |
|---|---|
| Repository Standards (§12) | Every feature; every commit |
| Cross-Platform Standards (§13) | Every file created or modified |
| Docker Standards (§14) | F04 (Docker); F06 (DevContainer) |
| DevContainer Standards (§15) | F06 |
| Bootstrap Standards (§16) | F05 |
| Toolchain Standards (§17) | F01 (complete); F02–F10 (validation) |
| CI/CD Standards (§18) | F07 |
| Developer Experience Standards (§19) | F02, F09 |
| Documentation Standards (§20) | Every feature |
| Quality Gate Standards (§21) | Every feature |
| Commit Standards (§22) | Every commit |
| Feature Execution Template (§23) | Every feature |
| Feature Dependency Rules (§24) | Every feature transition |
| Feature Acceptance Rules (§25) | Every feature completion |

### 11.4 Engineering Philosophy

Part 2 is grounded in the same engineering philosophy as the IEF and Part 1:

- Infrastructure must not alter application behavior
- Every standard must be verifiable by an objective test
- Standards that cannot be enforced automatically must be enforced by process
- No standard is waived by convenience — only by an Engineering Decision with documented justification

### 11.5 Infrastructure Quality Principles

| Principle | Classification | Standard |
|---|---|---|
| Reproducibility | MANDATORY | Any developer on any supported OS following documented steps reaches a running environment |
| Determinism | MANDATORY | Identical inputs produce identical environments across OS targets and time |
| Auditability | MANDATORY | Every infrastructure file traces to a feature, a specification, and a quality gate outcome |
| Minimalism | MANDATORY | No infrastructure artifact is created without a documented requirement |
| Reversibility | MANDATORY | Every infrastructure change can be rolled back without affecting application source code |
| Isolation | MANDATORY | Infrastructure components do not cross feature boundaries during implementation |
| Verifiability | MANDATORY | Every infrastructure claim ("this works on macOS") has a corresponding CI or documented manual test |
| Forward compatibility | RECOMMENDED | Infrastructure choices are made with awareness of F-series dependencies |

---

## Section 12: Repository Standards

### 12.1 Repository Layout

The Phase 4.5 repository layout extends the existing structure. Phase 4.5 adds the following top-level directories and files:

```
FactoryERP/                        ← existing root
  .devcontainer/                   ← F06: DevContainer configuration
  .github/
    workflows/                     ← F07: CI pipeline definitions
  .vscode/                         ← F09: Workspace configuration
  scripts/                         ← F05: Bootstrap and doctor scripts
  .editorconfig                    ← F02: Cross-editor formatting baseline
  .env.example                     ← F03: Environment variable manifest
  .gitattributes                   ← F02: Line-ending governance
  .nvmrc                           ← F01: COMPLETE
  docker-compose.dev.yml           ← F04: Development infrastructure
```

No Phase 4.5 feature may create files outside this set without an Engineering Decision.

### 12.2 Folder Ownership

| Path | Owner Feature | Write Authority |
|---|---|---|
| `.devcontainer/` | F06 | F06 only; subsequent features may read but not modify |
| `.github/workflows/` | F07 | F07 only |
| `.vscode/` | F09 | F09 only |
| `scripts/` | F05 | F05 only |
| `docs/execution/platform/` | IEF / PMIC | Documentation commits from any feature |
| `docs/execution/platform/reports/` | Every feature | Each feature's `FXX_REPORT.md` only |
| Root-level dotfiles | Owning feature | One feature per dotfile; no shared ownership |

### 12.3 Protected Directories

The following directories are write-protected for the entire duration of Phase 4.5. Any modification constitutes a Class B stop condition (§6, SC-005):

| Protected Path | Reason |
|---|---|
| `src/` | Application source code — frozen |
| `prisma/` | Schema and migrations — frozen |
| `test/` | E2E test configuration — frozen |
| `docs/feos/` | FEOS — supreme authority; never modified by execution phases |
| `docs/knowledge/` | KEB — updated only at module closure |

### 12.4 Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Feature implementation commit | `feat(platform/FXX): <description>` | `feat(platform/F02): repository hygiene` |
| Feature documentation commit | `docs(platform/FXX): <description>` | `docs(platform/F02): F02 completion report` |
| Feature report | `FXX_REPORT.md` | `F02_REPORT.md` |
| Engineering Decision Report | `ENGINEERING_DECISION_REPORT_FXX.md` | `ENGINEERING_DECISION_REPORT_F04.md` |
| Workflow files | `<purpose>.yml` | `ci.yml`, `security.yml` |
| Compose files | `docker-compose.<env>.yml` | `docker-compose.dev.yml` |
| Bootstrap scripts | `<action>.<ext>` | `setup.sh`, `doctor.ps1`, `reset.sh` |

### 12.5 Generated Files Policy

| File Type | Policy |
|---|---|
| `dist/` (build output) | Gitignored; never committed |
| `node_modules/` | Gitignored; never committed |
| `tsconfig.tsbuildinfo` | Gitignored; never committed |
| `coverage/` | Gitignored; never committed |
| `prisma/generated/` | Gitignored; generated at runtime |
| `.env` | Gitignored; never committed |
| Docker named volumes | Not in repository; managed by Docker Engine |

**MANDATORY:** The `.gitignore` must cover all generated files before any new directory structure that could produce them is committed. F02 (Repository Hygiene) is the correct feature to verify `.gitignore` completeness.

### 12.6 Temporary Files Policy

No temporary files may be committed to the repository. Temporary files created during implementation (test outputs, intermediate build states, debug logs) are discarded or gitignored. If a tool produces a temporary file that must persist (e.g., a lock file), its gitignore status is evaluated per the file type and the owning feature documents the decision.

### 12.7 Version Policy

| Versioned Artifact | Policy | Example |
|---|---|---|
| Node.js | Exact pin in `.nvmrc`; range in `engines` | `24.16.0` / `>=24.0.0 <25.0.0` |
| Docker images | Exact `major.minor.patch` tag | `postgres:16.4-alpine` |
| GitHub Actions | Major version tag (`@v4`) | `actions/checkout@v4` |
| npm packages | Managed by `package-lock.json`; no direct changes in Phase 4.5 | — |
| Prisma CLI | Unchanged from `package.json` (`6.16.2`) | — |

Version changes to any artifact beyond what F01 introduced require an Engineering Decision.

### 12.8 Dependency Policy

Phase 4.5 MUST NOT add new npm dependencies (production or development) to `package.json`. Infrastructure features achieve their goals through:

- Configuration files (`.gitattributes`, `.editorconfig`, `devcontainer.json`)
- Shell scripts (no npm dependencies)
- Docker Compose YAML (no npm dependencies)
- GitHub Actions YAML (no npm dependencies)

If a dependency appears necessary, an Engineering Decision documents the justification. Example: `cross-env` for Windows-compatible npm scripts would require an Engineering Decision and an architect sign-off modifying `package.json`.

### 12.9 Repository Hygiene Requirements

At every commit boundary, the repository MUST satisfy:

| Requirement | Verification |
|---|---|
| No untracked files (beyond gitignored) | `git status` shows clean working tree |
| No staged but uncommitted changes | `git diff --staged` is empty |
| No merge conflict markers | `git grep -r "<<<<<<" -- .` returns nothing |
| No debug artifacts | `git status` shows no `*.log`, `*.tmp`, `debug.*` |
| All committed files are UTF-8 | Encoding check (F08 validation) |
| `.gitignore` covers generated paths | `git status` does not surface `dist/`, `coverage/`, `node_modules/` |

### 12.10 Repository Health Requirements

The following metrics define a healthy repository throughout Phase 4.5:

| Metric | Required State |
|---|---|
| Build | PASS on every commit |
| Lint | PASS (0 errors) on every commit |
| Tests | 482/482 PASS on every commit (count does not decrease) |
| Prisma validate | PASS on every commit |
| Git history | Linear; no orphaned commits; no force-pushed refs |
| Commit density | One implementation commit (+ optional documentation commit) per feature |

### 12.11 Repository Maturity

Phase 4.5 raises the repository maturity level across ten dimensions:

| Dimension | Pre-Phase 4.5 | Target After Phase 4.5 |
|---|---|---|
| Node version governance | 0/10 | 10/10 |
| Line-ending governance | 2/10 | 10/10 |
| Environment standardization | 1/10 | 9/10 |
| Docker infrastructure | 0/10 | 10/10 |
| DevContainer | 0/10 | 10/10 |
| CI/CD | 0/10 | 10/10 |
| Developer experience | 1/10 | 10/10 |
| Cross-platform testing | 0/10 | 9/10 |
| Secrets management | 3/10 | 10/10 |
| Onboarding documentation | 1/10 | 9/10 |

Maturity tracking is the responsibility of the progress template (`09_PLATFORM_PROGRESS_TEMPLATE.md`).

---

## Section 13: Cross-Platform Standards

### 13.1 Supported Operating Systems

Phase 4.5 targets the following platforms with the stated priority levels (defined in IEF document 02):

| OS | Version | Architecture | Priority |
|---|---|---|---|
| Windows | 11 (build 22000+) | x64 | PRIMARY |
| Ubuntu | 24.04 LTS | x64 | PRIMARY |
| macOS | 14 Sonoma | arm64 | SECONDARY |
| Debian | 12 Bookworm | x64 | SECONDARY (DevContainer base) |
| Fedora | 40 | x64 | TERTIARY |

**MANDATORY:** All MANDATORY features (F02–F09) must be validated on both PRIMARY platforms before the feature is declared COMPLETE. SECONDARY and TERTIARY platform validation is performed in F08 (Cross-Platform Validation) and F10 (Final Validation).

### 13.2 Filesystem Compatibility

**MANDATORY:** All Phase 4.5 file operations must be compatible with NTFS (Windows), ext4 (Linux), and APFS (macOS). The following constraints apply:

| Property | Windows (NTFS) | Linux (ext4) | macOS (APFS) | Standard Adopted |
|---|---|---|---|---|
| Case sensitivity | Insensitive | Sensitive | Insensitive | Sensitive (enforced by `forceConsistentCasingInFileNames: true`) |
| Max path length | 260 (legacy) / 32767 (enabled) | 4096 | 1024 | Paths kept below 200 characters |
| Symlinks | Requires Dev Mode | Native | Native | Symlinks prohibited in committed paths |
| File locking | Mandatory (by OS) | Advisory | Advisory | No file lock assumptions in scripts |

### 13.3 Case Sensitivity Policy

**MANDATORY:** All import paths in TypeScript source follow the existing `forceConsistentCasingInFileNames: true` constraint. Phase 4.5 does not modify `tsconfig.json`. This policy is inherited.

All new files created during Phase 4.5 use lowercase names with hyphens as word separators (kebab-case), consistent with the existing repository convention. CamelCase file names are not introduced by Phase 4.5.

### 13.4 Line-Ending Policy

**MANDATORY:** LF (`\n`) is the canonical line ending for all text files in this repository. CRLF is never committed.

Enforcement mechanism:
- F02 commits `.gitattributes` which normalizes all governed extensions to LF on commit
- `.editorconfig` sets `end_of_line = lf` for all text files
- `.vscode/settings.json` sets `"files.eol": "\n"`
- F07 (CI) asserts LF line endings for all governed extensions

Until F02 is complete, Phase 4.5 implementation files (configuration, YAML, scripts) committed to the repository carry the risk of CRLF contamination from the Windows development environment. This is an accepted transitional risk documented here and resolved by F02.

### 13.5 UTF-8 Policy

**MANDATORY:** All text files created during Phase 4.5 must be UTF-8 encoded without BOM (UTF-8-NoBOM).

PowerShell 5.1 (Windows PowerShell) defaults to UTF-16 LE for files created with `Out-File` and `Set-Content`. Any script that produces output files MUST specify `-Encoding utf8` explicitly.

`editorconfig` `charset = utf-8` and VSCode `"files.encoding": "utf8"` enforce this at the editor level. CI verifies encoding compliance in F08.

### 13.6 Path Separator Policy

**MANDATORY:** Forward slashes (`/`) are used in all committed configuration files, YAML, JSON, and shell scripts. Windows backslash (`\`) notation is prohibited in committed files.

| Context | Permitted Separator | Notes |
|---|---|---|
| YAML (`docker-compose.dev.yml`, workflow files) | `/` only | YAML parsers are cross-platform; forward slash always valid |
| Shell scripts (`.sh`) | `/` only | POSIX sh; backslash is not a path separator |
| PowerShell scripts (`.ps1`) | Both `/` and `\` | PowerShell accepts both; use `/` for cross-platform legibility |
| JSON (`.vscode/tasks.json`, `devcontainer.json`) | `/` only | JSON has no path concept; but embedded shell commands follow shell rules |
| TypeScript source (`src/`) | N/A | Not modified in Phase 4.5 |

### 13.7 Permissions Policy

Shell scripts committed to `scripts/` MUST be executable. On Linux and macOS:

```
chmod +x scripts/setup.sh scripts/doctor.sh scripts/reset.sh
```

This is performed as part of the F05 implementation. GitHub Actions workflows explicitly execute scripts with `bash scripts/setup.sh` rather than relying on the execute bit, providing cross-platform compatibility.

On Windows, PowerShell scripts (`.ps1`) do not require an execute bit. They are invoked with `powershell.exe -File scripts/setup.ps1`.

**MANDATORY:** No Phase 4.5 script requires `sudo` or administrator privileges. If elevated privileges are unavoidable on a specific platform, this is a Class E stop condition.

### 13.8 Environment Variable Policy

All environment variables required by the application are documented in `.env.example` (F03). The following constraints govern their handling across platforms:

| Rule | Classification | Detail |
|---|---|---|
| No inline `VAR=value cmd` in npm scripts | MANDATORY | Windows CMD does not support this syntax |
| No `process.env.VAR` in Phase 4.5 scripts | MANDATORY | Scripts use shell variable expansion only |
| `DATABASE_URL` prefixed on all Prisma CLI invocations | MANDATORY | `prisma.config.ts` project constraint |
| `.env` sourced at start of `doctor.sh` | MANDATORY | Enables variable checks without external dependency |
| CI variables injected via GitHub Actions `env:` | MANDATORY | Never in workflow file literals |

### 13.9 Shell Compatibility

| Script Type | Target Shell | Prohibited Constructs |
|---|---|---|
| `.sh` scripts | POSIX sh (`/bin/sh`) | Bash-isms: `[[`, `function`, `$RANDOM`, process substitution, arrays |
| `.ps1` scripts | PowerShell 5.1 | `&&` / `\|\|` pipeline chains; `??` null-coalescing; ternary `?:` |
| Inline commands in YAML | OS-native shell | Backslash path separators; `%VAR%` syntax |

All `.sh` scripts MUST pass `sh -n <script>` (POSIX syntax check) as part of F05 validation.

### 13.10 Compatibility Validation

Each cross-platform standard is validated as follows:

| Standard | Validation Gate | Feature |
|---|---|---|
| LF line endings | `git ls-files --eol` | F02, F08 |
| UTF-8 encoding | `file --mime-encoding` on CI | F08 |
| Forward-slash paths | `grep -r '\\\\' scripts/` returns empty | F05 |
| No hardcoded CRLF | CI assertion | F07, F08 |
| Execute bits on scripts | `ls -la scripts/` on Ubuntu CI | F07 |
| PowerShell 5.1 compatibility | `powershell.exe -NonInteractive -File` | F07 |

---

## Section 14: Docker Standards

### 14.1 Docker Philosophy

The Docker development environment provides infrastructure services only. The NestJS application MUST NOT run inside a Docker container during development. This separation:

- Maintains hot-reload performance (`nest start --watch` is incompatible with production-style containers)
- Preserves the debugging workflow (VSCode attaches to the host Node process)
- Keeps container count and startup time minimal

All Docker services are declared in a single `docker-compose.dev.yml` file. Separate Compose files for individual services are prohibited.

### 14.2 Development Containers

Phase 4.5 defines the following container set:

| Service | Compose Name | Start Behavior | Profile |
|---|---|---|---|
| PostgreSQL | `db` | Default (no profile required) | — |
| PgAdmin | `pgadmin` | Profile-gated | `tools` |
| Redis | `redis` | Profile-gated | `cache` |
| MailHog | `mailhog` | Profile-gated | `mail` |

Only PostgreSQL starts with `docker compose -f docker-compose.dev.yml up -d`. Optional services require explicit profile activation. This is the only permitted default start behavior.

### 14.3 Compose Architecture

**MANDATORY constraints on `docker-compose.dev.yml`:**

| Constraint | Rule |
|---|---|
| No `version:` top-level key | Deprecated in Compose Specification v1.0+ |
| Single file, all services | No `include:` or external file references |
| Named network required | `factory-dev-network` bridge network |
| No `network_mode: host` | Prohibited on all services |
| No bind mounts for database data | Named volumes only (cross-platform performance) |
| No hardcoded credentials | Variable substitution via `.env` (`${VAR}`) only |
| Container names explicit | `container_name:` field mandatory on all services |
| Restart policy explicit | `restart:` field mandatory on all services |

### 14.4 Networks

| Property | Specification |
|---|---|
| Network name | `factory-dev-network` |
| Driver | `bridge` |
| External | `false` — managed by this Compose file |
| Scope | All services in `docker-compose.dev.yml` |

All services MUST declare `networks: - factory-dev-network`. Services that do not declare a network are prohibited (they would join the default network, bypassing explicit topology).

### 14.5 Volumes

| Rule | Classification | Detail |
|---|---|---|
| Named volumes only for stateful services | MANDATORY | No bind mounts from host filesystem for DB data |
| Volume names follow `factory-<service>-data` pattern | MANDATORY | `factory-postgres-data`, `factory-pgadmin-data` |
| Volumes declared in top-level `volumes:` block | MANDATORY | All named volumes enumerated at file top level |
| `down -v` must be documented as destructive | MANDATORY | README and script guard |

### 14.6 Health Checks

**MANDATORY:** All stateful services MUST declare a health check. Services that dependent services depend on MUST use `condition: service_healthy` in their `depends_on` block.

| Service | Health Check Command |
|---|---|
| PostgreSQL | `pg_isready -U ${POSTGRES_USER:-factory_dev} -d ${POSTGRES_DB:-factory_erp}` |
| Redis | `redis-cli ping` |

Minimum health check configuration:

```
interval: 10s
timeout: 5s
retries: 5
start_period: 10s
```

Health checks using `sleep` as a substitute are prohibited.

### 14.7 Restart Policy

| Service | Restart Policy | Rationale |
|---|---|---|
| PostgreSQL | `unless-stopped` | Survives Docker restarts; stops on explicit `down` |
| PgAdmin | `unless-stopped` | Same |
| Redis | `unless-stopped` | Same |
| MailHog | `unless-stopped` | Same |

`always` restart policy is prohibited (would restart after `docker compose stop`, contradicting explicit shutdown intent).

### 14.8 Image Version Pinning

**MANDATORY:** All Docker images MUST be pinned to an exact `major.minor.patch` tag. The following tags are approved for Phase 4.5:

| Service | Image | Tag |
|---|---|---|
| PostgreSQL | `postgres` | `16.4-alpine` |
| PgAdmin | `dpage/pgadmin4` | `8.14` |
| Redis | `redis` | `7.4-alpine` |
| MailHog | `mailhog/mailhog` | `v1.0.1` |

`latest` tag is prohibited. Floating tags (e.g., `16`, `7.4`) are prohibited. Image tag changes require an Engineering Decision.

### 14.9 Tag Policy

| Rule | Classification |
|---|---|
| Alpine variants preferred for infrastructure | RECOMMENDED |
| Multi-arch images required (linux/amd64, linux/arm64) | MANDATORY |
| Official images preferred over community images | MANDATORY |
| Digest pinning (`@sha256:...`) over version tags | OPTIONAL |

MailHog does not publish an official arm64 image. Its use is optional (profile-gated). The Engineering Decision Register (ED-P45-004) documents this limitation.

### 14.10 Secrets

| Rule | Classification | Detail |
|---|---|---|
| No credentials in `docker-compose.dev.yml` | MANDATORY | All secrets via `${VAR}` substitution |
| `.env` provides values at runtime | MANDATORY | `.env` is gitignored |
| No `secrets:` Compose block | MANDATORY | Compose secrets are for production; development uses env vars |
| `DATABASE_URL` not hardcoded in any committed file | MANDATORY | Derived from `.env` |
| `JWT_SECRET` not hardcoded in any committed file | MANDATORY | Sourced from `.env` / CI secrets |

### 14.11 Logging

Docker container log drivers are not configured in Phase 4.5. The default `json-file` driver is used. Log access is via `docker logs <container-name>`.

Log rotation is not configured for Phase 4.5 (development environment; logs are ephemeral).

### 14.12 Container Naming

**MANDATORY:** All container names follow `factory-erp-<service>`:

| Service | Container Name |
|---|---|
| PostgreSQL | `factory-erp-db` |
| PgAdmin | `factory-erp-pgadmin` |
| Redis | `factory-erp-redis` |
| MailHog | `factory-erp-mailhog` |

### 14.13 Resource Limits

Resource limits are not configured in the Phase 4.5 development environment. This is appropriate for local development where host resources are not shared with other workloads. Production resource constraints are a CD phase concern.

### 14.14 Recovery

Docker recovery procedures are documented in the IEF (document 04 §14). The PMIC adds the following governance:

| Scenario | Recovery Classification | Authority |
|---|---|---|
| PostgreSQL fails to start | Self-recoverable | Platform Engineer |
| Volume corruption requiring `down -v` | Documented destructive operation | Platform Engineer + developer acknowledgment |
| Port conflict (5432 in use) | Self-recoverable | Platform Engineer |
| `bcrypt` native module mismatch | Self-recoverable | Developer (documented in README) |

### 14.15 Validation

F04 (Docker Development Environment) is COMPLETE only when:

| Check | Result |
|---|---|
| `docker compose -f docker-compose.dev.yml config` exits 0 | PASS |
| `db` container reaches `healthy` within 60 seconds | PASS |
| Application starts against containerized PostgreSQL | PASS |
| Named volumes created per specification | PASS |
| No credentials in Compose file | PASS |
| All container names match §14.12 | PASS |
| Image tags match §14.8 | PASS |

---

## Section 15: DevContainer Standards

### 15.1 Purpose

The DevContainer provides a fully containerized development environment for developers who cannot or prefer not to manage Node.js, PostgreSQL, and build tools locally. It is an opt-in alternative to local development, not a replacement.

**MANDATORY:** The DevContainer MUST NOT be the only path to a working development environment. A developer following documented local steps (without DevContainer) must achieve the same result.

### 15.2 Container Lifecycle

| Phase | Event | Action |
|---|---|---|
| Creation | First `Reopen in Container` | Base image pulled; `postCreateCommand` runs (`npm ci` + `prisma generate`) |
| Start | Subsequent `Reopen in Container` | Container starts; `postStartCommand` runs (optional) |
| Rebuild | `Rebuild Container` | Image rebuilt from scratch; `postCreateCommand` re-runs |
| Stop | VSCode window close | Container stops; volumes persist |
| Delete | `Remove Container` | Container deleted; named volumes may persist or be removed depending on configuration |

`postCreateCommand` is the only lifecycle hook required for Phase 4.5. It MUST run `npm ci` and `prisma generate` in that order.

### 15.3 Workspace Configuration

| Property | Value | Rationale |
|---|---|---|
| `workspaceFolder` | `/workspaces/backend` | Standard DevContainer convention for repository root |
| `remoteUser` | `vscode` | Non-root; required by VSCode extension model |
| Workspace mount | Automatic (VSCode manages) | Host repository mounted at `workspaceFolder` |
| File ownership | `vscode:vscode` on `/workspaces/backend` | Prevents permission errors on `npm ci` |

### 15.4 VSCode Integration

All VSCode extensions operating on source code (linting, formatting, language services) run inside the container. Extensions operating on host-level resources (Git authentication, GitHub integration) run on the host.

| Extension Location | Examples |
|---|---|
| Container (in `devcontainer.json`) | ESLint, Prettier, Prisma, EditorConfig |
| Host (in `.vscode/extensions.json`) | Dev Containers, Docker, GitHub Pull Requests |

### 15.5 Extensions

Extensions declared in `devcontainer.json` under `customizations.vscode.extensions` are installed automatically when the container is created. The following extensions are MANDATORY for the DevContainer:

| Extension ID | Purpose | Classification |
|---|---|---|
| `dbaeumer.vscode-eslint` | ESLint feedback | MANDATORY |
| `esbenp.prettier-vscode` | Prettier formatting | MANDATORY |
| `prisma.prisma` | Schema language support | MANDATORY |
| `EditorConfig.EditorConfig` | EditorConfig enforcement | MANDATORY |

### 15.6 Port Forwarding

| Port | Service | Label | Auto-Open |
|---|---|---|---|
| 3000 | NestJS Application | `FactoryERP API` | Once (browser) |
| 5432 | PostgreSQL | `PostgreSQL` | No |

Port forwarding is declared in `devcontainer.json` under `forwardPorts` and `portsAttributes`. Ports not listed here are not forwarded.

### 15.7 Performance

**RECOMMENDED constraints for DevContainer performance:**

| Optimization | Method |
|---|---|
| `node_modules/` excluded from workspace file watcher | `"watcherExclude"` in workspace settings |
| `dist/` excluded from workspace file watcher | `"watcherExclude"` in workspace settings |
| Named volume for `node_modules/` (optional) | Avoids bind-mount performance penalty on macOS/Windows |

The `node_modules/` named volume optimization is OPTIONAL. If used, it must be declared in `docker-compose.devcontainer.yml` (the DevContainer Compose override), not in `docker-compose.dev.yml`.

### 15.8 Caching

The base image layer is cached by Docker after the first pull. The `postCreateCommand` (`npm ci`) is re-run on every container rebuild. There is no additional caching mechanism for `node_modules/` beyond Docker layer caching.

### 15.9 Environment Variables

**MANDATORY:** No credentials are hardcoded in `devcontainer.json`. Variables are injected via `remoteEnv` using `${localEnv:VAR}` substitution from the host environment.

The host `.env` file is the source for local development. The developer's shell or VSCode loads `.env` before launching the DevContainer. `remoteEnv` then forwards the variables into the container.

### 15.10 User Permissions

| Item | Specification |
|---|---|
| Container user | `vscode` (UID 1000) |
| Workspace ownership | `/workspaces/backend` owned by `vscode:vscode` |
| `node_modules/` | Written as `vscode` during `postCreateCommand` |
| Docker socket | Accessible only if Docker-in-Docker feature is enabled (OPTIONAL) |

### 15.11 Security

| Rule | Classification |
|---|---|
| Container runs as non-root (`vscode`) | MANDATORY |
| No secrets in `devcontainer.json` | MANDATORY |
| No secrets in `docker-compose.devcontainer.yml` | MANDATORY |
| Base image from official Microsoft registry | MANDATORY |
| Custom Dockerfile only when base image is insufficient | MANDATORY |

### 15.12 Validation

F06 (DevContainer) is COMPLETE only when:

| Check | Result |
|---|---|
| Container opens without error | PASS |
| `node --version` inside container = `v24.16.0` | PASS |
| `npm run build` passes inside container | PASS |
| `npm run test` passes inside container (482/482) | PASS |
| Container user is `vscode` (non-root) | PASS |
| Port 3000 forwarded and reachable | PASS |
| PostgreSQL reachable at `db:5432` from container | PASS |
| No secrets in `devcontainer.json` | PASS |

---

## Section 16: Bootstrap Standards

### 16.1 Bootstrap Philosophy

Bootstrap and doctor scripts are verification and setup tools, not installers. They verify prerequisites, perform application-level setup (dependency installation, code generation), and report actionable errors. They do not install operating system tools, Node.js, Docker, or any system package.

**MANDATORY:** All bootstrap scripts are idempotent. Running a bootstrap script twice on the same machine must produce the same outcome as running it once, without error on the second execution.

### 16.2 `setup.sh` Standards

| Standard | Classification | Detail |
|---|---|---|
| POSIX sh compatibility | MANDATORY | `#!/bin/sh`; no bash-isms |
| Exit on first error | MANDATORY | `set -e` at top of script |
| Each operation checks its own exit code | MANDATORY | No silent failure |
| Idempotent | MANDATORY | Safe to run multiple times |
| Does not install system tools | MANDATORY | Verification only before setup |
| Copies `.env.example` to `.env` if absent | MANDATORY | With console notice to edit values |
| Starts Docker Compose `db` service | MANDATORY | Waits for healthy before continuing |
| Runs `npm ci` | MANDATORY | Clean install; respects lock file |
| Runs `prisma generate` with explicit `DATABASE_URL` | MANDATORY | Project constraint |

### 16.3 `setup.ps1` Standards

All standards from §16.2 apply. PowerShell-specific additions:

| Standard | Classification | Detail |
|---|---|---|
| PowerShell 5.1 target | MANDATORY | `#Requires -Version 5.1` |
| `$ErrorActionPreference = "Stop"` | MANDATORY | Equivalent to `set -e` |
| No `&&` / `\|\|` pipeline chains | MANDATORY | Use `if ($LASTEXITCODE -ne 0)` |
| `-Encoding utf8` on all `Out-File`/`Set-Content` | MANDATORY | UTF-8 without BOM |

### 16.4 `doctor.sh` Standards

| Standard | Classification | Detail |
|---|---|---|
| Read-only operation | MANDATORY | Modifies no files, no state |
| POSIX sh compatible | MANDATORY | As §16.2 |
| Sources `.env` if present | MANDATORY | `. ./.env 2>/dev/null \|\| true` |
| Checks all 15 conditions from IEF doc 05 §5.2 | MANDATORY | No check may be skipped |
| Exit code 0 on full success | MANDATORY | CI-safe |
| Exit code 1 on any failure | MANDATORY | CI-safe |
| Output format: `[PASS]` / `[FAIL]` per check | MANDATORY | Per IEF doc 05 §5.4 |
| Completion under 10 seconds | RECOMMENDED | Encourages routine use |

### 16.5 `doctor.ps1` Standards

All standards from §16.4 apply. PowerShell-specific additions:

| Standard | Classification | Detail |
|---|---|---|
| Uses `Get-Command` for tool detection | MANDATORY | Not `which` or `command -v` |
| Parses `.env` into `$env:` variables | MANDATORY | Manual line-by-line parse |
| Reports `[PASS]` / `[FAIL]` with identical formatting to `doctor.sh` | MANDATORY | Uniform output |

### 16.6 `reset.sh` / `reset.ps1` Standards

| Standard | Classification | Detail |
|---|---|---|
| Confirmation prompt before ANY destructive action | MANDATORY | Must type `yes` to continue |
| `docker compose down -v` classified as destructive | MANDATORY | Data loss; must be guarded |
| `rm -rf node_modules` classified as destructive | MANDATORY | Guarded by same confirmation |
| No automatic deletion of `.env` | MANDATORY | Requires explicit second confirmation |
| POSIX sh / PowerShell 5.1 standards apply | MANDATORY | Per §16.2 and §16.3 |

### 16.7 Tool Verification Standards

The doctor script verifies tools in this order:

1. `git` — version check
2. `node` — version check against `.nvmrc`
3. `npm` — version check against `engines.npm`
4. `docker` — version check and daemon status
5. `docker compose` — version check (v2 command format)
6. `.env` — file presence
7. `DATABASE_URL` — variable set
8. `JWT_SECRET` — variable set
9. `node_modules` — directory presence
10. `@prisma/client` — presence in `node_modules`
11. PostgreSQL container healthy — Compose health check
12. `prisma validate` — schema validation

This order is non-negotiable. A verification that depends on a later check (e.g., Prisma validate depends on `node_modules`) must not run before its dependency is verified.

### 16.8 Failure Handling

| Failure Type | Script Response |
|---|---|
| Tool missing | Print `[FAIL]` with installation URL; continue checking remaining items; exit 1 at end |
| Version mismatch | Print `[FAIL]` with current version, expected version, and fix command |
| Docker not running | Print `[FAIL]` with start instruction; skip Docker-dependent checks |
| `.env` missing | Print `[FAIL]` with `cp .env.example .env` instruction |
| Prisma validate fails | Print `[FAIL]` with full error output |

Doctor script failures do NOT trigger stop conditions. They are expected behavior when a developer's environment is misconfigured.

### 16.9 Validation

F05 (Bootstrap Scripts) is COMPLETE only when:

| Check | Result |
|---|---|
| `scripts/doctor.sh` exits 0 on configured machine | PASS |
| `scripts/doctor.ps1` exits 0 on configured Windows machine | PASS |
| `scripts/doctor.sh` exits 1 with specific message on each failure condition | PASS |
| `scripts/setup.sh` is idempotent | PASS |
| `scripts/reset.sh` prompts before destructive operations | PASS |
| All scripts pass POSIX sh syntax check | PASS |
| All `.sh` scripts have execute bit set | PASS |

---

## Section 17: Toolchain Standards

### 17.1 Node.js

| Property | Standard | Classification |
|---|---|---|
| Required version | `24.16.0` (pinned in `.nvmrc`) | MANDATORY |
| Version range in `engines` | `>=24.0.0 <25.0.0` | MANDATORY |
| Version manager | nvm (Linux/macOS); nvm-windows (Windows) | RECOMMENDED |
| Alternative version manager | Volta | OPTIONAL |
| CI enforcement | `actions/setup-node` with `node-version-file: '.nvmrc'` | MANDATORY |
| Doctor check | `node --version` compared to `.nvmrc` content | MANDATORY |

### 17.2 npm

| Property | Standard | Classification |
|---|---|---|
| Minimum version | `11.0.0` (bundled with Node 24) | MANDATORY |
| Lock file | `package-lock.json` — committed; never ignored | MANDATORY |
| Install command (local) | `npm install` | PERMITTED |
| Install command (CI/scripts) | `npm ci` | MANDATORY |
| `--engines-strict` flag (CI) | Applied with `npm ci` | MANDATORY |
| Audit level enforcement | `--audit-level=high` in CI | MANDATORY |

### 17.3 TypeScript

TypeScript 5.7.3 is installed via `package.json` devDependencies. Phase 4.5 does not modify TypeScript configuration. The following constraints are inherited from the existing `tsconfig.json` and apply to all Phase 4.5 work:

| Constraint | Value |
|---|---|
| `isolatedModules` | `true` — all Phase 4.5 TypeScript additions must be compatible |
| `forceConsistentCasingInFileNames` | `true` — must not be removed |
| `strictNullChecks` | `true` — must not be removed |
| `target` | `ES2023` |
| `module` | `nodenext` |

Phase 4.5 produces no TypeScript files (infrastructure only). This section documents the TypeScript environment in which Phase 4.5 operates.

### 17.4 Prisma

| Property | Standard | Classification |
|---|---|---|
| CLI version | `6.16.2` (from `package.json`) | MANDATORY — no change |
| Client version | `6.16.2` (from `package.json`) | MANDATORY — versions must match |
| `DATABASE_URL` prefix | Required on all CLI commands | MANDATORY (project constraint) |
| `prisma generate` location | Run inside DevContainer or on host | Either is valid |
| `prisma validate` in CI | Run without a live database | MANDATORY |
| Schema modification | PROHIBITED in Phase 4.5 | MANDATORY |

### 17.5 Git

| Property | Standard | Classification |
|---|---|---|
| Minimum version | `2.40.0` | RECOMMENDED |
| `core.autocrlf` | Not enforced at project level (`.gitattributes` supersedes) | N/A |
| Force push to `main` | PROHIBITED | MANDATORY (FEOS `10_GIT_GOVERNANCE.md`) |
| Amending pushed commits | PROHIBITED | MANDATORY (FEOS) |
| Branch naming | `feat/`, `fix/`, `chore/` prefixes | RECOMMENDED |

### 17.6 Docker

| Property | Standard | Classification |
|---|---|---|
| Docker Engine minimum | `24.0.0` | MANDATORY |
| Docker Desktop (Windows/macOS) | `4.25.0+` | MANDATORY |
| Compose CLI version | v2 (`docker compose`, not `docker-compose`) | MANDATORY |
| Compose minimum version | `2.20.0` | MANDATORY |
| Compose file syntax | Compose Specification (no `version:` key) | MANDATORY |

### 17.7 Docker Compose

`docker compose` (v2 CLI, space-separated, not hyphenated) is the required invocation. All scripts, documentation, and workflow files use `docker compose`. `docker-compose` (v1 hyphenated) is prohibited.

### 17.8 VSCode

| Property | Standard | Classification |
|---|---|---|
| Minimum version | `1.90.0` | RECOMMENDED |
| Dev Containers extension | Required for DevContainer workflow | MANDATORY (for F06) |
| Workspace TypeScript | Use workspace TypeScript (`typescript.tsdk`) | MANDATORY |

### 17.9 Version Management

A single version bump for any tool requires:
1. Engineering Decision documenting the version change and rationale
2. Update to the affected standard in this section
3. Update to `.nvmrc` (Node only), `engines` field (Node/npm only), or Docker image tag (Docker only)
4. Re-verification of all quality gates

No tool version may be bumped without an Engineering Decision during Phase 4.5.

### 17.10 Compatibility Matrix

| Tool | Windows 11 | Ubuntu 24 | macOS 14 (arm64) | DevContainer (Debian 12) |
|---|---|---|---|---|
| Node 24.16.0 | ✓ | ✓ | ✓ | ✓ (base image) |
| npm 11.x | ✓ | ✓ | ✓ | ✓ |
| Docker 24+ | ✓ (Desktop) | ✓ (Engine) | ✓ (Desktop) | N/A (host) |
| Prisma 6.16.2 | ✓ | ✓ | ✓ (arm64) | ✓ (linux-musl) |
| `bcrypt` 6.0 native | ✓ (build tools) | ✓ (build-essential) | ✓ (Xcode CLI) | ✓ (base image) |

### 17.11 Upgrade Policy

**MANDATORY:** No toolchain component is upgraded during Phase 4.5 execution except Node.js to the version already pinned (`24.16.0`) for the purpose of enforcing F01. All other upgrades are deferred to post-Phase 4.5.

### 17.12 Downgrade Policy

**MANDATORY:** No toolchain component is downgraded during Phase 4.5. A requirement to downgrade constitutes a Class E stop condition.

---

## Section 18: CI/CD Standards

### 18.1 GitHub Actions

Phase 4.5 targets GitHub Actions as the sole CI platform. No alternative CI platform (Jenkins, GitLab CI, CircleCI) is in scope.

Workflow files reside in `.github/workflows/`. The file created by F07 is `ci.yml`. A secondary `security.yml` is RECOMMENDED but not required for F07 acceptance.

### 18.2 Workflow Philosophy

| Principle | Classification | Detail |
|---|---|---|
| CI validates quality, not deployment | MANDATORY | No deployment steps in Phase 4.5 CI |
| Every PR to `main` triggers CI | MANDATORY | `on: pull_request: branches: [main]` |
| Every push to `main` triggers CI | MANDATORY | `on: push: branches: [main]` |
| CI is the final authority on cross-platform quality | MANDATORY | Local quality gates are necessary but not sufficient |
| No workflow bypasses quality gates | MANDATORY | No `if: false` or skipped steps on protected branches |

### 18.3 Matrix Builds

**MANDATORY:** The CI pipeline MUST run on all three primary/secondary operating systems:

| Matrix Target | Runner | Priority | Required |
|---|---|---|---|
| `ubuntu-latest` | `ubuntu-24.04` | PRIMARY | MANDATORY |
| `windows-latest` | `windows-2022` | PRIMARY | MANDATORY |
| `macos-latest` | `macos-14` (arm64) | SECONDARY | MANDATORY |

`fail-fast: true` is MANDATORY. When any matrix job fails, all remaining jobs are cancelled. This prevents wasted runner minutes on already-failing branches.

### 18.4 Ubuntu Matrix Job

| Step | Standard |
|---|---|
| `actions/checkout@v4` | `fetch-depth: 1` |
| `actions/setup-node@v4` | `node-version-file: '.nvmrc'`; `cache: 'npm'` |
| `npm ci` | With `--engines-strict` |
| `npx prisma generate` | With placeholder `DATABASE_URL` |
| `npm run build` | Must exit 0 |
| `npm run lint` | Must exit 0, 0 errors |
| `npm run test` | Must exit 0; 482/482 |
| `npx prisma validate` | Must exit 0 |
| `npm audit --audit-level=high` | Must exit 0 |

### 18.5 Windows Matrix Job

Same steps as Ubuntu (§18.4). Windows-specific considerations:

| Item | Handling |
|---|---|
| Script execution (`scripts/*.sh`) | Not executed on Windows CI; `.ps1` equivalents cover Windows |
| `node_modules/.bin/` paths | Avoided; `npx` used instead |
| Line endings in checkout | `.gitattributes` ensures LF before Windows CI runs |
| PowerShell default execution policy | `powershell -NonInteractive` in workflow steps |

### 18.6 macOS Matrix Job

Same steps as Ubuntu (§18.4). macOS-specific considerations:

| Item | Handling |
|---|---|
| `bcrypt` arm64 compilation | Handled by `npm ci` with Xcode CLI tools (present on `macos-14` runner) |
| Docker | Not available on macOS GitHub Actions runners — Docker-dependent tests are not run in macOS CI |
| Script execution (`scripts/*.sh`) | Executed; POSIX sh compatible |

### 18.7 Caching

| Cache | Key Strategy | Managed By |
|---|---|---|
| npm cache | `${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}` | `actions/setup-node` with `cache: 'npm'` |
| `tsconfig.tsbuildinfo` | `${{ runner.os }}-tsbuildinfo-${{ hashFiles('src/**/*.ts') }}` | `actions/cache@v4` (RECOMMENDED) |

Cache invalidation: `package-lock.json` change invalidates npm cache. Any `.ts` file change invalidates TypeScript incremental cache.

### 18.8 Artifacts

| Artifact | Runner | Retention | Classification |
|---|---|---|---|
| Coverage report (`coverage/`) | `ubuntu-latest` only | 7 days | RECOMMENDED |
| Build output (`dist/`) | None | N/A — not uploaded | MANDATORY (not uploaded in Phase 4.5) |

Coverage artifacts are uploaded only on `ubuntu-latest` to avoid triplicate uploads.

### 18.9 Quality Gates in CI

The CI pipeline enforces the same quality gates as local development, plus additional CI-only checks:

| Gate | Local | CI | Classification |
|---|---|---|---|
| `npm run build` | MANDATORY | MANDATORY | MANDATORY |
| `npm run lint` | MANDATORY | MANDATORY | MANDATORY |
| `npm run test` | MANDATORY | MANDATORY | MANDATORY |
| `npx prisma validate` | MANDATORY | MANDATORY | MANDATORY |
| `npm audit --audit-level=high` | RECOMMENDED | MANDATORY | MANDATORY in CI |
| LF line ending assertion | OPTIONAL | MANDATORY | MANDATORY in CI |
| Execute bit on `.sh` files | N/A | MANDATORY (Ubuntu CI) | MANDATORY |

### 18.10 Branch Protection

Branch protection on `main` is a GitHub repository setting, not a workflow file. The following protection rules MUST be configured:

| Rule | Value |
|---|---|
| Require status checks before merge | Enabled |
| Required checks | `CI / build-and-test (ubuntu-latest)` minimum |
| Require branches up to date | Enabled |
| Restrict force pushes | Enabled |
| Allow deletions | Disabled |

### 18.11 Release Validation

Phase 4.5 does not implement release automation. The `release` workflow is deferred to a future phase. This section is reserved.

### 18.12 Failure Policy

| Failure | CI Behavior | Developer Action |
|---|---|---|
| Single matrix job fails | `fail-fast` cancels remaining jobs | Investigate failing OS; reproduce locally |
| Lint failure | Step fails; job fails; matrix cancels | `npm run lint` locally; fix |
| Test failure | Step fails; job fails; matrix cancels | `npm run test -- --testPathPattern=<failing>` locally |
| Audit failure | Step fails | Investigate vulnerability; update or document exception |
| `prisma validate` failure | Step fails | Verify `prisma/schema.prisma` was not modified |

### 18.13 Recovery

CI failures trigger Class A stop conditions when they block a feature completion. Recovery follows the Class A workflow (§7.2): identify, diagnose, fix, re-run gates, commit.

A CI failure on a feature commit that cannot be reproduced locally constitutes a cross-platform incompatibility and may escalate to Class E.

### 18.14 Validation

F07 (CI Pipeline) is COMPLETE only when:

| Check | Result |
|---|---|
| `ci.yml` is valid YAML | PASS |
| CI passes on `ubuntu-latest` | PASS |
| CI passes on `windows-latest` | PASS |
| CI passes on `macos-latest` | PASS |
| `npm audit` passes | PASS |
| Branch protection enabled on `main` | CONFIRMED |
| No credentials in workflow files | CONFIRMED |
| All actions pinned to major version | CONFIRMED |

---

## Section 19: Developer Experience Standards

### 19.1 `.editorconfig`

**MANDATORY:** `.editorconfig` MUST be at the repository root and must contain at minimum:

| Directive | Value | Classification |
|---|---|---|
| `root = true` | Required | MANDATORY |
| `charset = utf-8` | UTF-8 without BOM | MANDATORY |
| `end_of_line = lf` | LF | MANDATORY |
| `indent_style = space` | Space | MANDATORY |
| `indent_size = 2` | 2 spaces | MANDATORY |
| `insert_final_newline = true` | POSIX standard | MANDATORY |
| `trim_trailing_whitespace = true` | All files except `.md` | MANDATORY |

### 19.2 `.gitattributes`

**MANDATORY:** `.gitattributes` MUST be at the repository root. Governance is defined in §13.4. Additional MANDATORY rules:

| Rule | Detail |
|---|---|
| `* text=auto eol=lf` as first rule | Catch-all normalization |
| Binary files explicitly declared | `.png`, `.jpg`, `.tsbuildinfo` |
| Post-commit normalization performed | `git rm --cached -r . && git reset --hard` (F02 implementation step) |

### 19.3 `.vscode/` Configuration

**MANDATORY:** Four files must be committed under `.vscode/`:

| File | Purpose |
|---|---|
| `settings.json` | Workspace formatter, linter, encoding settings |
| `tasks.json` | Named task aliases for npm scripts and Docker commands |
| `launch.json` | Debug profiles for NestJS and Jest |
| `extensions.json` | Extension recommendations |

No other files may be committed to `.vscode/` in Phase 4.5.

### 19.4 Tasks Standards

**MANDATORY:** The following tasks MUST appear in `.vscode/tasks.json`:

| Label | Command |
|---|---|
| `Build` | `npm run build` — default build task |
| `Start Dev` | `npm run start:dev` |
| `Test` | `npm run test` — default test task |
| `Lint` | `npm run lint` |
| `Docker Up` | `docker compose -f docker-compose.dev.yml up -d` |
| `Docker Down` | `docker compose -f docker-compose.dev.yml down` |
| `Doctor` | `bash scripts/doctor.sh` with Windows override |
| `Prisma Generate` | `DATABASE_URL="..." npx prisma generate` |
| `Prisma Validate` | `DATABASE_URL="..." npx prisma validate` |

Tasks that invoke shell scripts MUST provide a `windows` platform override with the PowerShell equivalent.

### 19.5 Debug Standards

**MANDATORY:** Two debug profiles MUST appear in `.vscode/launch.json`:

| Profile | Runtime | Key Setting |
|---|---|---|
| `Debug NestJS` | `npm run start:debug` | `envFile: "${workspaceFolder}/.env"` |
| `Debug Current Test` | `npx jest --runInBand` | `envFile: "${workspaceFolder}/.env"`; `--testPathPattern: "${relativeFile}"` |

**MANDATORY:** Debug profiles MUST use `runtimeExecutable: "npx"` with `runtimeArgs: ["jest", ...]` for test debugging. Direct `node_modules/.bin/jest` references are prohibited (cross-platform failure risk, SC-013 surface).

### 19.6 Formatting Standards

| Standard | Configuration | Classification |
|---|---|---|
| Prettier as default formatter | `"editor.defaultFormatter": "esbenp.prettier-vscode"` | MANDATORY |
| Format on save | `"editor.formatOnSave": true` | MANDATORY |
| ESLint auto-fix on save | `"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }` | MANDATORY |
| Tab size | `"editor.tabSize": 2` | MANDATORY |
| Insert spaces | `"editor.insertSpaces": true` | MANDATORY |

A `.prettierrc` file at the repository root is RECOMMENDED. If absent, Prettier defaults apply. Phase 4.5 does not add a `.prettierrc` if one does not exist — its absence is a known gap documented in the IEF (document 07 §8.1). The existing Prettier behavior is not disrupted.

### 19.7 Extension Standards

**MANDATORY extensions in `.vscode/extensions.json`:**

| Extension ID | Purpose |
|---|---|
| `dbaeumer.vscode-eslint` | ESLint |
| `esbenp.prettier-vscode` | Prettier |
| `prisma.prisma` | Prisma schema |
| `EditorConfig.EditorConfig` | EditorConfig |
| `ms-vscode-remote.remote-containers` | DevContainer |
| `ms-azuretools.vscode-docker` | Docker |

Extensions listed in `unwantedRecommendations` MUST NOT include extensions from the MANDATORY list above.

### 19.8 Workspace Recommendations

The `extensions.json` `recommendations` field serves as the project's official extension list. Developers are prompted to install listed extensions on first open. Installation is not mandatory at the VSCode level, but these extensions are required for a productive development workflow.

### 19.9 Logging Standards (Developer)

In development (`NODE_ENV=development`), the application uses `nestjs-pino` in pretty-printed mode. No changes to logging configuration are made in Phase 4.5. `LOG_LEVEL` is documented in `.env.example` (F03) with default value `info`.

### 19.10 Diagnostics

The doctor script (`scripts/doctor.sh`) is the primary diagnostic tool. Its output format (§16.4 and §16.5) is the standard for all environment diagnostics in Phase 4.5.

### 19.11 Performance Standards (Developer)

| Operation | Target | Classification |
|---|---|---|
| `npm run build` (warm, incremental) | < 30 seconds | RECOMMENDED |
| `npm run test` | < 60 seconds | RECOMMENDED |
| Docker PostgreSQL reaches healthy | < 30 seconds | RECOMMENDED |
| Doctor script completion | < 10 seconds | RECOMMENDED |
| DevContainer build (first) | < 5 minutes | RECOMMENDED |

### 19.12 Developer Onboarding

The onboarding experience is governed by F09 (Developer Documentation). Standards:

| Standard | Classification | Detail |
|---|---|---|
| Zero-to-running in < 15 minutes | MANDATORY | Verified end-to-end by at least one developer |
| Single `README.md` entry point | MANDATORY | All onboarding starts here |
| Maximum 5 commands to reach running app | RECOMMENDED | More steps indicate toolchain gaps |
| Platform-specific instructions isolated | MANDATORY | Windows and Unix steps clearly delineated |

### 19.13 Validation

F09 (Developer Documentation) requires validating that all developer experience artifacts function correctly:

| Check | Method |
|---|---|
| All VSCode tasks run without error | Manual — Command Palette |
| Debug profiles launch | Manual — F5 |
| Prettier formats on save | Manual — edit a `.ts` file |
| ESLint shows inline errors | Manual — introduce violation |
| Doctor script matches specified output format | Automated via CI dry-run |
| Onboarding verified end-to-end | Manual — sign-off |

---

## Section 20: Documentation Standards

### 20.1 Feature Reports

Every Phase 4.5 feature MUST produce a Feature Report (`reports/FXX_REPORT.md`) before the feature is declared COMPLETE.

**MANDATORY sections in every Feature Report:**

| Section | Content |
|---|---|
| Header table | Feature, Status, Commit, Date, Specification reference |
| Summary | What the feature implements; which blocker(s) it resolves |
| Files Created | All new files with their purpose |
| Files Modified | All modified files with the nature of the change |
| Files NOT Modified | Confirmation that protected files are unchanged |
| Implementation Details | Technical description of each artifact |
| Engineering Decisions | Reference to EDR if any; "None" if not applicable |
| Quality Gates | Gate, command, result for all four gates |
| Cross-Platform Blocker Resolution | Which CPB items are resolved |
| Repository Health | Commit, build, lint, test count, Prisma |

### 20.2 Engineering Decision Reports

EDR structure and policy are defined in §8 (Part 1). This section adds documentation standards:

| Standard | Classification | Detail |
|---|---|---|
| EDR committed before re-implementation after deviation | MANDATORY | Never implement the deviation before committing the EDR |
| EDR committed in same PR / commit chain as the feature | MANDATORY | Not a separate PR |
| EDR references the IEF section it modifies | MANDATORY | Cite document number and section |
| "SUPERSEDED" status when later decision overrides | MANDATORY | Old EDR updated; new EDR linked |

### 20.3 Progress Tracking

`09_PLATFORM_PROGRESS_TEMPLATE.md` is the single source of truth for Phase 4.5 progress. Update standards:

| Standard | Classification | Detail |
|---|---|---|
| Updated on every feature completion | MANDATORY | Before feature is declared COMPLETE |
| Feature status changes: PENDING → IN PROGRESS → DONE | MANDATORY | Never skip statuses |
| Dashboard summary updated on every feature | MANDATORY | `Features DONE` count, `Current Commit` |
| Engineering Decision Register updated per feature | MANDATORY | Even if no new decisions |
| Blocking Issues Register updated per feature | MANDATORY | Empty if no blockers |

### 20.4 Acceptance Reports

The Platform Final Acceptance (`10_PLATFORM_FINAL_ACCEPTANCE.md`) is populated at F10. Standards:

| Standard | Classification | Detail |
|---|---|---|
| Every acceptance criterion has a binary result | MANDATORY | PASS or FAIL; no "partial" |
| All failing criteria documented with resolution | MANDATORY | No unresolved FAIL allowed for completion |
| Signed off by Chief Architect | MANDATORY | Date and statement required |
| Post-closure actions completed | MANDATORY | KEB and FEOS updates confirmed |

### 20.5 Implementation Reports (PMIC)

The Platform Master Implementation Contract (this document) is extended:

| Standard | Classification | Detail |
|---|---|---|
| Part 1 never rewritten after completion | MANDATORY | Append-only after each Part |
| Part 2 never rewritten after completion | MANDATORY | Idem |
| Sections not duplicated across Parts | MANDATORY | Cross-reference allowed; content not repeated |
| PMIC is the master governance document | MANDATORY | All feature-level governance references PMIC |

### 20.6 Naming Standards

| Document Type | Naming Pattern | Location |
|---|---|---|
| Feature Report | `FXX_REPORT.md` | `docs/execution/platform/reports/` |
| Engineering Decision Report | `ENGINEERING_DECISION_REPORT_FXX.md` | `docs/execution/platform/` |
| IEF Specification | `XX_<TITLE>.md` | `docs/execution/platform/` |
| PMIC | `PLATFORM_MASTER_IMPLEMENTATION_CONTRACT.md` | `docs/execution/platform/` |
| Platform Final Report | `PLATFORM_IMPLEMENTATION_FINAL_REPORT.md` | `docs/execution/platform/` |

### 20.7 Storage Policy

All Phase 4.5 documentation lives exclusively in `docs/execution/platform/`. Documentation committed outside this path for Phase 4.5 purposes is an anomaly that must be justified in an Engineering Decision.

### 20.8 Version Policy

Documentation files are not individually versioned beyond what git history provides. The PMIC uses an explicit `Version` field and `| Version | Change | Date |` table (see §1.9). Individual feature reports do not require version tracking.

### 20.9 Cross-References

| Standard | Classification | Detail |
|---|---|---|
| Feature reports reference IEF specification documents | MANDATORY | Section-level citation |
| EDRs reference IEF sections they supersede | MANDATORY | Document and section number |
| PMIC sections reference IEF and FEOS by document name | MANDATORY | No bare "the specification" |
| Progress template references feature reports | MANDATORY | Link per completed feature |

### 20.10 Review Policy

| Document | Reviewer | Timing |
|---|---|---|
| Feature Report | Platform Engineer | At feature completion |
| Engineering Decision Report | Engineering Governance Lead | Before implementation of deviation |
| Progress Template | Technical Program Manager | At each feature completion |
| PMIC (per Part) | Chief Architect | At each Part boundary |
| Final Acceptance | Chief Architect + QA Director | At F10 completion |

---

## Section 21: Quality Gate Standards

### 21.1 Build Gate

| Standard | Classification | Detail |
|---|---|---|
| `npm run build` exits 0 | MANDATORY | No TypeScript errors |
| `dist/` directory created | MANDATORY | Build output exists |
| `deleteOutDir: true` in `nest-cli.json` | INHERITED | Existing configuration; not modified |
| Build must be clean (not incremental) on first run per feature | RECOMMENDED | `rm -rf dist` before first gate run |

### 21.2 Lint Gate

| Standard | Classification | Detail |
|---|---|---|
| `npm run lint` exits 0 | MANDATORY | 0 errors |
| Auto-fix permitted | PERMITTED | ESLint `--fix` is part of the npm script |
| Warnings do not fail the gate | PERMITTED | Only errors block |
| New ESLint ignores require justification | MANDATORY | Comment with reason; no blanket ignores |

### 21.3 Test Gate

| Standard | Classification | Detail |
|---|---|---|
| `npm run test` exits 0 | MANDATORY | |
| All 482 tests pass | MANDATORY | Count MUST NOT decrease |
| New tests are NOT added in Phase 4.5 | MANDATORY | Test files are frozen |
| Test isolation preserved | MANDATORY | No test depends on infrastructure state |
| `--testPathPattern` for individual suite runs | PERMITTED | Diagnostic use only; full suite runs before commit |

### 21.4 Prisma Validate Gate

| Standard | Classification | Detail |
|---|---|---|
| `DATABASE_URL="..." npx prisma validate` exits 0 | MANDATORY | |
| `DATABASE_URL` prefix required | MANDATORY | Project constraint |
| No real database required | CONFIRMED | `validate` is a static operation |
| Schema modification triggers stop condition | MANDATORY | SC-005 |

### 21.5 Quality Gate Execution Order

Gates MUST be executed in the following order before any feature commit:

```
1. npm run build
2. npm run lint
3. npm run test
4. DATABASE_URL="..." npx prisma validate
```

No gate may be skipped. Gates that depend on prior gates (e.g., lint may catch things build does not, and vice versa) are run in full regardless.

### 21.6 Failure Policy

| Gate | Failure Handling |
|---|---|
| Build fails | Stop; diagnose; fix TypeScript errors; re-run all four gates |
| Lint fails | Stop; apply fixes; re-run all four gates from the beginning |
| Tests fail | Stop; identify test(s); diagnose; if no source change is acceptable, stop condition SC-003 |
| Prisma fails | Stop; verify schema unchanged; stop condition SC-004 if schema was unintentionally modified |

### 21.7 Retry Policy

Quality gates do not have a retry policy. A gate that fails must be fixed, not retried. Intermittent failures in tests must be investigated and resolved. No `--retry` flag is used in production CI runs.

### 21.8 Acceptance Policy

A feature that has not passed all four quality gates CANNOT be declared COMPLETE under any circumstances. There are no exceptions to this rule.

### 21.9 Evidence Collection

For each feature, quality gate evidence is recorded in `reports/FXX_REPORT.md` under the "Quality Gates" section:

```markdown
| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS |
| Lint | `npm run lint` | PASS (0 errors) |
| Tests | `npm run test` | PASS — 482/482 |
| Prisma Validate | `DATABASE_URL="..." npx prisma validate` | PASS |
```

### 21.10 Quality Metrics

At Phase 4.5 completion, the following metrics must be true:

| Metric | Required Value |
|---|---|
| Test count | 482 (unchanged from Phase 4.5 entry) |
| Lint errors | 0 |
| TypeScript errors | 0 |
| Prisma schema validity | PASS |
| CI matrix failures | 0 (across all three OS targets) |

---

## Section 22: Commit Standards

### 22.1 Implementation Commit

The implementation commit contains all feature files. It MUST:

| Standard | Classification | Detail |
|---|---|---|
| Include all feature files in one commit | MANDATORY | No split implementation commits |
| Have a commit message matching `feat(platform/FXX): <description>` | MANDATORY | Naming convention §12.4 |
| Follow Conventional Commits format | MANDATORY | FEOS `10_GIT_GOVERNANCE.md` |
| Pass all four quality gates before creation | MANDATORY | Gates before commit, not after |
| Not include documentation files | RECOMMENDED | Documentation in separate commit |

### 22.2 Documentation Commit

The optional documentation commit contains only `reports/FXX_REPORT.md` and the updated `09_PLATFORM_PROGRESS_TEMPLATE.md`. It MUST:

| Standard | Classification | Detail |
|---|---|---|
| Message: `docs(platform/FXX): <description>` | MANDATORY | Naming convention §12.4 |
| Contain ONLY documentation files | MANDATORY | No implementation files in doc commit |
| Follow immediately after the implementation commit | MANDATORY | No other commits between implementation and documentation |

### 22.3 Commit Naming

Commit messages follow the Conventional Commits specification with the Phase 4.5 scope convention:

```
feat(platform/F02): repository hygiene — .gitattributes and .editorconfig
docs(platform/F02): F02 completion report and progress tracker update
docs(platform): PMIC Part 2 — infrastructure engineering standards
```

Multi-line commit bodies are PERMITTED and RECOMMENDED for implementation commits that warrant explanation.

### 22.4 Commit Structure

Each commit must satisfy:

| Property | Standard |
|---|---|
| Author | Current developer |
| Co-author line | `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` when AI-assisted |
| Signed | Per FEOS `10_GIT_GOVERNANCE.md` signing policy |
| Working tree state after commit | CLEAN |
| All gates pass on this commit | MANDATORY |

### 22.5 Commit Verification

After every commit, verify:

```
git status                              → clean working tree
git log --oneline -1                    → commit appears in history
npm run build                           → PASS (gates verified again)
```

The third verification (re-running build) is RECOMMENDED after every commit to confirm the commit captured all intended changes.

### 22.6 Forbidden Commits

| Commit Type | Reason Forbidden |
|---|---|
| Commits with failing quality gates | Core invariant violation |
| `wip:` or `tmp:` commits to `main` | No work-in-progress on protected branch |
| Merge commits (during Phase 4.5) | Linear history required; rebase if needed |
| Empty commits | No informational value |
| Commits modifying protected paths | SC-005 architecture violation |
| Force-pushed commits | FEOS `10_GIT_GOVERNANCE.md` |
| Amended pushed commits | FEOS `10_GIT_GOVERNANCE.md` |

### 22.7 Exception Policy (Third Commit)

As defined in §5.6: a third commit per feature is permitted only as a Commit Exception — a quality gate fix discovered after the implementation commit. It must be documented in `FXX_REPORT.md` under "Commit Exception" with the root cause and fix.

### 22.8 History Integrity

The git history for Phase 4.5 MUST be linear on `main`. No merge commits, no orphaned refs, no force-pushed branches. History integrity is verified in F10 (Platform Final Validation).

---

## Section 23: Feature Execution Template

Every Phase 4.5 feature (F02–F10) MUST follow this execution template. Deviation from any MANDATORY step is a stop condition.

### 23.1 Preparation

| Step | Action | Classification |
|---|---|---|
| P-01 | Review IEF specification documents for this feature | MANDATORY |
| P-02 | Review PMIC Part 1 stop conditions and recovery policy | MANDATORY |
| P-03 | Review all previous feature reports (`reports/FXX_REPORT.md`) for dependencies | MANDATORY |
| P-04 | Review Engineering Decision Reports from prior features for relevant precedent | MANDATORY |
| P-05 | Review current progress template (`09_PLATFORM_PROGRESS_TEMPLATE.md`) | MANDATORY |
| P-06 | Set feature status to IN PROGRESS in progress template | MANDATORY |

### 23.2 Repository Validation

| Step | Action | Classification |
|---|---|---|
| RV-01 | `git status` — confirm clean working tree | MANDATORY |
| RV-02 | `git log --oneline -3` — confirm last commit is expected | MANDATORY |
| RV-03 | `npm run build` — confirm baseline PASS | MANDATORY |
| RV-04 | `npm run lint` — confirm baseline PASS | MANDATORY |
| RV-05 | `npm run test` — confirm 482/482 PASS | MANDATORY |
| RV-06 | `DATABASE_URL="..." npx prisma validate` — confirm baseline PASS | MANDATORY |
| RV-07 | Confirm all prerequisite features are DONE in progress template | MANDATORY |

If any RV step fails, execution stops and the stop condition protocol (§6) is invoked before any implementation begins.

### 23.3 Implementation

| Step | Action | Classification |
|---|---|---|
| I-01 | Create or modify only files within the feature's defined scope | MANDATORY |
| I-02 | Apply all standards from Sections 12–22 to every file created | MANDATORY |
| I-03 | Apply cross-platform standards (§13) to every file | MANDATORY |
| I-04 | If a conflict with IEF or FEOS is discovered: STOP; create EDR; resolve | MANDATORY |
| I-05 | If a stop condition is triggered: STOP; classify; follow recovery protocol | MANDATORY |
| I-06 | Do not begin the next feature or make cross-feature changes | MANDATORY |

### 23.4 Documentation

| Step | Action | Classification |
|---|---|---|
| D-01 | Create `reports/FXX_REPORT.md` with all MANDATORY sections | MANDATORY |
| D-02 | Create `ENGINEERING_DECISION_REPORT_FXX.md` if any deviation occurred | MANDATORY |
| D-03 | Update `09_PLATFORM_PROGRESS_TEMPLATE.md` — status, commit, quality gates | MANDATORY |

### 23.5 Quality Gates

| Step | Action | Classification |
|---|---|---|
| QG-01 | `npm run build` → must exit 0 | MANDATORY |
| QG-02 | `npm run lint` → must exit 0, 0 errors | MANDATORY |
| QG-03 | `npm run test` → must exit 0, 482/482 | MANDATORY |
| QG-04 | `DATABASE_URL="..." npx prisma validate` → must exit 0 | MANDATORY |

If any gate fails: diagnose; fix; re-run all four gates from QG-01.

### 23.6 Commit

| Step | Action | Classification |
|---|---|---|
| C-01 | Stage all implementation files: `git add <files>` | MANDATORY |
| C-02 | Commit: `feat(platform/FXX): <description>` | MANDATORY |
| C-03 | Verify commit appeared in `git log` | MANDATORY |
| C-04 | Stage documentation files: `git add reports/FXX_REPORT.md 09_PLATFORM_PROGRESS_TEMPLATE.md` | MANDATORY |
| C-05 | Commit: `docs(platform/FXX): <description>` | MANDATORY |
| C-06 | Stage and commit EDRs if present | MANDATORY |
| C-07 | Verify `git status` is clean | MANDATORY |

### 23.7 Verification

| Step | Action | Classification |
|---|---|---|
| V-01 | Confirm feature status is DONE in progress template | MANDATORY |
| V-02 | Confirm feature report is committed | MANDATORY |
| V-03 | Confirm no protected files were modified | MANDATORY |
| V-04 | Confirm quality gates are PASS on final commit | MANDATORY |

### 23.8 Transition

| Step | Action | Classification |
|---|---|---|
| T-01 | Verify all completion requirements from §25 are satisfied | MANDATORY |
| T-02 | Confirm no stop condition is active | MANDATORY |
| T-03 | Proceed to next feature in dependency order (§24) | MANDATORY |

### 23.9 Completion

A feature is COMPLETE when all steps P-01 through T-03 are satisfied and documented. A feature that has executed some but not all steps is IN PROGRESS regardless of implementation state.

---

## Section 24: Feature Dependency Rules

### 24.1 Dependency Graph

```
F01 (COMPLETE)
  └─ F02 (Repository Hygiene)
       └─ F03 (Environment Standardization)
            └─ F04 (Docker Development Environment)
                 ├─ F05 (Bootstrap Scripts) ──┐
                 │                             ├─ F06 (DevContainer)
                 └─────────────────────────────┘
                                                    └─ F07 (CI Pipeline)
                                                         └─ F08 (Cross-Platform Validation)
                                                              └─ F09 (Developer Documentation)
                                                                   └─ F10 (Platform Final Validation)
```

Note: F06 depends on BOTH F04 (Docker topology) and F05 (Bootstrap scripts, for DevContainer `postCreateCommand` patterns).

### 24.2 Dependency Validation

Before each feature begins, the following validation is performed:

| Feature | Required Prior Features | Validation Method |
|---|---|---|
| F02 | F01 DONE | Progress template check |
| F03 | F02 DONE | Progress template check |
| F04 | F03 DONE | Progress template check |
| F05 | F04 DONE | Progress template check |
| F06 | F04 DONE AND F05 DONE | Progress template check |
| F07 | F01–F06 all DONE | Progress template check |
| F08 | F07 DONE | Progress template check + CI green |
| F09 | F04, F05, F06, F07, F08 all DONE | Progress template check |
| F10 | F01–F09 all DONE | Progress template check |

### 24.3 Execution Order

The dependency order in §24.1 is the MANDATORY execution order. The only permitted deviation is documenting via Engineering Decision that a different order satisfies all dependencies. Such a deviation is a Class B stop condition requiring architect approval.

### 24.4 Skip Prevention

**MANDATORY:** No feature may be skipped. A feature that appears unnecessary (e.g., "F03 is trivial — can we go to F04 directly?") must still be implemented and reported. Features may be minimal but must be complete and documented.

### 24.5 Circular Dependency Policy

The Phase 4.5 feature graph is acyclic by design. If a circular dependency is discovered during implementation, it is a Class D stop condition (unexpected dependency graph, SC-010). Halt; document; resolve before continuing.

### 24.6 Feature Readiness

A feature is READY to begin when:

| Condition | State |
|---|---|
| All dependency features are DONE | Verified in progress template |
| Repository is CLEAN | `git status` clean |
| All quality gates PASS on HEAD | Verified per §23.2 |
| No active stop condition | §6 check |
| PMIC Part 2 is committed and available | This document |

### 24.7 Blocking Policy

If a feature is blocked (stop condition active), the entire Phase 4.5 execution halts. No subsequent feature may begin while a stop condition is unresolved. The blocking feature remains IN PROGRESS until the stop condition is resolved.

---

## Section 25: Feature Acceptance Rules

### 25.1 Definition of Ready

A feature is READY TO IMPLEMENT when:

- [ ] All predecessor features are DONE
- [ ] IEF specification for this feature has been reviewed
- [ ] Repository quality gates pass on HEAD
- [ ] No active stop condition exists
- [ ] Feature status set to IN PROGRESS in progress template

### 25.2 Definition of Done

A feature is DONE (implementation complete, not yet formally accepted) when:

- [ ] All files in feature scope are created or modified per specification
- [ ] All four quality gates pass
- [ ] Implementation commit exists in git log
- [ ] Documentation commit exists in git log (or combined commit)
- [ ] `reports/FXX_REPORT.md` committed
- [ ] Engineering Decision Reports committed (if applicable)
- [ ] `09_PLATFORM_PROGRESS_TEMPLATE.md` updated and committed
- [ ] No protected files were modified

### 25.3 Definition of Complete

A feature is COMPLETE (formally accepted) when DONE AND:

- [ ] Feature status is DONE in `09_PLATFORM_PROGRESS_TEMPLATE.md`
- [ ] Feature report cross-references all IEF specification sections it implements
- [ ] Quality gate evidence is documented in feature report
- [ ] All cross-platform blockers resolved by this feature are marked resolved
- [ ] No stop condition is active
- [ ] Repository health is confirmed (§12.10)

### 25.4 Required Documentation

| Document | Required For | Classification |
|---|---|---|
| `reports/FXX_REPORT.md` | Every feature | MANDATORY |
| `09_PLATFORM_PROGRESS_TEMPLATE.md` update | Every feature | MANDATORY |
| `ENGINEERING_DECISION_REPORT_FXX.md` | Features with deviations | MANDATORY when applicable |

### 25.5 Required Evidence

| Evidence | Collection Method | Classification |
|---|---|---|
| Build PASS | `npm run build` exit code | MANDATORY |
| Lint PASS (0 errors) | `npm run lint` output | MANDATORY |
| Test PASS (482/482) | `npm run test` output | MANDATORY |
| Prisma PASS | `npx prisma validate` output | MANDATORY |
| Git commit hash | `git log --oneline -1` | MANDATORY |
| Clean working tree | `git status` | MANDATORY |

### 25.6 Required Quality Gates

As defined in §21. All four gates (build, lint, tests, prisma validate) must pass. No exceptions.

### 25.7 Repository Validation

After feature completion, repository validation confirms:

```
git status          → clean
git log             → feature commit(s) visible; no orphaned commits
npm run build       → PASS
npm run lint        → PASS
npm run test        → 482/482 PASS
npx prisma validate → PASS
```

### 25.8 Acceptance Authority

| Feature | Acceptance Authority |
|---|---|
| F02–F09 | Chief Platform Engineer (self-certified via quality gates and feature report) |
| F10 | Chief Software Architect + QA Director (formal sign-off on `10_PLATFORM_FINAL_ACCEPTANCE.md`) |

Platform engineer self-certification is governed by the completion requirements in this section. Falsifying a quality gate result or marking a feature DONE while gates fail is a governance violation of the highest severity.

---

---

# Part 3 — Execution Orchestration, Final Acceptance & Platform Closure

---

## Section 26: Execution Orchestration

### 26.1 Purpose

Part 3 transforms the PMIC from a standards document into an active execution authority. The sections that follow govern every aspect of Phase 4.5 from the first moment of F02 preparation through the final Platform Closure event. This document is the single authoritative reference for execution decisions during that period.

The execution orchestration defined here is designed to function with minimal human intervention on the transition path between features. It maximizes forward momentum while maintaining the invariants established in Parts 1 and 2.

### 26.2 Execution Lifecycle

The Phase 4.5 execution lifecycle has six phases:

| Phase | Name | Entry Condition | Exit Condition |
|---|---|---|---|
| L-1 | Initialized | PMIC Part 3 committed | F02 preparation begins |
| L-2 | Active Execution | F02 started | F09 complete |
| L-3 | Final Validation | F10 started | F10 complete |
| L-4 | Certification | F10 complete | Repository Certification issued |
| L-5 | Acceptance | Certification issued | Final Acceptance signed |
| L-6 | Closed | Final Acceptance signed | Archive complete |

The lifecycle is strictly sequential. No phase may be entered before its entry condition is satisfied. No phase may be exited until its exit condition is met.

### 26.3 Execution State Machine

At any moment, Phase 4.5 execution is in exactly one of the following states:

| State | Code | Description |
|---|---|---|
| ACTIVE | ACT | A feature is IN PROGRESS; no stop condition active |
| PAUSED | PAU | Stop condition active; recovery in progress |
| BLOCKED | BLK | Class C, D, or E stop condition; architect intervention required |
| TRANSITIONING | TRN | Feature just completed; transition validation running |
| CERTIFYING | CRT | F10 complete; certification workflow running |
| ACCEPTING | ACC | Certification issued; final acceptance workflow running |
| CLOSED | CLO | Phase 4.5 complete; platform closed |

State transitions are governed by the rules in §29. No state may be skipped. The BLOCKED state requires explicit architect resolution before returning to ACTIVE.

### 26.4 Feature Lifecycle

Every Phase 4.5 feature passes through these states in order:

```
PENDING → READY → IN PROGRESS → DONE → COMPLETE
```

| State | Definition |
|---|---|
| PENDING | Feature exists; prerequisite features not yet DONE |
| READY | All prerequisites DONE; quality gates PASS on HEAD; no active stop condition |
| IN PROGRESS | Feature implementation begun; §23.1 preparation complete |
| DONE | All implementation and documentation committed; quality gates PASS |
| COMPLETE | Formally accepted per §25.3; transition to next feature authorized |

No feature may move directly from PENDING to IN PROGRESS. The READY state is a mandatory validation gate. A feature cannot be COMPLETE until it is first DONE.

### 26.5 Execution Authority

The execution authority hierarchy for Phase 4.5 is:

| Authority Level | Role | Scope |
|---|---|---|
| L1 — Supreme | FEOS | Inviolable engineering principles; cannot be overridden |
| L2 — Architectural | Chief Software Architect | Stop conditions Classes C–E; EDR approval; architecture decisions |
| L3 — Execution | Chief Platform Engineer | Feature execution; quality gate certification; self-certification F02–F09 |
| L4 — Governance | Engineering Governance Lead | Stop condition classification; EDR review; policy interpretation |
| L5 — Tracking | Technical Program Manager | Progress template; scheduling; velocity; escalation |
| L6 — Quality | QA Director | Final acceptance co-sign; quality evidence review |

### 26.6 Execution Responsibilities

| Responsibility | Owner | Frequency |
|---|---|---|
| Feature implementation | Chief Platform Engineer | Per feature |
| Quality gate execution | Chief Platform Engineer | Before every commit |
| Feature report authoring | Chief Platform Engineer | Per feature |
| Progress template updates | Technical Program Manager | Per feature |
| Stop condition classification | Engineering Governance Lead | On trigger |
| EDR authoring | Chief Platform Engineer | On deviation |
| EDR approval | Chief Software Architect | On submission |
| Transition validation | Chief Platform Engineer | Between features |
| Repository certification | Chief Software Architect | Post F10 |
| Final acceptance | Chief Software Architect + QA Director | Post certification |
| Platform closure | Chief Software Architect | Post acceptance |

### 26.7 Execution Ownership

The Chief Platform Engineer is the single execution owner for Phase 4.5 Features F02–F09. This role has full authority to implement, commit, report, and self-certify within the boundaries established by the PMIC, the IEF, FEOS, and the KEB. Authority that exceeds these boundaries requires escalation per §26.5.

The Chief Software Architect owns F10, Repository Certification, Final Acceptance, and Platform Closure. These phases require architectural judgment that cannot be self-certified at the platform engineer level.

---

## Section 27: Continuous Execution Engine

### 27.1 Automatic Feature Progression

Phase 4.5 employs a continuous execution model. When a feature satisfies all completion requirements (§25.3), execution progresses automatically to the next feature in the dependency graph (§24.1) without waiting for human authorization of the transition.

This automatic progression is the default. It is overridden only when:
- A stop condition is triggered (§6)
- A dependency is not satisfied (§24)
- Quality gates fail (§21.6)
- An Engineering Decision is required (§8)
- An explicit PAUSE is issued by the Chief Architect

In the absence of any override condition, the execution engine is always moving forward.

### 27.2 Execution Queue

The execution queue is the ordered list of features awaiting implementation. At Phase 4.5 initialization (L-1 → L-2 transition), the queue is:

```
F02 → F03 → F04 → F05 → F06 → F07 → F08 → F09 → F10
```

The queue is static. It cannot be reordered, extended, or shortened without an Engineering Decision at the architect level. Features are dequeued — moved to IN PROGRESS — only when their READY conditions are satisfied.

### 27.3 Execution Scheduling

Phase 4.5 does not enforce calendar scheduling at the feature level. Features are executed sequentially as capacity allows. The only scheduling constraint is the Phase 4.5 completion boundary, which is set by the organization and tracked in the progress template (§28.6).

The Technical Program Manager is responsible for monitoring execution velocity (§28.5) and alerting the Chief Architect when projected completion exceeds the boundary.

### 27.4 Repository Validation (Pre-Execution)

Before dequeuing any feature, the execution engine performs the repository validation defined in §23.2 (steps RV-01 through RV-07). This validation is not optional, not abbreviated, and not waived for features that appear trivial.

A repository validation failure halts the dequeue and triggers the stop condition protocol. A feature cannot enter IN PROGRESS on a repository that is not in a known-good state.

### 27.5 Dependency Validation

Before dequeuing any feature, the execution engine verifies the dependency state per §24.2. Each feature's prerequisite features must be in COMPLETE state (not merely DONE) in the progress template.

The distinction matters: a feature that is DONE has committed implementation and documentation but has not yet been formally accepted. Only COMPLETE features satisfy the dependency requirement. This prevents cascading partially-accepted features.

### 27.6 Execution Checkpoints

The execution engine requires explicit checkpoint confirmation at three points in every feature lifecycle:

| Checkpoint | Code | Trigger | Required Action |
|---|---|---|---|
| CP-1 | RV | Repository validation complete | Proceed or halt per §27.4 |
| CP-2 | QG | All four quality gates pass | Proceed to commit or halt per §21.6 |
| CP-3 | TC | Transition validation complete (§29) | Proceed to next feature or halt |

Each checkpoint is a synchronization point. Work that should have been caught at CP-1 cannot be deferred to CP-2, and work at CP-2 cannot be deferred to CP-3.

### 27.7 Automatic Continuation Policy

The execution engine continues automatically when:

| Condition | State |
|---|---|
| CP-3 (transition validation) passes for feature FXX | SATISFIED |
| Next feature FYY has no active stop condition | SATISFIED |
| Next feature FYY's dependencies are COMPLETE | SATISFIED |
| Repository quality gates pass on HEAD | SATISFIED |
| No pending Engineering Decisions for FYY | SATISFIED |
| Progress template updated for FXX completion | SATISFIED |
| Feature report committed for FXX | SATISFIED |
| Working tree is clean | SATISFIED |

When all eight conditions are SATISFIED simultaneously, automatic continuation to FYY is authorized without additional human approval.

### 27.8 Automatic Stop Policy

The execution engine stops automatically when any of the following occurs:

| Trigger | Stop Code | Severity |
|---|---|---|
| Quality gate failure | SC-001–SC-003 | Class A |
| Protected file modification | SC-005 | Class B |
| Engineering decision required | SC-007 | Class B |
| Architecture conflict discovered | SC-009 | Class C |
| Unexpected dependency graph | SC-010 | Class D |
| Platform limitation | SC-011–SC-014 | Class E |
| Missing prerequisite feature | — | Class B |
| Progress template inconsistency | — | Class A |
| No valid next feature in queue | — | Terminal (F09 complete) |
| F10 reached | — | L-2 → L-3 transition |

Automatic stops are not failures. They are the execution engine's self-protection mechanism. Resolving the stop condition and resuming execution is the normal path.

### 27.9 Automatic Recovery Entry

When a stop condition is resolved per the recovery protocol (§7), the execution engine re-enters the execution loop at the checkpoint immediately preceding the stop. It does not restart from the beginning of the feature or the beginning of the phase.

| Stop Class | Recovery Entry Point |
|---|---|
| Class A | QG — quality gates re-run in full |
| Class B | CP-1 — repository re-validated |
| Class C | CP-1 — repository re-validated after architect resolution |
| Class D | CP-1 — repository re-validated after graph resolution |
| Class E | Architect decision — may be CP-1 or feature re-scoped |

---

## Section 28: Progress Tracking

### 28.1 Progress Model

The Phase 4.5 progress model tracks execution state at two levels:

| Level | Granularity | Document | Owner |
|---|---|---|---|
| Feature | Per-feature status, quality gates, blockers | `09_PLATFORM_PROGRESS_TEMPLATE.md` | Technical Program Manager |
| Phase | Overall completion percentage, maturity, health | PMIC §28.6 (this document) | Chief Software Architect |

The two levels are synchronized at each feature completion. A discrepancy between them is a documentation inconsistency, which is a Class A stop condition.

### 28.2 Execution Status

The overall Phase 4.5 execution status is reported using a three-value signal:

| Signal | Meaning |
|---|---|
| GREEN | All features on track; no active stop conditions; quality gates PASS |
| AMBER | A Class A or B stop condition is active and in recovery; no blocking of phase completion projected |
| RED | A Class C, D, or E stop condition is active; architect intervention required; phase completion at risk |

Status is assessed and recorded in the progress template after each feature completion and after each stop condition resolution.

### 28.3 Feature Status

Feature status values and their transitions are defined in §26.4. The progress template (`09_PLATFORM_PROGRESS_TEMPLATE.md`) is the authoritative source of record for feature status. The PMIC does not duplicate feature-level status — it references the progress template.

### 28.4 Completion Percentage

Phase 4.5 completion is calculated as:

```
Completion % = (Features COMPLETE / 10) × 100
```

F01 enters the denominator as COMPLETE (it was accepted in the prior session). The 10-feature total is fixed. Adding or removing features from scope changes the denominator and requires an Engineering Decision.

| Features COMPLETE | Phase Completion |
|---|---|
| 1 (F01) | 10% |
| 3 | 30% |
| 5 | 50% |
| 7 | 70% |
| 9 | 90% |
| 10 | 100% |

100% feature completion does not equal Phase 4.5 closure. Repository Certification (§31), Platform Final Acceptance (§32), and Platform Closure (§33) are post-implementation activities that must complete after all features reach 100%.

### 28.5 Engineering Metrics

The following engineering metrics are tracked throughout Phase 4.5 and reported in the Platform Final Report (§36):

| Metric | Tracking Method | Frequency |
|---|---|---|
| Commits per feature | `git log` | Per feature |
| Quality gate cycles per feature | Feature report | Per feature |
| Stop conditions triggered | Progress template | Per event |
| Engineering Decisions issued | EDR register | Per EDR |
| Test count | `npm run test` output | Per feature |
| Lint errors resolved | `npm run lint` output | Per feature |
| Cross-platform blockers resolved | CPB register | Per feature |
| Time to complete per feature | Progress template timestamps | Per feature |

### 28.6 Repository Maturity

Repository maturity is tracked across the ten dimensions defined in §12.11. Maturity score is updated at each feature completion:

| Feature | Dimensions Advanced | Expected Score After |
|---|---|---|
| F01 (COMPLETE) | Node version governance | 17/100 → 20/100 |
| F02 | Line-ending governance, encoding | 20/100 → 30/100 |
| F03 | Secrets management, environment | 30/100 → 42/100 |
| F04 | Docker infrastructure | 42/100 → 55/100 |
| F05 | Onboarding quality | 55/100 → 65/100 |
| F06 | DevContainer, developer tooling | 65/100 → 73/100 |
| F07 | CI/CD maturity, cross-platform testing | 73/100 → 84/100 |
| F08 | Cross-platform validation | 84/100 → 90/100 |
| F09 | Documentation, onboarding | 90/100 → 95/100 |
| F10 | Acceptance, platform validation | 95/100 → 98/100 |

The gap between 98/100 and 100/100 represents known deferred items (§12.11) that are out of scope for Phase 4.5.

### 28.7 Execution Dashboard

The live execution dashboard is the Summary section of `09_PLATFORM_PROGRESS_TEMPLATE.md`. The following fields are updated at each feature completion:

| Dashboard Field | Update Trigger |
|---|---|
| Features DONE | Feature COMPLETE |
| Features IN PROGRESS | Feature enters IN PROGRESS |
| Blocking Issues | Stop condition triggered / resolved |
| Quality Gate | Post-completion verification |
| Current Commit | Post-commit |
| Phase Execution Status | Per §28.2 |

### 28.8 Tracking Responsibilities

| Responsibility | Owner | Classification |
|---|---|---|
| Update progress template after each feature | Technical Program Manager | MANDATORY |
| Review dashboard for consistency with PMIC | Chief Architect | Per Part |
| Escalate AMBER to RED when recovery stalls | Technical Program Manager | MANDATORY |
| Maintain Engineering Decisions Register | Engineering Governance Lead | MANDATORY |
| Maintain Blocking Issues Register | Technical Program Manager | MANDATORY |
| Archive final dashboard at Platform Closure | Documentation Architect | MANDATORY |

---

## Section 29: Automatic Transition Rules

### 29.1 Feature Completion Trigger

A feature transition is initiated when the Chief Platform Engineer signals that a feature is DONE (§25.2). The transition engine then validates the feature before promoting it to COMPLETE and authorizing the next feature.

A signal is implicit — it is the act of committing the feature report and updating the progress template with DONE status. No separate signal mechanism is required.

### 29.2 Transition Validation

Transition validation is a structured checklist executed between the DONE signal and the COMPLETE promotion. It covers five domains:

| Domain | Sections | Classification |
|---|---|---|
| Dependency verification | §29.3 | MANDATORY |
| Quality gate verification | §29.4 | MANDATORY |
| Repository validation | §29.5 | MANDATORY |
| Commit verification | §29.6 | MANDATORY |
| Documentation verification | §29.7 | MANDATORY |

All five domains must pass. A failure in any domain blocks the COMPLETE promotion and triggers stop condition SC-001 or the domain-specific stop condition.

### 29.3 Dependency Verification

Before marking a feature COMPLETE, verify:

| Check | Standard |
|---|---|
| All predecessor features are in COMPLETE state | Progress template confirms COMPLETE for all |
| No dependency feature is only DONE (not yet accepted) | DONE is insufficient — all must be COMPLETE |
| No circular dependency has emerged | §24.5 |
| Dependency graph unchanged from §24.1 | No additional dependencies introduced |

### 29.4 Quality Gate Verification

Before marking a feature COMPLETE, verify that the quality gates documented in the feature report represent the state of the current HEAD commit:

| Check | Standard |
|---|---|
| Feature report documents gate results for the implementation commit | Not a prior commit |
| Gate results are PASS for all four gates | Build, Lint, Tests (482/482), Prisma Validate |
| Tests count has not decreased from 482 | Strict minimum enforced |
| No lint errors present | Zero error tolerance |

### 29.5 Repository Validation

Before marking a feature COMPLETE:

| Check | Standard |
|---|---|
| `git status` is clean | No unstaged or staged changes |
| HEAD commit is the feature implementation commit (or documentation commit) | No uncommitted changes represent feature work |
| No unresolved merge conflicts | `git grep -r "<<<<<<" -- .` returns empty |
| No debug artifacts committed | `git log --name-only -1` inspection |
| Protected directories unchanged | `git diff HEAD~2 -- src/ prisma/ test/` |

### 29.6 Commit Verification

Before marking a feature COMPLETE:

| Check | Standard |
|---|---|
| Implementation commit exists with correct message format | `feat(platform/FXX): ...` |
| Documentation commit exists (or combined) | `docs(platform/FXX): ...` |
| No more than 3 commits for this feature | Commit exception policy §22.7 |
| If 3 commits used: Commit Exception documented in feature report | MANDATORY |
| Commit hash matches feature report | Exact match |

### 29.7 Documentation Verification

Before marking a feature COMPLETE:

| Check | Standard |
|---|---|
| `reports/FXX_REPORT.md` committed and contains all MANDATORY sections (§20.1) | Complete per template |
| `09_PLATFORM_PROGRESS_TEMPLATE.md` reflects DONE status with commit hash | Updated |
| All triggered EDRs are committed | `ENGINEERING_DECISION_REPORT_FXX.md` |
| Feature report references correct IEF specification sections | Citations valid |
| CPB register updated for any resolved blockers | Progress template §28.7 |

### 29.8 Transition Approval

Transition approval for F02–F09 is self-authorized by the Chief Platform Engineer when all transition validation checks in §29.2–§29.7 pass. No additional sign-off is required.

Transition from F09 → F10 (entering L-3 Final Validation) requires explicit acknowledgment from the Chief Software Architect before F10 begins. This is the single mandatory human checkpoint in the automatic execution model for features F02–F10.

### 29.9 Transition Workflow

```
DONE signal
  → Dependency verification (§29.3)
    [FAIL] → Stop condition → Recovery (§7)
    [PASS] → Quality gate verification (§29.4)
      [FAIL] → Stop condition → Recovery (§7)
      [PASS] → Repository validation (§29.5)
        [FAIL] → Stop condition → Recovery (§7)
        [PASS] → Commit verification (§29.6)
          [FAIL] → Stop condition → Recovery (§7)
          [PASS] → Documentation verification (§29.7)
            [FAIL] → Stop condition → Recovery (§7)
            [PASS] → COMPLETE promotion
              → Execution queue: dequeue next feature
              → Dependency validation (§27.5)
                → Repository validation (§27.4)
                  → Next feature enters IN PROGRESS
```

---

## Section 30: Feature Completion Workflow

Section 30 consolidates the execution steps from §23 into a single authoritative workflow specification. Where §23 is prescriptive (each step and its classification), this section is narrative — it describes what must happen and why at each phase of a feature's lifecycle.

### 30.1 Preparation

Preparation is a read-only phase. No files are created or modified. The engineer reads all governance artifacts relevant to the feature: the IEF specification, the PMIC Part 1 stop conditions, applicable Part 2 standards, prior feature reports, and the current state of the progress template. This phase exists because ambiguity discovered during implementation is more costly than ambiguity discovered before it begins.

Preparation is complete when the engineer can answer: What files will this feature create or modify? What standards from Part 2 apply? What did the prior feature do that this one must be compatible with?

### 30.2 Repository Validation

Repository validation is a formal confirmation that the repository is in a known-good state before any implementation begins. A feature implemented on top of an unknown repository state produces an unknown feature state. This phase eliminates that risk.

The six validation steps (RV-01 through RV-06) from §23.2 are non-negotiable. A failing RV step does not mean "the feature may begin cautiously." It means execution is blocked until the repository is restored to a known-good state.

### 30.3 Implementation

Implementation is the only phase in which files are created or modified. Scope is strictly bounded by the feature definition. Files outside scope must not be touched regardless of their relevance or apparent improvement value.

The governing principle is: this feature does one thing, and only that thing. Infrastructure improvements that are "obvious" while implementing a feature are deferred to their own feature or documented as a recommended future action in the feature report.

### 30.4 Quality Gates

Quality gates are not a post-implementation step. They are an ongoing verification that runs at every meaningful change boundary during implementation. The four gates (§21.1–§21.4) must all pass before any commit is made. They are re-run in full after any fix — not selectively re-run for the changed subsystem.

The quality gate sequence is fixed (§21.5). Running tests before build is prohibited. The sequence exists because later gates can surface issues that earlier gates do not.

### 30.5 Documentation

Documentation is produced concurrent with implementation, not after. The feature report documents what was done, why, what was unchanged, and what quality evidence was collected. It is not a retrospective summary — it is a formal engineering record that persists as part of the repository's permanent history.

An undocumented feature is not DONE. Implementation without documentation violates the completion requirements in §25.2.

### 30.6 Commit

The commit is the atomic unit of feature delivery. A feature's implementation commit contains all feature files — no partial commits, no "work in progress" commits, no "fix" commits that split the implementation. The quality gates must pass on the exact set of files that will be committed.

The documentation commit follows immediately. Between the implementation commit and the documentation commit, the repository must remain in the quality-gate-passing state.

### 30.7 Post-Commit Repository Validation

After both commits are made, a final repository validation confirms the committed state matches the expected state. `git status` must be clean. `git log` must show the commits in the expected order. The four quality gates must pass on HEAD. This is a brief verification, not a full re-execution of all gates — but the verification must be explicit, not assumed.

### 30.8 Transition

Transition executes the workflow in §29.9. It is not optional and not abbreviated. A feature that skips transition validation is a feature that has been declared COMPLETE without evidence. The transition is the governance mechanism that converts DONE into COMPLETE.

### 30.9 Completion

A feature is COMPLETE when the transition validation passes and the next feature is authorized to begin. The progress template status changes from DONE to COMPLETE (where the template distinguishes these states). The execution queue advances. The phase completion percentage advances.

### 30.10 Failure Handling

Failures at any workflow phase are handled by stopping at the current phase, diagnosing the root cause, applying the minimum-scope fix, and re-running all validation from the beginning of the phase in which the failure occurred.

Failures do not skip backwards (i.e., a quality gate failure during commit phase does not require returning to preparation). But they do require a full re-run of the failed phase's validation, not a selective re-run.

### 30.11 Recovery

Recovery from a stop condition follows §7. The key recovery principle: do not accumulate partially-applied changes. If a stop condition occurs mid-implementation, the repository must be restored to the last known-good commit before recovery work begins. Partial infrastructure state is more dangerous than no infrastructure state because it creates a misleading baseline.

---

## Section 31: Repository Certification

### 31.1 Repository Integrity

Repository certification is the formal assessment that the repository, at the moment F10 completes, satisfies all structural, historical, and quality requirements established by FEOS, the IEF, and the PMIC. Certification is a pre-condition for Platform Final Acceptance (§32).

Repository integrity requires:

| Requirement | Verification |
|---|---|
| Git history is linear on `main` — no merge commits | `git log --merges` returns empty |
| No orphaned commits | `git fsck --lost-found` is clean |
| No force-pushed history | `git reflog` inspection |
| All Phase 4.5 feature commits present | Commit hash register vs. `git log` |
| All Phase 4.5 documentation commits present | Commit hash register vs. `git log` |
| All committed files are UTF-8 | Encoding check (F08 validation) |
| No credentials in any committed file | `git log -S "password" -- . \| grep -v .env.example` |
| No debug artifacts in history | `git log --name-only` inspection |

### 31.2 Repository Maturity

At certification, repository maturity must meet or exceed the target score established in §28.6:

| Dimension | Minimum Required Score |
|---|---|
| Node version governance | 10/10 |
| Line-ending governance | 10/10 |
| Environment standardization | 9/10 |
| Docker infrastructure | 10/10 |
| DevContainer | 10/10 |
| CI/CD | 10/10 |
| Developer experience | 10/10 |
| Cross-platform testing | 9/10 |
| Secrets management | 10/10 |
| Onboarding documentation | 9/10 |
| **Overall** | **≥ 97/100** |

A score below the minimum in any dimension constitutes a certification blocker. The blocker must be resolved — either by implementing the missing capability or documenting it as an accepted deferred item in the Final Report (§36).

### 31.3 Engineering Maturity

Engineering maturity at certification is assessed across the Phase 4.5 engineering pillars:

| Pillar | Assessment |
|---|---|
| Infrastructure as Code | All infrastructure in committed, versioned files |
| Quality Automation | Four mandatory quality gates enforced in CI |
| Cross-Platform Coverage | Three-OS CI matrix passing |
| Zero-Configuration Onboarding | New developer reaches running environment via documented steps only |
| Secrets Hygiene | No credentials in repository; `.env.example` as only source of truth |
| Developer Tooling | Linting, formatting, debugging fully configured in workspace |
| Container Parity | Local Docker matches CI database configuration |

### 31.4 Platform Readiness

Platform readiness is the operational assessment of whether the infrastructure platform can support the application reliably:

| Capability | Readiness Criterion |
|---|---|
| Database availability | PostgreSQL starts healthy within 60 seconds |
| Application startup | NestJS starts without error against containerized database |
| Build repeatability | `npm ci && npm run build` succeeds on a clean checkout |
| Test repeatability | `npm run test` passes 482/482 on a clean checkout |
| Onboarding | Zero-to-running in < 15 minutes verified |
| Schema safety | `prisma validate` passes; schema unmodified |

### 31.5 Cross-Platform Readiness

Cross-platform readiness is verified in F08 and confirmed at certification:

| Platform | CI Evidence | Manual Evidence |
|---|---|---|
| Ubuntu 24 | CI matrix `ubuntu-latest` green | F07 completion |
| Windows 11 | CI matrix `windows-latest` green | F07 completion |
| macOS 14 arm64 | CI matrix `macos-latest` green | F07 completion |
| Debian 12 | DevContainer base image | F06 completion |

### 31.6 Documentation Readiness

Documentation readiness requires that all mandatory documentation artifacts are present, committed, and internally consistent:

| Document | Required State |
|---|---|
| `09_PLATFORM_PROGRESS_TEMPLATE.md` | All 10 features COMPLETE |
| `reports/F01_REPORT.md` through `reports/F10_REPORT.md` | All committed |
| `PLATFORM_MASTER_IMPLEMENTATION_CONTRACT.md` (this document) | Parts 1, 2, 3 complete |
| `10_PLATFORM_FINAL_ACCEPTANCE.md` | Populated (pre-acceptance) |
| All triggered EDRs | Committed |
| IEF documents 00–10 | Unmodified since IEF closure |

### 31.7 Developer Readiness

Developer readiness is the subjective but verifiable assessment that a developer new to the repository can achieve a productive development environment using only documented steps:

| Criterion | Verification |
|---|---|
| `scripts/doctor.sh` exits 0 on a clean setup | Manual test |
| Application runs locally against Docker PostgreSQL | Manual test |
| All VSCode tasks execute correctly | Manual test |
| Debug profiles attach successfully | Manual test |
| Onboarding steps documented in `README.md` produce the stated result | End-to-end sign-off |

### 31.8 Certification Authority

Repository Certification is issued by the Chief Software Architect. The certification is a formal written statement in `10_PLATFORM_FINAL_ACCEPTANCE.md` confirming that the repository satisfies §31.1 through §31.7.

Certification cannot be delegated. It cannot be issued before F10 completes. It cannot be issued while any stop condition remains unresolved.

### 31.9 Certification Evidence

The following evidence is collected and committed before certification is issued:

| Evidence Item | Source | Committed In |
|---|---|---|
| All feature reports with quality gate results | Feature implementation | `reports/FXX_REPORT.md` |
| CI pipeline green on all three OS targets | GitHub Actions | CI run URL in `F07_REPORT.md` |
| `git log --oneline` showing linear Phase 4.5 history | `git log` | `10_PLATFORM_FINAL_ACCEPTANCE.md` |
| Repository maturity score ≥ 97/100 | Architect assessment | `10_PLATFORM_FINAL_ACCEPTANCE.md` |
| Zero outstanding stop conditions | Progress template | `09_PLATFORM_PROGRESS_TEMPLATE.md` |
| All CPBs resolved | CPB register | `09_PLATFORM_PROGRESS_TEMPLATE.md` |

---

## Section 32: Platform Final Acceptance

### 32.1 Acceptance Authority

Platform Final Acceptance requires co-authorization from two roles:

| Role | Authority | Scope |
|---|---|---|
| Chief Software Architect | Primary | Overall platform quality, architecture compliance, FEOS alignment |
| QA Director | Secondary | Quality evidence review, testing coverage, acceptance criteria completeness |

Both signatures are required. The QA Director's signature confirms quality evidence is complete. The Chief Software Architect's signature confirms the platform is fit for engineering purpose and the Phase 4.5 mission is accomplished.

### 32.2 Acceptance Workflow

```
F10 COMPLETE
  → Repository Certification (§31)
    [BLOCKED] → Resolve certification blockers → Retry
    [ISSUED] → QA Director quality review
      [NOT READY] → Document gaps → Fix → Re-certify
      [READY] → Chief Architect final acceptance review
        [NOT ACCEPTED] → Document deficiencies → Fix → Re-certify
        [ACCEPTED] → Platform Final Acceptance signed
          → Platform Closure (§33)
```

### 32.3 Acceptance Checklist

The acceptance checklist is the structured evaluation that the acceptance authority uses to reach the acceptance decision. It is populated in `10_PLATFORM_FINAL_ACCEPTANCE.md`:

| Domain | Criteria Count | All PASS Required |
|---|---|---|
| Repository Integrity | 8 (§31.1) | Yes |
| Repository Maturity | 10 dimensions (§31.2) | ≥ 97/100 |
| Platform Readiness | 6 (§31.4) | Yes |
| Cross-Platform Readiness | 4 platforms (§31.5) | Yes |
| Documentation Readiness | 7 documents (§31.6) | Yes |
| Developer Readiness | 5 criteria (§31.7) | Yes |
| Quality Gate Evidence | 4 gates × 10 features | Yes |
| Engineering Decisions | All EDRs reviewed and closed | Yes |
| Deferred Items | All documented in Final Report | Yes |

### 32.4 Acceptance Evidence

The acceptance decision is supported by the evidence package assembled in §31.9. No acceptance criterion may be marked PASS without corresponding evidence. The evidence package is committed to the repository before the acceptance decision is made.

Evidence that is asserted without collection (e.g., "CI was green — we didn't record the run URL") is inadmissible for acceptance criteria purposes. Such criteria are marked FAIL and the gap documented.

### 32.5 Quality Evidence

Quality evidence specifically covers the accumulated quality gate results across all ten features:

| Evidence Type | Source |
|---|---|
| Build PASS × 10 features | Feature reports |
| Lint PASS × 10 features | Feature reports |
| Tests 482/482 PASS × 10 features | Feature reports |
| Prisma Validate PASS × 10 features | Feature reports |
| CI matrix green × 3 OS | F07 report + CI run URL |

The QA Director reviews this evidence and confirms completeness before co-signing.

### 32.6 Repository Evidence

Repository evidence covers the structural and historical integrity of the repository:

| Evidence Type | Source |
|---|---|
| Git log showing linear history | `git log --oneline` output |
| All feature commits present | Commit hash register |
| No credentials in history | Search result |
| Clean working tree at certification | `git status` output |
| All maturity dimensions scored | Architect assessment |

### 32.7 Engineering Evidence

Engineering evidence covers the decisions made during Phase 4.5:

| Evidence Type | Source |
|---|---|
| Engineering Decision Reports (all triggered) | Committed EDR files |
| Stop condition resolutions | Progress template Blocking Issues Register |
| Deferred items documented | Final Report §36 |
| Cross-platform blocker resolutions | CPB register in progress template |
| Feature report sign-offs | Reports committed in `reports/` |

### 32.8 Approval Matrix

| Action | Chief Architect | QA Director | Engineering Governance Lead |
|---|---|---|---|
| Issue Repository Certification | REQUIRED | — | — |
| Sign Final Acceptance | REQUIRED | REQUIRED | — |
| Approve Platform Closure | REQUIRED | — | REQUIRED |
| Archive documentation | — | — | REQUIRED |
| Issue Phase 4.5 Complete tag | REQUIRED | — | — |

### 32.9 Final Approval

Final approval is recorded as a written statement in `10_PLATFORM_FINAL_ACCEPTANCE.md`:

```
PLATFORM FINAL ACCEPTANCE

Date: <date>
Phase: 4.5 — Cross-Platform Development Environment

I confirm that the Phase 4.5 infrastructure platform has been 
implemented, validated, and certified according to the requirements 
of the FEOS, the IEF, and the Platform Master Implementation Contract.

Chief Software Architect: <name>, <date>
QA Director: <name>, <date>
```

This statement, once committed to `main`, constitutes the formal Platform Final Acceptance. The phase enters L-5 Closed.

---

## Section 33: Platform Closure

### 33.1 Closure Criteria

Platform Closure is the terminal event of Phase 4.5. Closure MUST NOT begin before all of the following are true:

| Criterion | Verification |
|---|---|
| All 10 features are COMPLETE | Progress template |
| Repository Certification issued | `10_PLATFORM_FINAL_ACCEPTANCE.md` |
| Platform Final Acceptance signed | `10_PLATFORM_FINAL_ACCEPTANCE.md` |
| Platform Final Report complete (§36) | `PLATFORM_IMPLEMENTATION_FINAL_REPORT.md` |
| Knowledge Baseline update complete (§34) | KEB documents updated |
| FEOS Engineering Metrics update complete (§35) | FEOS metrics updated |
| No active stop conditions | Progress template |
| All deferred items documented | Final Report §36 |

### 33.2 Closure Workflow

```
Platform Final Acceptance signed
  → Platform Final Report authored (§36)
  → Knowledge Baseline update (§34)
  → FEOS Engineering Metrics update (§35)
  → Repository tag issued (§33.5)
  → Post-closure actions complete (§33.6)
  → Archive complete (§33.7)
  → Platform Closure declared
    → Phase 4.5 enters L-6 CLOSED
```

### 33.3 Closure Documentation

The following documents are committed as part of Platform Closure:

| Document | Location | Content |
|---|---|---|
| Platform Final Report | `docs/execution/platform/PLATFORM_IMPLEMENTATION_FINAL_REPORT.md` | §36 |
| Updated KEB entries | `docs/knowledge/` | §34 |
| Updated FEOS metrics | `docs/feos/` | §35 |
| `10_PLATFORM_FINAL_ACCEPTANCE.md` | `docs/execution/platform/` | Closure statement |
| Updated progress template | `docs/execution/platform/09_PLATFORM_PROGRESS_TEMPLATE.md` | All COMPLETE |
| PMIC (this document) | `docs/execution/platform/` | Parts 1–3 COMPLETE |

All closure documentation is committed in a single closure commit:

```
docs(platform): Phase 4.5 Platform Closure
```

### 33.4 Repository State at Closure

At Platform Closure, the repository MUST be in the following state:

| Property | Required State |
|---|---|
| Working tree | Clean |
| All quality gates | PASS |
| Test count | 482 (unchanged from Phase 4.5 entry) |
| TypeScript errors | 0 |
| ESLint errors | 0 |
| Schema validity | PASS |
| Git history | Linear; all Phase 4.5 commits in sequence |
| Protected directories | Unmodified |
| `.env` | Gitignored; not committed |
| `dist/` | Gitignored; not committed |

### 33.5 Tagging Policy

Upon Platform Closure, a git tag is issued:

| Tag | Format | Example |
|---|---|---|
| Phase 4.5 completion | `platform/v1.0.0` | `platform/v1.0.0` |

The tag is lightweight or annotated at the architect's discretion. Annotated tags include the date and a one-line summary. The tag is pushed to the remote repository as the final act of Phase 4.5.

The tag is immutable. It marks the exact commit at which Phase 4.5 was declared closed and the platform certified.

### 33.6 Post-Closure Actions

| Action | Owner | Timing |
|---|---|---|
| Notify stakeholders of Phase 4.5 completion | Technical Program Manager | Immediately after closure |
| Update project roadmap with Phase 4.5 COMPLETE | Chief Software Architect | Within 1 day |
| Brief development team on new infrastructure | Chief Platform Engineer | Within 1 week |
| Delete any implementation worktrees or branches | Chief Platform Engineer | Immediately after closure |
| Confirm CI is green on `main` post-closure | Chief Platform Engineer | Immediately after tag |
| Schedule post-Phase 4.5 retrospective | Technical Program Manager | Within 2 weeks |

### 33.7 Archive Policy

Phase 4.5 execution documentation is archived in place — it remains in `docs/execution/platform/` permanently. No documents are deleted. No documents are moved to an archive directory.

The rationale: the Phase 4.5 execution record is engineering history. Future platform improvements (Phase 5.x, 6.x) reference this record to understand decisions made, blockers encountered, and standards established. Archiving-by-deletion destroys that reference.

Documents that are superseded (e.g., if a future platform phase changes a standard established here) are updated in place with a `SUPERSEDED` marker and a reference to the superseding document. Original content is preserved.

---

## Section 34: Knowledge Baseline Update

### 34.1 Update Policy

The Knowledge Engineering Baseline (KEB) is updated at Platform Closure. KEB updates are a closure prerequisite — Platform Closure cannot be declared while KEB updates are pending. Updates to the KEB during Phase 4.5 execution (not at closure) require an Engineering Decision documenting the justification for an out-of-cycle update.

**MANDATORY:** The KEB is updated by a team member with Knowledge Architect authority. The Chief Platform Engineer documents what must be updated; the Knowledge Architect performs the update and commits it.

### 34.2 Required Updates

Phase 4.5 introduces infrastructure that does not exist in the pre-Phase 4.5 KEB. The following KEB entries must be created or updated:

| KEB Entry | Update Type | Content |
|---|---|---|
| Node.js version governance | CREATE or UPDATE | `.nvmrc` pattern; `engines` field; `actions/setup-node` integration |
| Docker development environment | CREATE | Compose architecture; named volumes; health checks; service profiles |
| DevContainer configuration | CREATE | Base image; `postCreateCommand`; port forwarding; extension set |
| Bootstrap scripts | CREATE | `doctor.sh` pattern; idempotent setup pattern; confirmation-guarded reset |
| CI/CD pipeline | CREATE | Matrix build strategy; OS targets; `npm ci` vs `npm install`; prisma in CI |
| Developer experience configuration | CREATE | `.editorconfig`; `.gitattributes`; `.vscode/` configuration pattern |
| Secrets management | CREATE or UPDATE | `.env.example` pattern; `${localEnv:VAR}` in DevContainer; GitHub Actions Secrets |
| Cross-platform standards | CREATE | Line endings; encoding; shell compatibility; path separators |
| Quality gate sequence | UPDATE | Four-gate sequence; `DATABASE_URL` prefix requirement for Prisma in Phase 4.5 context |

### 34.3 Validation

KEB updates are validated before commit by:

| Check | Standard |
|---|---|
| Updated entries reflect the final implemented state (not the IEF specification) | Actual > specified |
| No KEB entry contradicts FEOS | FEOS supremacy preserved |
| No KEB entry contradicts the PMIC | PMIC is authoritative |
| All technical details are accurate for the certified platform state | Verified against committed infrastructure files |
| Cross-references to PMIC sections included | Citation standard |

### 34.4 Cross References

Each new or updated KEB entry cross-references:

- The PMIC section that governs the entry
- The IEF specification document that specified it
- The Feature Report(s) that implemented it
- The FEOS principle(s) it embodies

Cross-references use document names and section numbers, not line numbers (which are unstable).

### 34.5 Repository Synchronization

KEB updates are committed to the repository in the closure commit (§33.3). The KEB update and the Platform Final Report are committed together to ensure the knowledge record and the execution record are synchronized in history.

### 34.6 Knowledge Preservation

The following types of knowledge are specifically preserved in the KEB update:

| Knowledge Type | Preservation Mechanism |
|---|---|
| Decisions not obvious from the code | KEB entry with rationale |
| Platform limitations discovered | KEB entry + corresponding CPB resolution |
| Engineering Decisions (cross-cutting) | KEB entry referencing the EDR |
| Failure modes encountered and resolved | KEB entry for each resolved stop condition (Class B+) |
| Compatibility constraints | KEB entry under cross-platform standards |

Knowledge that is derivable from the committed infrastructure files without judgment is not repeated in the KEB. The KEB captures the non-obvious and the hard-won.

---

## Section 35: FEOS Engineering Metrics Update

### 35.1 Repository Maturity

The FEOS Engineering Metrics document (`docs/feos/17_ENGINEERING_METRICS.md`) is updated at Platform Closure to reflect the Phase 4.5 maturity achievements. The pre-Phase 4.5 baseline (17/100) and the post-Phase 4.5 target (≥ 97/100) are both recorded.

| Dimension | Pre-4.5 Score | Post-4.5 Score | Delta |
|---|---|---|---|
| Node version governance | 0/10 | 10/10 | +10 |
| Line-ending governance | 2/10 | 10/10 | +8 |
| Environment standardization | 1/10 | 9/10 | +8 |
| Docker infrastructure | 0/10 | 10/10 | +10 |
| DevContainer | 0/10 | 10/10 | +10 |
| CI/CD | 0/10 | 10/10 | +10 |
| Developer experience | 1/10 | 10/10 | +9 |
| Cross-platform testing | 0/10 | 9/10 | +9 |
| Secrets management | 3/10 | 10/10 | +7 |
| Onboarding documentation | 1/10 | 9/10 | +8 |

### 35.2 Infrastructure Maturity

The FEOS metrics update records infrastructure maturity across the four infrastructure pillars:

| Pillar | Pre-4.5 | Post-4.5 |
|---|---|---|
| Container infrastructure | 0% — no Docker | 100% — PostgreSQL, health checks, named volumes |
| Environment standardization | 10% — manual, undocumented | 100% — `.env.example`, secrets policy, CI secrets |
| Build reproducibility | 40% — builds locally, no CI | 100% — `npm ci`, `--engines-strict`, three-OS CI |
| Developer toolchain | 20% — unconfigured editors | 100% — `.editorconfig`, `.gitattributes`, `.vscode/` |

### 35.3 Developer Experience Maturity

| Metric | Pre-4.5 | Post-4.5 |
|---|---|---|
| Time to first build (new developer) | Unknown; undocumented | < 15 minutes (documented and verified) |
| Environment setup steps | Undocumented | Single command: `bash scripts/setup.sh` |
| Debug configuration | None | Two debug profiles; F5 launch |
| Editor standardization | None | `.editorconfig` + `.vscode/settings.json` |
| Onboarding documentation | Absent | `README.md` with verified steps |

### 35.4 Cross-Platform Maturity

| Platform | Pre-4.5 | Post-4.5 |
|---|---|---|
| Windows 11 support | Untested; unverified | CI verified; CRLF protection active |
| Ubuntu 24 support | PRIMARY; no formal verification | CI verified; build/test/lint/prisma all PASS |
| macOS 14 arm64 | Used in development; unverified | CI verified; `bcrypt` arm64 confirmed |
| Debian 12 | Not applicable | DevContainer base; verified in F06 |

### 35.5 CI Maturity

| Metric | Pre-4.5 | Post-4.5 |
|---|---|---|
| CI pipeline | None | GitHub Actions; three-OS matrix |
| Automated quality gates | None | Build, Lint, Tests (482/482), Prisma Validate, npm audit |
| Branch protection | None | Configured; status checks required |
| Execution time | N/A | < 10 minutes per matrix leg (target) |
| fail-fast | N/A | Enabled; matrix cancels on first failure |

### 35.6 Container Maturity

| Metric | Pre-4.5 | Post-4.5 |
|---|---|---|
| Docker Compose file | None | `docker-compose.dev.yml` — Compose Specification |
| Health checks | None | PostgreSQL health check; dependency ordering |
| Image version pinning | N/A | Exact `major.minor.patch` for all images |
| Named volumes | N/A | `factory-postgres-data`; cross-platform data persistence |
| DevContainer | None | `devcontainer.json`; full workspace configuration |

### 35.7 Toolchain Maturity

| Tool | Pre-4.5 | Post-4.5 |
|---|---|---|
| Node.js | Unversioned | `24.16.0` pinned in `.nvmrc`; `engines` range enforced |
| npm | Unversioned | `>=11.0.0` enforced |
| Git | Configured | `.gitattributes` governs line endings; branch protection on `main` |
| Docker | Not in use | `24.0.0+` required; Compose v2 enforced |
| Prisma | Operational | `6.16.2` locked; validate in CI; generate documented |

### 35.8 Documentation Maturity

| Documentation Type | Pre-4.5 | Post-4.5 |
|---|---|---|
| Developer onboarding | Absent | `README.md` with verified steps |
| Infrastructure specification | Absent | IEF documents 00–10 |
| Governance documentation | FEOS + KEB | FEOS + KEB + PMIC (Parts 1–3) |
| Feature execution records | Absent | 10 feature reports |
| Engineering decisions | Untracked | EDR register + committed EDR files |
| Platform acceptance | Absent | `10_PLATFORM_FINAL_ACCEPTANCE.md` |

### 35.9 Overall Engineering Maturity

| Category | Pre-4.5 Score | Post-4.5 Score | Change |
|---|---|---|---|
| Infrastructure | 10/100 | 95/100 | +85 |
| Developer Experience | 15/100 | 95/100 | +80 |
| Cross-Platform | 0/100 | 90/100 | +90 |
| CI/CD | 0/100 | 100/100 | +100 |
| Container | 0/100 | 100/100 | +100 |
| Toolchain | 30/100 | 95/100 | +65 |
| Documentation | 20/100 | 95/100 | +75 |
| **Overall** | **17/100** | **≥ 97/100** | **+80** |

The FEOS metrics update records the actual scores achieved (not these projections) based on the certified platform state at closure.

---

## Section 36: Platform Final Report

The Platform Final Report (`PLATFORM_IMPLEMENTATION_FINAL_REPORT.md`) is authored at Platform Closure. Section 36 defines its mandatory content. The report is an engineering record — it does not need to persuade anyone; it needs to be accurate.

### 36.1 Executive Summary

The executive summary covers, in no more than one page:

- Phase 4.5 mission and scope
- Features delivered (count, names)
- Repository maturity delta (pre- vs. post-)
- Engineering Decisions issued
- Stop conditions encountered
- Outstanding deferred items
- Phase 4.5 status: COMPLETE or PARTIAL (with justification)

### 36.2 Features Delivered

A table listing all ten features with:

| Column | Content |
|---|---|
| Feature ID | F01–F10 |
| Name | Feature name |
| Status | COMPLETE |
| Commit | Implementation commit hash |
| Date | Completion date |
| Specification | IEF document reference |
| EDR | EDR reference or "None" |

### 36.3 Engineering Decisions Summary

A summary table of all Engineering Decision Reports issued during Phase 4.5:

| Column | Content |
|---|---|
| EDR ID | `ENGINEERING_DECISION_REPORT_FXX.md` |
| Feature | Feature that triggered the EDR |
| Title | Decision title |
| Classification | Which stop condition class applied |
| Status | APPROVED / SUPERSEDED |
| Impact | Which IEF sections were affected |

### 36.4 Deferred Work Register

Every item that was identified as a candidate for Phase 4.5 but deferred, with:

| Column | Content |
|---|---|
| Deferred Item ID | `DEFER-P45-NNN` |
| Description | What was deferred |
| Reason | Why it was deferred (scope, time, dependency) |
| Impact | What the absence means for developers |
| Target Phase | When it should be addressed |
| Owner | Responsible role for future implementation |

### 36.5 Repository Statistics

Quantitative summary of the Phase 4.5 repository changes:

| Statistic | Value |
|---|---|
| Commits (Phase 4.5) | Counted from `git log platform/v1.0.0 ^<pre-4.5-tag>` |
| Files created | Counted from feature reports |
| Files modified | Counted from feature reports (F01: 1 modified) |
| Source files modified | 0 (MANDATORY — protected) |
| Schema files modified | 0 (MANDATORY — protected) |
| Test files modified | 0 (MANDATORY — protected) |
| npm packages added | 0 (MANDATORY — per §12.8) |
| Lines of infrastructure code | Counted from feature files |
| Lines of documentation | Counted from Phase 4.5 documentation files |

### 36.6 Quality Statistics

| Statistic | Value |
|---|---|
| Quality gate cycles (total) | Counted from feature reports |
| Quality gate failures encountered | Counted from stop condition log |
| Tests at Phase 4.5 entry | 482 |
| Tests at Phase 4.5 exit | 482 (no change) |
| Lint errors resolved | Counted from feature reports |
| CI pipeline runs | Counted from GitHub Actions |
| CI pipeline pass rate | % |
| npm audit vulnerabilities at entry | Recorded in F02 report |
| npm audit vulnerabilities at exit | 0 high severity |

### 36.7 Engineering Statistics

| Statistic | Value |
|---|---|
| Engineering Decisions issued | Count |
| Stop conditions triggered | Count by class |
| Stop conditions resolved (self-recovered) | Count |
| Stop conditions requiring architect intervention | Count |
| CPBs identified at audit | 8 (CPB-001–CPB-008) |
| CPBs resolved by Phase 4.5 | Count |
| CPBs deferred | Count |
| Phase 4.5 duration (calendar days) | Measured |
| Phase 4.5 implementation effort | Estimated from velocity tracking |
| Repository maturity delta | 17/100 → ≥ 97/100 |

### 36.8 Lessons Learned

The lessons learned section captures engineering observations that should inform future platform phases. The entries are objective, not retrospective blame. Each entry identifies:

- The observation
- The root cause (if known)
- The mitigation applied
- The recommended practice for future phases

Categories of lessons captured:

| Category | Examples |
|---|---|
| Process | "Dependency validation at CP-1 prevented cascading failures in three instances" |
| Technical | "bcrypt native module on arm64 required explicit build tool verification in F05" |
| Toolchain | "PowerShell 5.1 pipeline operators require workarounds; documented in §13.9" |
| Documentation | "IEF-to-PMIC terminology mapping saved ~30 minutes per feature transition" |

### 36.9 Recommendations

Forward-looking recommendations for platform improvement beyond Phase 4.5:

| Recommendation | Priority | Target Phase |
|---|---|---|
| Redis configuration (deferred DEFER-P45-001) | MEDIUM | When session/cache feature is needed |
| MailHog configuration (deferred DEFER-P45-002) | LOW | When email feature is implemented |
| CD pipeline (staging + production) | HIGH | Next infrastructure phase |
| GitHub Codespaces validation | LOW | Post Phase 4.5 |
| Secrets vault integration | HIGH | Before production deployment |
| `security.yml` scheduled workflow | MEDIUM | Near-term platform maintenance |
| Fedora 40 local validation | LOW | If Fedora developers join the team |

### 36.10 Future Work

Future work is distinguished from deferred items: deferred items were explicitly in Phase 4.5 scope and moved out; future work was never in scope but is identified here as the natural continuation of the platform investment.

| Future Work Item | Rationale | Owner |
|---|---|---|
| Production deployment pipeline | Phase 4.5 established CI; CD is the next step | Future DevOps phase |
| Environment-specific Compose files | `docker-compose.prod.yml` for staging/prod | Future platform phase |
| Container image for NestJS application | Current: host process; Future: production container | Future DevOps phase |
| Observability infrastructure | Logs, metrics, traces in development | Future platform phase |
| Database migration automation in CI | Current: manual migration workflow | Future platform phase |

---

## Section 37: Release Readiness

### 37.1 Release Criteria

Phase 4.5 does not produce a software release. It produces a certified development platform. "Release readiness" in this context means the platform is ready for the development team to use as the standard development environment — the old workflow (ad-hoc, undocumented, single-OS) is retired and the new platform is the only supported path.

Release readiness requires:

| Criterion | Classification | Detail |
|---|---|---|
| All 10 features COMPLETE | MANDATORY | Progress template confirms |
| Platform Final Acceptance signed | MANDATORY | `10_PLATFORM_FINAL_ACCEPTANCE.md` |
| Platform Closure declared | MANDATORY | §33.2 workflow complete |
| Team briefed on new infrastructure | MANDATORY | §33.6 post-closure action |
| Developer documentation accessible | MANDATORY | `README.md` at repository root |
| Doctor script passes on all team machines | MANDATORY | Verified before "release" announcement |

### 37.2 Repository Readiness

The repository is release-ready when:

| Check | Required State |
|---|---|
| All quality gates PASS on HEAD | Build, Lint, Tests, Prisma |
| CI green on `main` | All three OS targets |
| `platform/v1.0.0` tag pushed | Immutable reference point |
| No active stop conditions | Zero |
| Working tree clean | `git status` clean |
| All feature reports committed | F01–F10 |

### 37.3 Developer Readiness

The development team is ready to adopt the new platform when:

| Readiness Indicator | Verification Method |
|---|---|
| Docker installed and functional on all team machines | `docker compose version` per team member |
| `.env` file present and correctly populated | Doctor script passes |
| Node `24.16.0` active (nvm) | `.nvmrc` auto-switch or manual verify |
| DevContainer option available (optional) | `ms-vscode-remote.remote-containers` installed |
| CI pipeline understood | Team briefing complete |
| Bootstrap scripts tested | `doctor.sh` passes on each machine |

### 37.4 Infrastructure Readiness

The infrastructure platform is ready when:

| Component | Readiness |
|---|---|
| PostgreSQL container | Starts healthy within 60 seconds per `docker-compose.dev.yml` |
| Application-to-database connectivity | NestJS starts against containerized PostgreSQL |
| DevContainer (optional) | Opens without error; container runs as non-root |
| CI pipeline | Triggers on PR and push to `main`; all matrix jobs pass |
| Doctor script | Passes on all supported OS targets |

### 37.5 CI Readiness

CI readiness is binary: the pipeline must be green on `main` before the platform is released to the team. A green CI pipeline on `main` means:

- `ubuntu-latest`, `windows-latest`, `macos-latest` all pass
- Build, lint, tests (482/482), prisma validate, npm audit all pass
- All actions are pinned to major version tags
- No credentials appear in workflow files
- Branch protection is active on `main`

### 37.6 Cross-Platform Readiness

Cross-platform readiness is confirmed by the CI matrix (F07) and the dedicated cross-platform validation (F08). The platform is cross-platform-ready when:

| Platform | Required Evidence |
|---|---|
| Ubuntu 24 | CI `ubuntu-latest` green; F07 report |
| Windows 11 | CI `windows-latest` green; F07 report |
| macOS 14 arm64 | CI `macos-latest` green; F07 report |
| Debian 12 | DevContainer validated; F06 report |

### 37.7 Documentation Readiness

The documentation is ready for team use when:

| Document | State |
|---|---|
| `README.md` | Prerequisites, setup steps, development workflow, troubleshooting |
| `.env.example` | All required variables with placeholder values and comments |
| `CLAUDE.md` | Updated with bootstrap script references and new infrastructure commands |
| `docs/execution/platform/` | IEF + PMIC + all feature reports committed |

### 37.8 Approval Authority

Release readiness is confirmed by the Chief Software Architect as part of Platform Closure (§33). The `platform/v1.0.0` tag creation constitutes the release readiness declaration.

---

## Section 38: Cross-Platform Certification

### 38.1 Certification Matrix

Cross-platform certification is the formal record of which platforms have been validated and what evidence supports each validation:

| Platform | Priority | Validation Method | Evidence Source | Status |
|---|---|---|---|---|
| Windows 11 x64 | PRIMARY | CI matrix + local | CI run URL + F07 report | At F07 completion |
| Ubuntu 24 LTS x64 | PRIMARY | CI matrix + local | CI run URL + F07 report | At F07 completion |
| macOS 14 arm64 | SECONDARY | CI matrix | CI run URL + F07 report | At F07 completion |
| Debian 12 x64 | SECONDARY | DevContainer | F06 report | At F06 completion |
| Fedora 40 x64 | TERTIARY | Deferred | DEFER-P45-004 | Post Phase 4.5 |

### 38.2 Windows Certification

Windows 11 certification requirements:

| Requirement | Standard | Evidence |
|---|---|---|
| Build passes | `npm run build` exits 0 | CI `windows-latest` log |
| Tests pass (482/482) | `npm run test` exits 0 | CI `windows-latest` log |
| Lint passes | `npm run lint` exits 0 | CI `windows-latest` log |
| Prisma validate passes | `npx prisma validate` exits 0 | CI `windows-latest` log |
| `npm ci --engines-strict` passes | Node `>=24.0.0 <25.0.0` enforced | CI `windows-latest` log |
| Line endings are LF in checkout | `.gitattributes` normalizes | F08 validation |
| PowerShell scripts pass | `doctor.ps1` exits 0 | F05 report |
| No `node_modules/.bin` path issues | `npx`-based invocations in CI | F07 specification |

### 38.3 Ubuntu Certification

Ubuntu 24 certification requirements:

| Requirement | Standard | Evidence |
|---|---|---|
| All four quality gates pass | Standard gates | CI `ubuntu-latest` log |
| `scripts/doctor.sh` exits 0 | All 12 checks pass | F05 report |
| `scripts/setup.sh` is idempotent | Passes on second run | F05 report |
| Docker Compose starts PostgreSQL healthy | Within 60 seconds | F04 report |
| Execute bits set on `.sh` files | `ls -la scripts/` | F05 report |
| npm audit passes at high severity | `--audit-level=high` | CI `ubuntu-latest` log |
| LF line endings in all governed files | `git ls-files --eol` | F02, F08 reports |

### 38.4 Debian Certification

Debian 12 certification is via the DevContainer base image (`mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm`):

| Requirement | Standard | Evidence |
|---|---|---|
| DevContainer opens without error | VSCode DevContainer | F06 report |
| `node --version` = `v24.16.0` inside container | Base image node version | F06 report |
| `npm run build` passes inside container | Standard build gate | F06 report |
| `npm run test` passes inside container | 482/482 | F06 report |
| `prisma generate` passes inside container | With `DATABASE_URL` pointing to `db` service | F06 report |
| Container user is non-root (`vscode`) | `id` command inside container | F06 report |
| `bcrypt` native module compiles | `npm ci` in container | F06 report |

### 38.5 Fedora Certification

Fedora 40 certification is deferred (DEFER-P45-004). The DevContainer (Debian base) provides Fedora-equivalent Linux coverage for the immediate purpose of Phase 4.5. Fedora-specific validation is triggered if a Fedora-using developer joins the team or if Fedora-specific issues are reported post-Phase 4.5.

### 38.6 macOS Certification

macOS 14 arm64 certification requirements:

| Requirement | Standard | Evidence |
|---|---|---|
| All four quality gates pass | Standard gates | CI `macos-latest` log |
| `bcrypt` native module compiles | Xcode CLI tools on runner | CI `macos-latest` log |
| `scripts/doctor.sh` exits 0 | POSIX sh on macOS | F05 report (manual) |
| Node `24.16.0` on arm64 | Native arm64 build | CI `macos-latest` log |
| npm audit passes | `--audit-level=high` | CI `macos-latest` log |

Docker on macOS GitHub Actions runners is not available. Docker-dependent certification (Compose health checks, DevContainer) is covered by Ubuntu CI and local macOS developer validation respectively.

### 38.7 Docker Compatibility

Docker compatibility is certified across:

| Component | Certified Version | Evidence |
|---|---|---|
| Docker Engine | `24.0.0+` | F04 report |
| Docker Desktop (Windows) | `4.25.0+` | F04 report |
| Docker Desktop (macOS) | `4.25.0+` | F04 report |
| Compose CLI v2 | `2.20.0+` | F04 report |
| PostgreSQL image | `postgres:16.4-alpine` | F04 validation |
| PgAdmin image | `dpage/pgadmin4:8.14` | F04 validation |

### 38.8 DevContainer Compatibility

DevContainer compatibility is certified with:

| Component | Version | Evidence |
|---|---|---|
| Dev Containers extension | Latest at F06 | F06 report |
| Base image | `mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm` | F06 report |
| VSCode minimum version | `1.90.0` | F06 specification |
| Docker Desktop integration | Required on Windows/macOS | F06 documentation |

### 38.9 Toolchain Compatibility

| Tool | Windows 11 | Ubuntu 24 | macOS 14 | Debian 12 |
|---|---|---|---|---|
| Node `24.16.0` | ✓ | ✓ | ✓ (arm64) | ✓ (DevContainer) |
| npm `11.x` | ✓ | ✓ | ✓ | ✓ |
| Git `2.40+` | ✓ | ✓ | ✓ | ✓ |
| Docker v2 | ✓ (Desktop) | ✓ (Engine) | ✓ (Desktop) | N/A |
| Prisma `6.16.2` | ✓ | ✓ | ✓ (arm64) | ✓ |
| `bcrypt` native | ✓ (build tools) | ✓ | ✓ (Xcode) | ✓ (base image) |

### 38.10 Validation Requirements

Cross-platform certification is validated using the evidence from F06, F07, and F08 feature reports. The certification matrix in §38.1 is populated at Platform Closure with the actual status of each platform. A platform marked FAILED in the certification matrix blocks Platform Final Acceptance.

---

## Section 39: Phase Completion Criteria

### 39.1 Definition of Ready (Phase)

Phase 4.5 is ready to begin active execution (L-2) when:

| Criterion | Verification |
|---|---|
| PMIC Parts 1, 2, and 3 committed | `git log` |
| F01 COMPLETE | Progress template |
| IEF documents 00–10 committed | `docs/execution/platform/` |
| Quality gates PASS on HEAD | All four gates |
| Repository clean | `git status` |
| Execution queue defined (§27.2) | This document §27.2 |
| Stop condition protocol known (§6) | Part 1 |
| Transition rules known (§29) | Part 3 |

### 39.2 Definition of Complete (Phase)

Phase 4.5 is COMPLETE when:

| Criterion | Verification |
|---|---|
| All 10 features are in COMPLETE state | Progress template |
| Repository integrity verified (§31.1) | Chief Architect assessment |
| Repository maturity ≥ 97/100 (§31.2) | Maturity assessment |
| Platform Final Acceptance signed (§32.9) | `10_PLATFORM_FINAL_ACCEPTANCE.md` |
| Platform Final Report committed (§36) | `PLATFORM_IMPLEMENTATION_FINAL_REPORT.md` |
| Knowledge Baseline updated (§34) | KEB documents committed |
| FEOS Engineering Metrics updated (§35) | FEOS metrics updated |
| All CPBs resolved or deferred | CPB register |
| All EDRs reviewed and closed | EDR register |

Phase COMPLETE does not require all deferred items to be implemented. It requires that all deferred items are documented.

### 39.3 Definition of Certified (Phase)

Phase 4.5 is CERTIFIED when COMPLETE AND:

| Criterion | Verification |
|---|---|
| Repository Certification issued (§31.8) | Written in `10_PLATFORM_FINAL_ACCEPTANCE.md` |
| Cross-platform certification matrix populated (§38.1) | All required platforms green |
| Release readiness confirmed (§37.8) | `platform/v1.0.0` tag |
| No active stop conditions | Zero |

### 39.4 Definition of Released (Phase)

Phase 4.5 is RELEASED when CERTIFIED AND:

| Criterion | Verification |
|---|---|
| `platform/v1.0.0` tag pushed to remote | `git ls-remote --tags` |
| Development team briefed | Post-closure action §33.6 |
| Old infrastructure documentation (if any) retired | Architecture decision |
| New platform is the sole supported path | Team acknowledgment |

### 39.5 Required Documentation

| Document | Required For | Location |
|---|---|---|
| `PLATFORM_MASTER_IMPLEMENTATION_CONTRACT.md` | All milestones | `docs/execution/platform/` |
| `09_PLATFORM_PROGRESS_TEMPLATE.md` | COMPLETE + | `docs/execution/platform/` |
| `reports/F01_REPORT.md` through `reports/F10_REPORT.md` | COMPLETE + | `docs/execution/platform/reports/` |
| `10_PLATFORM_FINAL_ACCEPTANCE.md` | CERTIFIED + | `docs/execution/platform/` |
| `PLATFORM_IMPLEMENTATION_FINAL_REPORT.md` | COMPLETE + | `docs/execution/platform/` |
| All triggered `ENGINEERING_DECISION_REPORT_FXX.md` | COMPLETE + | `docs/execution/platform/` |
| Updated KEB documents | COMPLETE + | `docs/knowledge/` |
| Updated FEOS metrics | COMPLETE + | `docs/feos/` |

### 39.6 Required Reports

| Report | Required By | Purpose |
|---|---|---|
| F01–F10 Feature Reports | Platform COMPLETE | Implementation evidence |
| Platform Final Report | Platform COMPLETE | Execution record |
| Engineering Decision Reports | Per deviation | Decision record |
| CPB Resolution Register | Platform COMPLETE | Blocker resolution record |
| Platform Final Acceptance | Platform CERTIFIED | Governance record |

### 39.7 Required Evidence

| Evidence | Required For | Source |
|---|---|---|
| Quality gate results × 10 features | COMPLETE | Feature reports |
| CI pipeline green × 3 OS | CERTIFIED | F07 report + CI URL |
| Repository maturity score ≥ 97/100 | CERTIFIED | Architect assessment |
| Linear git history (no merges) | CERTIFIED | `git log --merges` |
| All 8 CPBs addressed | COMPLETE | CPB register |
| Zero high-severity npm vulnerabilities | CERTIFIED | F07 CI log |
| Non-root DevContainer confirmed | CERTIFIED | F06 report |
| `platform/v1.0.0` tag | RELEASED | `git ls-remote` |

### 39.8 Required Approvals

| Milestone | Required Approvers |
|---|---|
| Features F02–F09 COMPLETE | Chief Platform Engineer (self-certified) |
| F10 COMPLETE | Chief Software Architect |
| Repository Certification | Chief Software Architect |
| Platform Final Acceptance | Chief Software Architect + QA Director |
| Platform Closure | Chief Software Architect + Engineering Governance Lead |
| Phase RELEASED | Chief Software Architect |

### 39.9 Completion Authority

Phase 4.5 is formally COMPLETE when the Chief Software Architect makes the written declaration in `10_PLATFORM_FINAL_ACCEPTANCE.md` that all criteria in §39.2 are satisfied. This declaration is irrevocable. Post-closure defects are addressed in a future platform phase, not by reopening Phase 4.5.

---

## Section 40: Permanent Governance

### 40.1 Document Evolution

The PMIC is a living engineering governance document. It does not become obsolete when Phase 4.5 closes. Future platform phases inherit the governance framework established here. Parts that remain valid are unchanged. Parts that are superseded by future phases are marked `SUPERSEDED` with a reference to the superseding document.

The following parts have permanent applicability beyond Phase 4.5:

| Part | Sections | Permanent Applicability |
|---|---|---|
| Part 1 — Governance & Execution Authority | §1–§10 | Authority hierarchy, stop conditions, recovery protocol, EDR framework, governance principles |
| Part 2 — Infrastructure Engineering Standards | §11–§25 | Toolchain, repository, cross-platform, commit, and quality standards; feature execution template |
| Part 3 — Execution Orchestration | §26–§40 | Execution model, progress tracking, certification, closure, and permanent governance |

### 40.2 Versioning Policy

The PMIC is versioned at the document level:

| Version | Trigger | Authority |
|---|---|---|
| 1.0 | Part 3 committed (Phase 4.5) | Chief Software Architect |
| 1.x | Minor standards update; no structural change | Engineering Governance Lead |
| 2.0 | New platform phase introduces structural governance change | Chief Software Architect |

Version 1.x changes are addenda — they append clarifications or update existing sections but do not remove or restructure. Version 2.0 changes require a new Part or a formal governance restructure with full architect approval.

### 40.3 Review Cycle

| Review Type | Trigger | Owner | Scope |
|---|---|---|---|
| Feature-boundary review | After each feature completes | Chief Platform Engineer | Verify PMIC guidance was accurate for the feature |
| Part-boundary review | After each Part is committed | Chief Software Architect | Verify Part is complete and accurate |
| Post-closure review | At Platform Closure | Chief Software Architect + Engineering Governance Lead | Identify sections to update for future phases |
| Annual review | Each calendar year | Engineering Governance Lead | Identify obsolete guidance; update or retire |

### 40.4 Change Control

Changes to the PMIC follow the same Engineering Decision protocol as changes to IEF specifications:

| Change Type | Authority | Classification |
|---|---|---|
| Correction of a factual error | Chief Platform Engineer | No EDR required; commit message documents the change |
| Interpretation clarification | Engineering Governance Lead | No EDR required |
| Standard relaxation | Chief Software Architect | EDR required |
| Standard tightening | Engineering Governance Lead | EDR required |
| New section addition | Chief Software Architect | EDR required |
| Section removal | Chief Software Architect | EDR required |
| Classification change (MANDATORY → RECOMMENDED) | Chief Software Architect | EDR required |

No change to a MANDATORY classification is made without an Engineering Decision, regardless of how obvious or minor the change appears.

### 40.5 Engineering Ownership

The PMIC is owned by the Chief Software Architect. Day-to-day governance decisions are delegated to the Engineering Governance Lead. The Chief Platform Engineer is the primary consumer of Part 2 during implementation. The Technical Program Manager is the primary consumer of Part 3 during progress tracking.

Ownership does not transfer on personnel change. It transfers by explicit decision, documented in the project governance record.

### 40.6 Relationship with FEOS

The FEOS is the supreme authority. The PMIC operates beneath it in the authority hierarchy (§4.2). In any conflict between the PMIC and the FEOS:

- The FEOS governs
- The conflict is documented as a Class C stop condition
- An Engineering Decision resolves the conflict by updating the PMIC (not the FEOS)

The FEOS is never modified to comply with the PMIC.

### 40.7 Relationship with KEB

The KEB documents engineering knowledge that is non-obvious and hard-won. The PMIC documents the standards and governance that shape how work is done. They operate at different abstraction levels and serve different audiences.

The KEB is a reference document for future decisions. The PMIC is an authority document for current execution. When they conflict, the PMIC governs during active execution; the conflict is reviewed post-execution and the KEB is updated if the PMIC's position represents a settled engineering position.

### 40.8 Relationship with Future Platform Phases

Future platform phases (Phase 5.x, 6.x) inherit the PMIC governance framework by reference. They do not re-establish stop conditions, recovery protocols, quality gate sequences, or commit standards. They reference the PMIC and document only what changes.

The Phase 4.5 PMIC remains the baseline. Future phases extend it:

- They may add features to the execution queue (which becomes a new queue, not an extension of the F01–F10 queue)
- They may add stop conditions (new SC codes, higher than SC-014)
- They may tighten standards (lower classification from RECOMMENDED to MANDATORY)
- They may add new Engineering Decision triggers

Future phases MUST NOT relax standards established here without a formal Engineering Decision. The default is that Phase 4.5 standards become the minimum floor for all future platform work.

---

## Document Status

| Field | Value |
|---|---|
| Part 1 | COMPLETE — Governance & Execution Authority |
| Part 2 | COMPLETE — Infrastructure Engineering Standards |
| Part 3 | COMPLETE — Execution Orchestration, Final Acceptance & Platform Closure |
| **Overall PMIC** | **COMPLETE** |
