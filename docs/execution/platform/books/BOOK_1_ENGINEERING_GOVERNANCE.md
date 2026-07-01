# BOOK 1 — ENGINEERING GOVERNANCE
# FactoryERP Platform Engineering
# Permanent Governance Authority

| Field | Value |
|---|---|
| **Book** | Book 1 — Engineering Governance |
| **Series** | FactoryERP Platform Engineering Books |
| **Version** | 1.0 |
| **Status** | ACTIVE |
| **Classification** | Permanent Engineering Governance |
| **Authority Level** | Level 3 — Platform Master Implementation Contract |
| **Created** | 2026-07-01 |
| **Owner** | Chief Software Architect |
| **Review Cycle** | Annual; or on major platform phase transition |

---

# Chapter 1: Document Identity

## 1.1 Purpose

Book 1 is the permanent engineering governance authority for all Platform implementation work conducted within the FactoryERP engineering organization. It establishes the principles, policies, standards, and operational rules that govern how infrastructure is designed, implemented, reviewed, accepted, and maintained.

This Book exists to prevent two categories of engineering failure: uncoordinated action and undocumented decision. Uncoordinated action occurs when engineers implement without a shared authority framework, producing infrastructure that contradicts itself across features, phases, and time. Undocumented decision occurs when engineering choices are made without record, forcing future engineers to rediscover constraints that were already learned at cost.

Book 1 eliminates both categories by establishing a single, authoritative, version-controlled governance record that every platform engineer inherits before touching the repository.

## 1.2 Mission

To ensure that every act of platform engineering — from a single configuration file to a multi-feature phase — is traceable to a governance principle, accountable to an authority, verifiable by a quality gate, and recoverable from any failure state.

## 1.3 Vision

A FactoryERP engineering environment in which:

- Any qualified engineer can establish a working development environment from a clean checkout in under fifteen minutes on any supported operating system.
- Every infrastructure decision is auditable to its rationale without interrogating the engineer who made it.
- Quality gates make defects structurally impossible to commit rather than procedurally discouraged.
- The platform serves the application — it never competes with it, slows it, or contradicts it.

## 1.4 Scope

Book 1 governs:

- All Platform engineering phases, beginning with Phase 4.5 (Cross-Platform Development Environment)
- All infrastructure artifacts: container definitions, CI pipelines, bootstrap scripts, editor configuration, DevContainer definitions, environment specifications
- All engineering governance processes: stop conditions, recovery workflows, Engineering Decision Reports, quality gate sequences, commit standards, feature execution, and phase acceptance
- All roles involved in platform engineering: from implementation engineer through architect to Quality Assurance Director

## 1.5 Out of Scope

Book 1 does not govern:

- Application source code (`src/`), which is the domain of application engineering phases
- Prisma schema or database migrations, which are governed by the database migration workflow in the FEOS
- Business logic, domain models, or API design
- Production deployment infrastructure (reserved for future CD phases)
- Third-party service integration (authentication providers, payment processors, etc.)
- Team organization, hiring, or personnel decisions

## 1.6 Audience

| Audience | Usage |
|---|---|
| Chief Software Architect | Authority and oversight; final acceptance and certification |
| Chief Platform Engineer | Primary execution consumer; all implementation decisions |
| Principal DevOps Engineer | CI/CD and containerization implementation |
| Principal Infrastructure Engineer | Environment standardization and toolchain decisions |
| Engineering Governance Lead | Stop condition classification; EDR review; policy interpretation |
| Technical Program Manager | Progress tracking; scheduling; escalation management |
| QA Director | Final acceptance co-authorization; quality evidence review |
| Future Platform Engineers | Onboarding reference; standards inheritance |

## 1.7 Ownership

Book 1 is owned by the Chief Software Architect. Operational stewardship is delegated to the Engineering Governance Lead for day-to-day interpretation and the Chief Platform Engineer for implementation guidance. Ownership transfers by explicit written decision recorded in the project governance register, not by default on personnel change.

## 1.8 Review Cycle

| Review Type | Trigger | Owner | Scope |
|---|---|---|---|
| Phase-boundary review | Completion of any platform phase | Chief Software Architect | Accuracy, completeness, forward applicability |
| Annual review | Calendar year boundary | Engineering Governance Lead | Identify obsolete guidance; update or retire |
| Incident-triggered review | Class C–E stop condition resolution | Engineering Governance Lead | Was Book 1 the root cause or a contributing factor? |
| Change-control review | Any proposed modification | Engineering Governance Lead | Impact on downstream chapters |

## 1.9 Versioning Strategy

| Version | Trigger | Authority |
|---|---|---|
| 1.0 | Initial authoring (Phase 4.5) | Chief Software Architect |
| 1.x | Addenda: clarifications, new examples, minor standard adjustments | Engineering Governance Lead |
| 2.0 | Structural reorganization; new platform phase introduces architectural governance changes | Chief Software Architect + Engineering Governance Lead |

Version 1.x changes are append-only at the section level. No content is deleted without a corresponding Engineering Decision. Superseded content is marked `[SUPERSEDED by §X.Y / Book N §X.Y]` and retained for auditability.

## 1.10 Document Status

| Chapter | Status |
|---|---|
| Chapter 1 — Document Identity | COMPLETE |
| Chapter 2 — Current Repository State | COMPLETE |
| Chapter 3 — Authority Hierarchy | COMPLETE |
| Chapter 4 — Engineering Governance Principles | COMPLETE |
| Chapter 5 — Execution Philosophy | COMPLETE |
| Chapter 6 — Execution Orchestration | COMPLETE |
| Chapter 7 — Continuous Execution Policy | COMPLETE |
| Chapter 8 — Stop Conditions | COMPLETE |
| Chapter 9 — Recovery Policy | COMPLETE |
| Chapter 10 — Engineering Decision Policy | COMPLETE |
| Chapter 11 — Governance Validation | COMPLETE |

## 1.11 Terminology

| Term | Definition |
|---|---|
| Feature | A discrete, named, bounded infrastructure implementation unit (F01–F10 in Phase 4.5) |
| Phase | A collection of features that together advance the platform to a defined maturity milestone (e.g., Phase 4.5) |
| Quality Gate | An automated, objective verification that must pass before a commit is made |
| Stop Condition | A defined event that halts execution and requires resolution before continuation |
| Engineering Decision Report (EDR) | A formal record of a decision that deviates from or extends the governing specification |
| FEOS | FactoryERP Engineering Operations Standard — the supreme authority |
| KEB | Knowledge Engineering Baseline — the organizational knowledge record |
| PMIC | Platform Master Implementation Contract — the execution authority for active platform phases |
| IEF | Infrastructure Execution Framework — the feature-level specification authority |
| CPB | Cross-Platform Blocker — an identified incompatibility across supported operating systems |
| Protected Path | A repository path that may not be modified during platform engineering phases |
| Transition | The validated movement of a feature from DONE to COMPLETE status |
| Certification | The formal, evidence-backed assertion that a platform phase meets all defined quality thresholds |
| Closure | The terminal event of a platform phase, after which no further changes are permitted under that phase |

---

# Chapter 2: Current Repository State

## 2.1 Repository Overview

| Property | State |
|---|---|
| Repository name | FactoryERP (`backend`) |
| Primary language | TypeScript (NestJS 11, Node.js 24.16.0) |
| Database | PostgreSQL 16 (Prisma 6.16.2, `factory` schema) |
| Architecture | Clean Architecture — Controllers → Use Cases → Services → Repositories → PrismaService |
| Primary branch | `main` |
| Branch strategy | Linear history; no merge commits on `main` |
| Current phase | Phase 4.5 — Cross-Platform Development Environment |
| Phase status | ACTIVE — F01 COMPLETE; F02–F10 remaining |

## 2.2 Completed Modules

| Module | Status |
|---|---|
| FEOS (FactoryERP Engineering Operations Standard) | COMPLETE |
| Knowledge Engineering Baseline | COMPLETE |
| Platform (application foundation) | COMPLETE |
| Inventory Module | COMPLETE |
| Production Module | COMPLETE |
| Production Module Official Closure | COMPLETE |

## 2.3 Completed Phases

| Phase | Description | Status |
|---|---|---|
| Phase 0 — Database Bootstrap | PostgreSQL schema (SQL scripts, phases 0–20) | COMPLETE |
| Phase 1 — Core Infrastructure | PrismaService, LoggerModule, GlobalValidationPipe, Filters | COMPLETE |
| Phase 2 — Authentication | JWT, SessionService, LoginUseCase | COMPLETE |
| Phase 3 — Domain Modules | Inventory, Production | COMPLETE |
| Phase 4 — Module Closure | Production Closure, Documentation | COMPLETE |
| Phase 4.5 — Platform Engineering | Cross-Platform Infrastructure (F01–F10) | ACTIVE |

## 2.4 Infrastructure Status

| Infrastructure Component | Status |
|---|---|
| `.nvmrc` (Node 24.16.0) | PRESENT — F01 COMPLETE |
| `package.json` `engines` field | PRESENT — F01 COMPLETE |
| `.gitattributes` | ABSENT — F02 pending |
| `.editorconfig` | ABSENT — F02 pending |
| `.env.example` | ABSENT — F03 pending |
| `docker-compose.dev.yml` | ABSENT — F04 pending |
| `scripts/` (doctor, setup, reset) | ABSENT — F05 pending |
| `.devcontainer/` | ABSENT — F06 pending |
| `.github/workflows/ci.yml` | ABSENT — F07 pending |
| Cross-platform validation | PENDING — F08 |
| `README.md` developer documentation | ABSENT — F09 pending |
| Platform Final Validation | PENDING — F10 |

## 2.5 Repository Health

| Metric | Current State |
|---|---|
| Build | PASS (`nest build`) |
| Lint | PASS (`eslint` — 0 errors) |
| Tests | PASS (482/482) |
| Prisma Validate | PASS |
| Git history | Linear on `main` |
| Working tree | Clean |
| Protected directories | Unmodified |
| Known security vulnerabilities (high) | Under assessment — F07 will enforce `npm audit --audit-level=high` |

## 2.6 Current Build State

The application builds successfully as a NestJS monolith using `nest build`. TypeScript is compiled with `isolatedModules: true` and `strictNullChecks: true`. The build output resides in `dist/` (gitignored). The build is stable and has not been destabilized by any Phase 4.5 work to date.

## 2.7 Testing Status

482 Jest unit tests pass across 42 test suites. No tests have been added or removed since Phase 4.5 began. The test count is a protected metric: it must not decrease during Phase 4.5. Tests cover application logic exclusively; infrastructure components (Docker, CI, scripts) are not unit-tested — they are validated through operational verification in their owning feature reports.

## 2.8 Git Status

The repository is synchronized with the remote `main` branch. The last meaningful commits are the Phase 4.5 governance documents (PMIC Parts 1–3, IEF) and the F01 implementation (`fd04f2a`). The working tree is clean. No uncommitted changes exist.

## 2.9 Current Branch Policy

| Rule | Standard |
|---|---|
| Primary branch | `main` |
| Force push to `main` | PROHIBITED (FEOS) |
| Merge commits on `main` | PROHIBITED |
| History rewriting after push | PROHIBITED |
| Feature branches | Permitted for experimentation; Phase 4.5 implementation commits directly to `main` |
| Branch protection | To be enforced by F07 (CI Pipeline) |

## 2.10 Remaining Platform Features

| Feature | Name | Depends On |
|---|---|---|
| F02 | Repository Hygiene | F01 |
| F03 | Environment Standardization | F02 |
| F04 | Docker Development Environment | F03 |
| F05 | Bootstrap Scripts | F04 |
| F06 | DevContainer | F04, F05 |
| F07 | CI Pipeline | F01–F06 |
| F08 | Cross-Platform Validation | F07 |
| F09 | Developer Documentation | F04–F08 |
| F10 | Platform Final Validation | F01–F09 |

## 2.11 Deferred Work

| Deferred Item | Reason | Target |
|---|---|---|
| Redis container | Application has no caching layer yet | Future phase |
| MailHog container | Email feature not implemented | Future phase |
| CD pipeline | Out of Phase 4.5 scope | Future DevOps phase |
| Secrets vault integration | Production concern | Future phase |
| Fedora 40 local validation | Tertiary OS; DevContainer provides coverage | Post Phase 4.5 |
| GitHub Codespaces | Secondary to DevContainer | Post Phase 4.5 |
| `security.yml` scheduled workflow | Recommended, not blocking | Post Phase 4.5 |

## 2.12 Risk Snapshot

| Risk | Severity | Mitigation |
|---|---|---|
| CRLF contamination from Windows development | MEDIUM | Resolved by F02 (`.gitattributes`) |
| `bcrypt` native module compilation on arm64 | LOW | Documented; CI runner provides Xcode CLI |
| `node_modules/.bin` path issues on Windows | LOW | `npx` invocations in all scripts and CI |
| Docker not available on macOS CI runners | LOW | Known; Docker validation scoped to Ubuntu CI |
| DevContainer arm64 image compatibility | LOW | Base image is multi-arch; confirmed |

## 2.13 Readiness Score

| Dimension | Score (Pre-Phase 4.5) | Target (Post-Phase 4.5) |
|---|---|---|
| Node version governance | 2/10 | 10/10 |
| Line-ending governance | 2/10 | 10/10 |
| Environment standardization | 1/10 | 9/10 |
| Docker infrastructure | 0/10 | 10/10 |
| DevContainer | 0/10 | 10/10 |
| CI/CD | 0/10 | 10/10 |
| Developer experience | 1/10 | 10/10 |
| Cross-platform testing | 0/10 | 9/10 |
| Secrets management | 3/10 | 10/10 |
| Onboarding documentation | 1/10 | 9/10 |
| **Overall** | **17/100** | **≥ 97/100** |

---

# Chapter 3: Authority Hierarchy

## 3.1 Governance Hierarchy

Six governance layers define the FactoryERP engineering authority structure. Each layer is subordinate to every layer above it. A lower-layer document may never contradict, override, or reinterpret a higher-layer document without an Engineering Decision that is approved at the authority level of the document being modified.

| Level | Name | Abbreviation | Nature |
|---|---|---|---|
| L1 | FactoryERP Engineering Operations Standard | FEOS | Inviolable; permanent; never modified by phase execution |
| L2 | Knowledge Engineering Baseline | KEB | Organizational knowledge record; updated at phase boundaries |
| L3 | Platform Master Implementation Contract | PMIC | Phase execution authority; governs active platform work |
| L4 | Infrastructure Execution Framework | IEF | Feature-level specification; governs individual feature scope |
| L5 | Engineering Decision Reports | EDR | Point-in-time deviation records; subordinate to all above |
| L6 | Repository | — | The implemented state; what the code actually does |

## 3.2 Authority Precedence

In any situation where two governance documents appear to give conflicting direction:

1. The higher-level document always wins.
2. The conflict is classified as a stop condition (SC-009 — Architecture Conflict).
3. The conflict is documented in an Engineering Decision Report.
4. The lower-level document is updated to align with the higher-level document.
5. The repository state is never updated to implement the conflict — it waits for resolution.

No exception to this precedence order exists. An engineer who believes a higher-level document is wrong escalates the concern to the document's owner for a formal review; they do not implement their preferred interpretation and document it as an EDR.

## 3.3 Conflict Resolution

| Conflict Type | Resolution Path | Authority |
|---|---|---|
| FEOS vs. any lower level | FEOS governs; lower level updated | Chief Software Architect |
| KEB vs. PMIC | KEB governs; PMIC alignment documented in EDR | Chief Software Architect + Knowledge Architect |
| PMIC vs. IEF | PMIC governs; IEF updated or EDR issued | Chief Software Architect |
| IEF vs. EDR | IEF governs; EDR reviewed and revised if necessary | Engineering Governance Lead |
| EDR vs. EDR | Later-dated EDR supersedes; earlier marked SUPERSEDED | Engineering Governance Lead |
| Repository vs. any governance document | Governance document governs; repository brought into alignment | Chief Platform Engineer |

A conflict discovered during implementation that cannot be resolved within the feature's scope triggers a Class C stop condition. Implementation halts. The conflict is escalated before any repository change is made.

## 3.4 Escalation Workflow

| Stage | Trigger | Action | Owner |
|---|---|---|---|
| Stage 1 | Engineer identifies potential conflict | Document the conflict; halt implementation | Chief Platform Engineer |
| Stage 2 | Chief Platform Engineer confirms conflict | Classify stop condition; notify Engineering Governance Lead | Engineering Governance Lead |
| Stage 3 | Governance Lead reviews | Determine authority precedence; recommend resolution | Engineering Governance Lead |
| Stage 4 | Resolution requires architecture decision | Issue EDR; escalate to Chief Software Architect | Chief Software Architect |
| Stage 5 | Architect approves resolution | Update lower-level document; resume implementation | Chief Platform Engineer |

Stages may not be skipped. Stage 5 cannot be reached before Stage 1 is formally documented. The total escalation time is not bounded — correctness takes precedence over speed.

## 3.5 Override Policy

Overrides are not permitted. An override, in this context, means implementing a behavior that contradicts a governance document while claiming that "the intent" of the document permits it. Overrides are implementation choices masquerading as governance decisions.

When an engineer believes a governing rule is wrong for the current situation, the correct path is an Engineering Decision Report that documents the situation, the rule, the proposed deviation, and the rationale. The EDR is approved before the deviation is implemented.

## 3.6 Decision Ownership

| Decision Type | Owner | Approver |
|---|---|---|
| Feature scope (what files a feature may touch) | Chief Platform Engineer | Engineering Governance Lead |
| Stop condition classification | Engineering Governance Lead | Chief Software Architect (Class C+) |
| EDR approval | Engineering Governance Lead | Chief Software Architect (Class B+) |
| Quality gate failure resolution | Chief Platform Engineer | Self-certified (Class A); Architect (Class B+) |
| Repository certification | Chief Software Architect | Self (no delegation) |
| Platform Final Acceptance | Chief Software Architect | Co-signed by QA Director |
| Governance document modification | Engineering Governance Lead | Chief Software Architect |
| FEOS modification | Chief Software Architect | Board-level review (per FEOS own policy) |

## 3.7 Approval Matrix

| Action | CPE | EGL | CSA | QAD | TPM |
|---|---|---|---|---|---|
| Feature implementation commit | AUTH | NOTIFY | — | — | NOTIFY |
| Feature self-certification (F02–F09) | AUTH | — | — | — | — |
| Stop condition resolution (Class A) | AUTH | NOTIFY | — | — | NOTIFY |
| Stop condition resolution (Class B) | PROPOSE | AUTH | NOTIFY | — | NOTIFY |
| Stop condition resolution (Class C–E) | PROPOSE | REVIEW | AUTH | — | NOTIFY |
| EDR issuance | AUTH | REVIEW | APPROVE | — | — |
| PMIC modification | PROPOSE | AUTH | APPROVE | — | — |
| Repository certification | — | — | AUTH | — | — |
| Final acceptance | — | — | AUTH | CO-SIGN | — |
| Platform closure | — | REVIEW | AUTH | — | NOTIFY |

*CPE = Chief Platform Engineer; EGL = Engineering Governance Lead; CSA = Chief Software Architect; QAD = QA Director; TPM = Technical Program Manager*

## 3.8 Responsibilities

| Role | Primary Responsibility | Secondary Responsibility |
|---|---|---|
| Chief Software Architect | Governance authority; final decisions | Architecture integrity; FEOS stewardship |
| Chief Platform Engineer | Feature implementation; self-certification | Quality gate execution; feature reports |
| Engineering Governance Lead | Policy interpretation; EDR review | Stop condition classification; Book maintenance |
| QA Director | Quality evidence review; final acceptance co-sign | Quality gate policy; metrics oversight |
| Technical Program Manager | Progress tracking; escalation management | Velocity monitoring; deferred items register |
| Documentation Architect | Governance documentation standards | Book authoring; cross-reference validation |
| Principal DevOps Engineer | CI/CD implementation guidance | Container specification compliance |
| Principal Infrastructure Engineer | Environment standardization guidance | Cross-platform compatibility |

---

# Chapter 4: Engineering Governance Principles

This chapter establishes twenty governance principles. Each principle is permanent, normative, and applicable to all platform engineering work regardless of phase, feature, or engineer. Principles are classified MANDATORY or RECOMMENDED. MANDATORY principles are inviolable within their defined scope.

---

### Principle 1 — Governance Before Implementation

**Purpose:** Ensure that every implementation act is authorized by governance before it begins.

**Description:** No file is created, modified, or deleted in the repository without a governance artifact — at minimum, a feature definition in the IEF and a feature entry in the progress template — that authorizes the change.

**Rationale:** Implementation without governance produces repository state that cannot be audited, replicated, or safely modified. The cost of establishing governance before implementation is negligible compared to the cost of reverse-engineering intent from undocumented artifacts.

**Mandatory Requirements:**
- Every Phase 4.5 change traces to a named feature in the IEF.
- Every feature has a defined scope before implementation begins.
- No out-of-scope changes are made during a feature's implementation cycle.

**Violation Consequence:** SC-005 (Protected path modification) or SC-007 (Governance gap). Halt; document; resolve before continuing.

**Recovery:** Document the unauthorized change in an EDR. If the change is correct, retroactively formalize the governance. If the change is incorrect, revert it.

---

### Principle 2 — Architecture Preservation

**Purpose:** Ensure that infrastructure implementation never modifies, destabilizes, or reinterprets the application architecture.

**Description:** Platform engineering operates entirely within the infrastructure layer. Source code (`src/`), database schema (`prisma/`), tests (`test/`), and the FEOS (`docs/feos/`) are permanently protected from modification during any platform phase.

**Rationale:** The application architecture was established through deliberate engineering decisions made across multiple modules and phases. Platform engineering is a support function; it must not become an architecture function.

**Mandatory Requirements:**
- Protected paths are never modified by platform features (§3.3 of the PMIC).
- Any change that would benefit the application but violates this principle is deferred to an application engineering phase via the KEB.

**Violation Consequence:** SC-005 — Class B stop condition. Immediate halt.

**Recovery:** Revert the modification. Document the discovery of the required change in the KEB for future application engineering phases.

---

### Principle 3 — Quality Gate Sovereignty

**Purpose:** Make defects structurally impossible to commit by requiring all quality gates to pass before any commit is made.

**Description:** The four quality gates (build, lint, tests, Prisma validate) are the only objective authority on whether a repository change is safe to commit. No subjective assessment, time pressure, or expedience overrides a failing quality gate.

**Rationale:** Quality gates exist because human review is fallible and slow. A failing gate is not an inconvenience — it is information. It must be resolved, not bypassed.

**Mandatory Requirements:**
- All four quality gates must pass before any commit.
- Gates are run in the defined sequence: build → lint → test → prisma validate.
- No gate is skipped, abbreviated, or its failure rationalized.
- The `--no-verify` flag is permanently prohibited.

**Violation Consequence:** Any commit made with failing gates is a governance violation. The commit is reverted. An EDR documents the root cause. Quality gates are re-run on the reverted state.

**Recovery:** Revert the commit. Fix the failing gate. Re-run all four gates. Commit on a clean gate pass.

---

### Principle 4 — Deterministic Engineering

**Purpose:** Ensure that identical inputs to the engineering process produce identical outputs, regardless of who runs them, when, or on which supported operating system.

**Description:** Infrastructure artifacts (Compose files, DevContainer definitions, bootstrap scripts, CI pipelines) must produce the same environment and outcome when applied to the same inputs. Variation is a defect, not a feature.

**Rationale:** Non-deterministic infrastructure is infrastructure that cannot be debugged, cannot be relied upon in CI, and cannot be used to onboard new developers. Determinism is the foundational property of trustworthy infrastructure.

**Mandatory Requirements:**
- All tool versions are pinned (Node.js in `.nvmrc`, Docker images by exact tag, npm packages by lock file).
- Bootstrap scripts are idempotent.
- CI matrices run on exact OS images, not floating "latest" runners (where possible).
- No infrastructure artifact produces environment-dependent behavior when the inputs are equivalent.

**Violation Consequence:** Non-deterministic behavior is classified as a CPB (Cross-Platform Blocker) and triggers SC-011–SC-013.

**Recovery:** Identify the source of variation. Pin or constrain the variable component. Verify determinism across all supported platforms before closing the CPB.

---

### Principle 5 — Minimum Viable Change

**Purpose:** Limit the scope of every platform change to the absolute minimum required to satisfy the feature definition.

**Description:** A platform feature does exactly what its specification says, and nothing more. Opportunistic improvements, "obvious" enhancements, and "while I'm in here" changes are deferred — they are either out of scope for the current feature or they belong to a different feature.

**Rationale:** Scope creep in platform engineering produces two failure modes: (1) changes that are not governed by any quality gate sequence, and (2) interdependencies between features that were supposed to be independent. Both failure modes undermine the sequential execution model.

**Mandatory Requirements:**
- Every committed file traces to the feature specification.
- No file outside the feature's defined scope is modified, regardless of how beneficial the modification appears.
- Deferred improvements are documented in the feature report's "Deferred Items" section or in the progress template.

**Violation Consequence:** Any out-of-scope change constitutes a governance violation. The change is reverted or formalized via a new feature definition.

---

### Principle 6 — Single Source of Truth

**Purpose:** Ensure that every fact about the platform exists in exactly one authoritative location.

**Description:** No platform fact is duplicated across governance documents. If the Docker image version is stated in the PMIC, it is not re-stated in the feature report — the feature report cites the PMIC. If a quality gate sequence is defined in the PMIC, it is not re-defined in the IEF — the IEF references the PMIC.

**Rationale:** Duplication creates divergence. Two sources for the same fact will eventually disagree. The engineering team then has to determine which source is correct — which is exactly the kind of governance ambiguity this Book exists to prevent.

**Mandatory Requirements:**
- Every normative fact appears in the highest-authority document that owns it.
- Lower-authority documents reference, not repeat.
- When a source-of-truth document is updated, all referencing documents are reviewed for consistency.

**Violation Consequence:** A discovered duplication is a documentation inconsistency, classified as a Class A stop condition. The secondary source is updated to reference the primary.

---

### Principle 7 — Reversibility

**Purpose:** Ensure that every platform change can be cleanly reverted without affecting application functionality.

**Description:** Platform engineering operates in a domain where mistakes are possible. The architecture must allow any platform change to be rolled back to the prior known-good state. Application source code must never depend on infrastructure artifacts created during a platform phase.

**Rationale:** An irreversible infrastructure change is a liability. It cannot be undone if it introduces a defect, a security risk, or an incompatibility. Reversibility is what allows the engineering team to move fast without fear.

**Mandatory Requirements:**
- No application source code (`src/`) imports, requires, or references any artifact created during Phase 4.5.
- All infrastructure artifacts (configuration files, scripts, YAML) can be deleted from the repository without breaking the build or tests.
- Recovery from any stop condition includes a defined rollback path.

**Violation Consequence:** An irreversible change is classified as a Class C stop condition. The dependency is removed before implementation proceeds.

---

### Principle 8 — Documentation Parity

**Purpose:** Ensure that the governance documentation always reflects the actual state of the repository.

**Description:** Documentation and implementation are committed together. A feature whose implementation is committed without corresponding documentation is not DONE. A feature report that describes a different state than the committed files is a governance failure.

**Rationale:** Documentation that lags implementation is not documentation — it is historical fiction. Engineers making decisions based on stale documentation make decisions based on false premises.

**Mandatory Requirements:**
- The documentation commit for a feature follows the implementation commit with no intervening commits.
- Feature reports accurately describe the committed artifacts.
- The progress template is updated at every feature completion before the next feature begins.

**Violation Consequence:** Documentation lag constitutes a DONE → COMPLETE transition failure. The feature remains in DONE state until documentation is accurate and committed.

---

### Principle 9 — Auditability

**Purpose:** Ensure that the intent, evidence, and outcome of every engineering decision can be reconstructed from committed artifacts alone.

**Description:** An engineering decision that exists only in a conversation, a meeting, or an engineer's memory is not an engineering decision — it is tribal knowledge. All material decisions must be committed to the repository in a form that can be read, verified, and acted upon by an engineer who was not present when the decision was made.

**Rationale:** Engineering organizations change. Engineers leave, join, and change roles. A repository whose decision history can only be understood by its original authors is a repository that will be mismanaged the moment those authors are unavailable.

**Mandatory Requirements:**
- Material decisions are recorded in EDRs.
- Quality gate results are documented in feature reports.
- Stop condition resolutions are documented in the progress template and, where material, in EDRs.
- Commit messages follow Conventional Commits and include enough context to understand the why, not just the what.

**Violation Consequence:** An undocumented material decision is classified as a governance gap. The gap is closed by retroactively authoring the missing artifact before the feature is marked COMPLETE.

---

### Principle 10 — Cross-Platform Parity

**Purpose:** Ensure that all supported operating systems receive equal infrastructure quality.

**Description:** Infrastructure that works on Linux but fails on Windows is not cross-platform infrastructure — it is Linux infrastructure with an aspirational claim. Every Phase 4.5 artifact must be designed for all supported platforms from the first commit.

**Rationale:** Platform disparity creates two-tier engineering environments. Developers on the unsupported platform cannot contribute effectively, cannot run CI locally, and produce code that is not validated against the same baseline. This is a systemic quality risk.

**Mandatory Requirements:**
- All committed scripts, configuration files, and YAML must be syntactically valid and functionally correct on Windows 11, Ubuntu 24 LTS, and macOS 14 arm64.
- Cross-platform validation is verified by CI matrix across all three OS targets.
- A CPB (Cross-Platform Blocker) is raised for any OS-specific incompatibility and tracked to resolution.

**Violation Consequence:** A cross-platform incompatibility that reaches CI constitutes SC-011 or SC-012. The feature cannot be marked COMPLETE while the incompatibility is unresolved.

---

### Principle 11 — Secrets Hygiene

**Purpose:** Ensure that no credential, secret, key, or sensitive configuration value is committed to the repository at any time.

**Description:** The repository is a shared, version-controlled artifact. Anything committed to it becomes part of permanent history. Even a credential committed and immediately removed remains recoverable from git history. The only safe policy is that credentials never enter the repository at all.

**Rationale:** A repository with committed secrets is a compromised repository. The remediation (history rewriting, key rotation, audit) is disproportionately expensive compared to the prevention cost (using `.env` files and CI secrets).

**Mandatory Requirements:**
- `.env` is gitignored and never committed.
- `.env.example` is the only repository artifact that references environment variables by name.
- CI credentials are injected via the CI platform's secrets mechanism, never hardcoded in workflow files.
- Infrastructure files (Compose, DevContainer) use variable substitution, never literal credential values.
- The commit history is regularly inspected for accidental credential exposure.

**Violation Consequence:** A committed credential constitutes an immediate Class C stop condition. The credential is rotated immediately. The history is assessed for exposure risk. An EDR documents the incident and prevention measures.

---

### Principle 12 — Feature Isolation

**Purpose:** Ensure that each feature implementation is independent and bounded, with no hidden dependencies on the partial state of another in-progress feature.

**Description:** Features in the Phase 4.5 dependency graph (F01→F10) are implemented sequentially. At the time F03 begins, F01 and F02 are COMPLETE. F04 is PENDING. F03's implementation must not assume F04 exists, must not create files that F04 is supposed to create, and must not modify files that F04 is supposed to modify.

**Rationale:** Features that leak into each other's scope produce a repository state that can only be understood in the context of the full sequence. This defeats the purpose of sequential execution, where each step produces a verifiably correct intermediate state.

**Mandatory Requirements:**
- Feature scope is defined in the IEF before implementation begins.
- A feature's implementation touches only the files within its defined scope.
- A feature does not assume the existence of artifacts to be created by future features.
- A feature does not create artifacts that belong to future features.

---

### Principle 13 — Fail Fast

**Purpose:** Surface failures at the earliest possible point in the execution cycle, when the cost of correction is lowest.

**Description:** A quality gate failure is worth ten times more to the team if it is caught before the commit than after. A stop condition triggered at the repository validation step (before implementation) is worth ten times more than one triggered at the commit step (after implementation). The execution model is designed to surface problems early.

**Rationale:** The cost of a defect increases with time. A misconfigured Docker health check caught in F04 testing costs an hour. The same defect caught in F10 final validation, after it has been referenced by F05, F06, F07, and F09, costs days.

**Mandatory Requirements:**
- Repository validation (§6.3) runs before every implementation begins.
- Quality gates run before every commit, not after.
- Stop conditions are classified and acted upon immediately — they are never deferred to the next feature.
- The doctor script is designed to surface the full set of environment issues at once (not stop at the first failure).

---

### Principle 14 — Infrastructure Immutability

**Purpose:** Ensure that infrastructure artifacts, once committed and accepted, are not modified except through a governed change process.

**Description:** A committed and accepted infrastructure artifact is part of the engineering record. Modifying it without a governance justification breaks the auditability principle and introduces undocumented variation into the platform state.

**Rationale:** Infrastructure that changes without record is infrastructure that cannot be trusted. If a DevContainer definition silently changes after its feature is COMPLETE, subsequent features that depend on the DevContainer behavior are building on an unknown foundation.

**Mandatory Requirements:**
- Modifications to completed feature artifacts require a new feature or a change-control EDR.
- Modifications made under an emergency stop condition resolution are documented in an EDR before they are committed.
- The feature report for the original feature is updated with a cross-reference to the modifying change.

---

### Principle 15 — Progressive Maturity

**Purpose:** Ensure that the repository's infrastructure maturity is measured and visibly advancing with each completed feature.

**Description:** Infrastructure quality is not binary. The repository transitions from a maturity score of 17/100 to ≥ 97/100 through ten sequential, measurable improvements. Each feature's contribution to this maturity progression is documented, making the investment visible and traceable.

**Rationale:** Invisible progress leads to undervalued infrastructure investment. When the maturity score is tracked and reported, the organization can see the return on platform engineering effort — not just at Phase 4.5 closure, but at each feature boundary.

**Mandatory Requirements:**
- Maturity dimensions are assessed at each feature completion.
- The progress template reflects current maturity after each update.
- The Platform Final Report (§36 of the PMIC) includes the full maturity delta.

---

### Principle 16 — Zero Tolerance for Silent Failures

**Purpose:** Ensure that every failure in the platform engineering process is detected, classified, and acted upon — never ignored, deferred, or explained away.

**Description:** A quality gate failure that is noted but not resolved before a commit is a silent failure. A stop condition that is classified but not acted upon is a silent failure. A cross-platform incompatibility that is documented in a comment but not resolved before COMPLETE is a silent failure. Silent failures are not technical debt — they are governance debt that compounds.

**Rationale:** Engineering organizations that tolerate silent failures create cultures where failures become normal. The stop condition framework (Chapter 8) exists precisely to make every failure explicit, classified, and governed.

**Mandatory Requirements:**
- No commit is made while a quality gate fails.
- No feature is marked COMPLETE while a stop condition is active.
- Every triggered stop condition has a documented resolution or a documented deferral with approved justification.

---

### Principle 17 — Commit Atomicity

**Purpose:** Ensure that every commit represents a complete, coherent, independently verifiable change.

**Description:** A commit that partially implements a feature, or that contains changes from two different features, or that includes both implementation and configuration-only changes for unrelated purposes, is an atomic failure. It cannot be reviewed in isolation, reverted cleanly, or understood by a future engineer reading the git history.

**Rationale:** Git history is an engineering artifact. It is used for blame, for debugging, for reverting defects, and for understanding why the codebase is the way it is. A history of incomplete, mixed-purpose commits is a history that cannot be trusted.

**Mandatory Requirements:**
- One implementation commit per feature (with one optional documentation commit).
- No partial-feature commits on `main`.
- Quality gates pass on the committed state — not on a mental model of what the committed state will be after a follow-up commit.
- The exception (third commit) policy is defined and limited (PMIC §22.7).

---

### Principle 18 — Explicit Over Implicit

**Purpose:** Ensure that all platform governance, standards, and decisions are written down explicitly rather than relying on team convention, institutional knowledge, or assumed consensus.

**Description:** If a standard is not written in this Book or in a referenced governance document, it does not exist as a governance constraint. An engineer cannot be held accountable for violating an unwritten rule. Conversely, a written standard applies regardless of whether the engineer was aware of it — which is why onboarding requires reading this Book before beginning implementation.

**Rationale:** Engineering organizations change. Written governance persists. Implicit knowledge evaporates. The explicit standard is the durable standard.

**Mandatory Requirements:**
- Standards added during a phase are written into governance documents before they govern any implementation.
- Verbal decisions with governance implications are committed as EDRs within 24 hours.
- No feature is governed by a standard that was not written before the feature began.

---

### Principle 19 — Platform Independence from Application

**Purpose:** Ensure that the platform layer never creates a dependency that the application layer must satisfy.

**Description:** The application (NestJS source code in `src/`) should not need to change in order to accommodate Platform engineering decisions. Platform engineering adapts to the application — not the reverse.

**Rationale:** The application architecture was established first. The platform is infrastructure that serves the application. If the platform requires the application to change, the platform has exceeded its mandate.

**Mandatory Requirements:**
- No Phase 4.5 feature requires a change to `src/`, `prisma/`, or `test/`.
- Infrastructure configuration (Docker, DevContainer, CI) adapts to the application's existing environment variable structure, port assignments, and build commands.
- If a platform feature reveals an application-level improvement opportunity, the improvement is documented in the KEB for a future application engineering phase, not implemented during the platform phase.

---

### Principle 20 — Permanent Governance

**Purpose:** Ensure that the governance framework established in Phase 4.5 remains valid and applicable to all future platform phases.

**Description:** Engineering governance documents are not project artifacts — they are organizational infrastructure. Book 1 does not expire when Phase 4.5 closes. Its principles, policies, and standards are the floor for all future platform work.

**Rationale:** Each platform phase that builds on a solid governance foundation costs less and produces higher-quality outcomes than a phase that re-establishes governance from scratch. The investment in Book 1 pays compound dividends across every future phase.

**Mandatory Requirements:**
- Future platform phases inherit this Book by reference, not by copy.
- Chapters that require updates for a new phase are updated in Book 1 before the new phase begins implementation.
- New Books (Book 2, Book 3) extend this governance framework; they do not replace it.
- Governance decisions that contradict this Book require a formal amendment process, not informal override.

---

# Chapter 5: Execution Philosophy

## 5.1 Incremental Engineering

Phase 4.5 is executed through ten discrete, sequential features. Each feature produces a verified, committed, documented increment of platform capability. The intermediate state after each feature is a valid engineering state — not a work-in-progress state. This incremental approach ensures that any feature can be the last feature if execution must stop, and the repository remains in a known-good state.

Incremental engineering rejects the temptation to implement multiple features simultaneously or to "pre-load" future feature artifacts during a current feature. The value of incrementalism is predictability: the team always knows exactly what the repository contains and exactly what the next step is.

## 5.2 Infrastructure First

Infrastructure decisions establish constraints for all subsequent work. A Docker Compose file committed in F04 constrains the DevContainer configuration in F06. A CI matrix established in F07 constrains the cross-platform validation in F08. Decisions made early in the execution sequence must be made carefully because they are difficult to change without cascading impact.

Infrastructure First means accepting that the early features (F02–F05) have disproportionate influence on the overall platform. The governance burden on these features is correspondingly higher: they carry more stop conditions, require more careful specification review, and demand more rigorous quality gate execution.

## 5.3 Architecture Preservation

The application architecture is not a Phase 4.5 variable. NestJS Clean Architecture (Controllers → Use Cases → Services → Repositories → PrismaService) was established through deliberate engineering choices. The Prisma multi-schema configuration was established through deliberate migration decisions. The `isolatedModules` TypeScript constraint was established deliberately.

Platform engineering respects these decisions as given. If a platform engineering choice conflicts with an application architecture decision, the platform choice is the one that changes.

## 5.4 Repository Safety

The repository is the canonical artifact of FactoryERP engineering. Every commit to `main` is permanent (force-push is prohibited). Every committed file is part of the engineering record. Repository safety means treating every commit as if it will be reviewed by a future engineer who has no context from the current session — because it will be.

Repository safety also means maintaining the protected path policy throughout Phase 4.5. Source code, schema, and tests are off-limits not because they are fragile, but because their modification falls outside the Phase 4.5 mandate.

## 5.5 Documentation First

Documentation governs implementation, not the reverse. A feature's scope is documented in the IEF before implementation begins. A feature's outcome is documented in the feature report before it is declared DONE. The PMIC is committed before it governs any feature execution. The governance is always ahead of the work it governs.

Documentation First does not mean documentation is more important than working infrastructure. It means documentation is a precondition for working infrastructure — without it, "working" is undefined.

## 5.6 Quality First

Speed is not a value in Phase 4.5. Quality is. A feature that takes twice as long because a stop condition required investigation and resolution is a better outcome than a feature that completes quickly but introduces a defect that propagates through subsequent features.

Quality First means that quality gate failures are treated as meaningful events, not inconveniences. It means that a failing test is a higher-priority concern than feature progress. It means that "it works on my machine" is not an acceptable substitute for CI evidence.

## 5.7 Feature Isolation

Each feature is a self-contained unit of work. Its input is a repository in a known-good state. Its output is a repository in a new known-good state. The transformation between these two states is bounded by the feature specification. Nothing enters or exits the feature's scope without governance authorization.

Feature isolation is the mechanism that makes the execution sequence auditable. Each feature can be reviewed independently. Each feature's impact can be assessed independently. Each feature can be reverted independently without affecting the others (to the extent the dependency graph permits).

## 5.8 Deterministic Engineering

Given the same inputs — the same specifications, the same repository state, the same tool versions — two engineers implementing the same feature should produce substantially equivalent artifacts. Determinism is not perfectionism; it is predictability. The governance framework, the quality gates, and the feature templates all serve this goal.

Deterministic engineering is what makes automation possible. CI is deterministic engineering in practice: the same repository state, run through the same commands, on the same (specified) OS, produces the same result. When CI fails on a commit that passed locally, the failure reveals a non-determinism that must be resolved.

## 5.9 Continuous Execution

Phase 4.5 executes continuously. Features are not batched, scheduled, or planned across calendar time. A feature is begun as soon as its predecessor is COMPLETE and the repository is ready. There is no pause between features for planning, estimation, or approval — these activities happen within the feature's preparation phase.

Continuous execution is possible only because the execution framework is fully specified before implementation begins. The PMIC, the IEF, and this Book eliminate the need for mid-execution planning by front-loading governance.

## 5.10 Engineering Transparency

Every decision made during Phase 4.5 execution is visible to any authorized team member at any time. The progress template shows the current state. The feature reports show the evidence. The EDRs show the deviations and their rationale. The PMIC shows the standards. This Book shows the principles.

Engineering transparency is not a reporting requirement — it is a design property. The governance framework is designed so that transparency is the default output of normal execution, not an extra effort.

## 5.11 Long-Term Maintainability

Every Phase 4.5 artifact is designed to be understood and maintained by an engineer who had no involvement in its creation. This means: no clever tricks, no undocumented assumptions, no "it's obvious why" shortcuts. The governing test for any infrastructure decision is: can an engineer new to this repository understand this artifact from its content and the referenced governance documents, without asking anyone?

Long-term maintainability is the reason for commit message standards, feature reports, Engineering Decision Records, and this Book. The value of these artifacts compounds over time as the team changes, the codebase evolves, and the infrastructure decisions of Phase 4.5 become the baseline for Phase 5.x.

---

# Chapter 6: Execution Orchestration

## 6.1 Execution Lifecycle

Phase 4.5 execution passes through six sequential phases:

| Lifecycle Phase | Entry | Exit |
|---|---|---|
| L-1 Initialized | PMIC and Book 1 committed | F02 preparation begins |
| L-2 Active Execution | F02 IN PROGRESS | F09 COMPLETE |
| L-3 Final Validation | F10 IN PROGRESS | F10 COMPLETE |
| L-4 Certification | F10 COMPLETE | Repository Certification issued |
| L-5 Acceptance | Certification issued | Final Acceptance signed |
| L-6 Closed | Final Acceptance signed | Archive complete |

## 6.2 Execution State Machine

At any moment, execution is in exactly one of the following states:

| State | Code | Next States |
|---|---|---|
| ACTIVE | ACT | TRN (feature completes), PAU (stop condition triggered) |
| PAUSED | PAU | ACT (stop condition resolved), BLK (stop condition escalated) |
| BLOCKED | BLK | ACT (architect resolves) |
| TRANSITIONING | TRN | ACT (transition passes), PAU (transition fails) |
| CERTIFYING | CRT | ACC (certification issued), PAU (certification gap) |
| ACCEPTING | ACC | CLO (acceptance signed), CRT (evidence gap) |
| CLOSED | CLO | (terminal) |

## 6.3 Repository Validation

Repository validation runs before every feature begins. It is a read-only assessment of the repository's current state. The validation is complete only when all six checks are confirmed:

| Check | Required Result |
|---|---|
| `git status` | Clean working tree — no staged or unstaged changes |
| `git log` | Last commit is a known Phase 4.5 commit |
| `npm run build` | Exit 0 |
| `npm run lint` | Exit 0, 0 errors |
| `npm run test` | Exit 0, 482/482 |
| `DATABASE_URL="..." npx prisma validate` | Exit 0 |

A validation failure halts the feature before it begins. This is not a stop condition — it is a precondition failure. The repository must be brought to a known-good state before a stop condition is even classifiable.

## 6.4 Implementation

Implementation is the bounded phase in which files within a feature's defined scope are created or modified. Implementation begins only after repository validation passes. During implementation:

- Only in-scope files are touched.
- Every change is made with awareness of the cross-platform standards (Chapter 4, Principle 10).
- Quality gates are run at meaningful change boundaries, not only at the end.
- Any conflict with governance documents triggers an immediate stop.

## 6.5 Quality Gates

Quality gates are the objective commit authority. The sequence is fixed:

```
1. npm run build
2. npm run lint
3. npm run test
4. DATABASE_URL="..." npx prisma validate
```

Each gate must pass before the next is run. If any gate fails, the sequence restarts from gate 1 after the fix is applied. No gate is skipped. No gate result is assumed from a prior run.

## 6.6 Documentation

Documentation is produced as part of implementation, not after it. A feature's documentation obligations include:

- `reports/FXX_REPORT.md` — created with all mandatory sections
- `09_PLATFORM_PROGRESS_TEMPLATE.md` — updated to reflect DONE status with commit hash
- `ENGINEERING_DECISION_REPORT_FXX.md` — created if any deviation occurred
- Any referenced IEF sections with factual errors — flagged for correction in the EDR

## 6.7 Commit

The commit is the atomic delivery of a feature's implementation. The commit sequence is:

1. Stage all implementation files explicitly by name.
2. Verify staged files match feature scope.
3. Quality gates pass on staged state.
4. Implementation commit: `feat(platform/FXX): <description>`.
5. Stage documentation files (feature report, progress template).
6. Documentation commit: `docs(platform/FXX): <description>`.
7. Verify `git status` is clean.
8. Verify `git log --oneline -2` shows both commits.

## 6.8 Post-Commit Repository Audit

After the documentation commit, a brief repository audit confirms:

- `git status` is clean.
- `npm run build` passes on HEAD.
- `npm run test` passes (482/482) on HEAD.
- No protected paths appear in `git diff HEAD~2 -- src/ prisma/ test/`.

The post-commit audit is a verification, not a full quality gate cycle. Its purpose is to confirm the commit captured the intended state.

## 6.9 Automatic Transition

Automatic transition is the validated movement from DONE to COMPLETE. It executes the five-domain validation defined in the PMIC (§29): dependency verification, quality gate verification, repository validation, commit verification, documentation verification. All five must pass. A failing domain is a stop condition, not a skip.

## 6.10 Completion

A feature is COMPLETE when: (1) all implementation is committed, (2) all documentation is committed, (3) all four quality gates pass on HEAD, (4) the transition validation passes in all five domains. The progress template reflects COMPLETE. The execution queue advances. The next feature may begin.

## 6.11 Failure Path

A failure at any phase in the execution cycle follows this path:

```
Failure detected
  → Stop
  → Classify (which stop condition applies)
  → Document (progress template + EDR if warranted)
  → Notify (authority per Chapter 3 approval matrix)
  → Enter recovery (Chapter 9)
```

No remediation is attempted before the failure is classified and documented. An unclassified failure is an ungoverned failure.

## 6.12 Recovery Entry

Recovery re-enters the execution cycle at the phase that failed, after the root cause is resolved. It does not restart from the beginning of the feature (unless the scope of the failure requires a full restart). The recovery entry point is:

| Failure Phase | Recovery Entry |
|---|---|
| Repository validation | Repository validation (after fix) |
| Implementation | Implementation (after revert or fix) |
| Quality gates | Quality gate 1 (build), regardless of which gate failed |
| Documentation | Documentation (after correction) |
| Commit | Quality gates (after staging correction) |
| Transition | Failing transition domain |

---

# Chapter 7: Continuous Execution Policy

## 7.1 Automatic Progression

Phase 4.5 executes features continuously. When a feature satisfies all completion requirements and the transition validation passes, the next feature begins without waiting for external authorization. This automatic progression is the normal execution mode.

Automatic progression is suspended only by a stop condition, a dependency failure, or an explicit architect pause. In the absence of these events, the execution engine is always in motion.

## 7.2 Dependency Validation

Before a feature enters IN PROGRESS, its dependencies are validated:

| Dependency Check | Method | Required State |
|---|---|---|
| All predecessor features | Progress template | COMPLETE (not merely DONE) |
| No circular dependency | Graph inspection | Acyclic confirmed |
| Repository quality gates | Gate execution | All four PASS |
| No active stop condition | Progress template | None active |
| PMIC and IEF reviewed | Preparation checklist | Confirmed |

A feature with an unsatisfied dependency does not enter IN PROGRESS. It remains in PENDING or READY until the dependency is resolved.

## 7.3 Feature Sequencing

The execution sequence is:

```
F01 → F02 → F03 → F04 → F05 → F06 → F07 → F08 → F09 → F10
                              ↑___F05__|
```

F06 depends on both F04 and F05. All other dependencies are linear. The sequence is defined in the IEF and the PMIC (§24.1) and does not change during execution without an Engineering Decision at architect level.

## 7.4 Repository Validation at Transition

At every feature transition (from one feature to the next), the repository validation (§6.3) runs in full. The six-check validation must pass before the next feature enters IN PROGRESS. This prevents accumulated repository debt from being carried forward.

A transition validation failure is treated as a stop condition on the completing feature, not on the beginning feature. The completing feature remains DONE (not COMPLETE) until the transition validation passes.

## 7.5 Automatic Transition Criteria

The following eight conditions must all be satisfied simultaneously for automatic transition to proceed:

| Condition | Verification |
|---|---|
| Feature F(n) is DONE | Progress template |
| Feature report committed | `git log` |
| Progress template updated | `git log` |
| Quality gates PASS on HEAD | `npm run build && npm run lint && npm run test` |
| No active stop conditions | Progress template |
| All prerequisite features COMPLETE | Dependency check |
| Repository is clean | `git status` |
| No pending EDRs for F(n) | EDR register |

## 7.6 Feature Completion Signal

The DONE signal for a feature is implicit — it is the act of committing the feature report and updating the progress template to DONE. There is no external workflow or approval required for the DONE signal. The transition validation (§7.5) then runs automatically.

## 7.7 Repository Checkpoints

Three checkpoints govern the execution of every feature:

| Checkpoint | Timing | Purpose |
|---|---|---|
| CP-1: Pre-implementation | Before any file is created | Repository is in known-good state |
| CP-2: Pre-commit | After implementation, before commit | Quality gates pass on staged files |
| CP-3: Post-transition | After DONE; during transition to COMPLETE | Transition validation passes |

Each checkpoint is a synchronization point. Failure at any checkpoint halts forward progress.

## 7.8 Health Monitoring

The repository's health is monitored continuously through the quality gates. Any quality gate regression discovered outside of a feature implementation cycle (e.g., an npm package update causes a test failure) is treated as an out-of-band stop condition. The source of the regression is identified, an EDR is issued if the fix requires an architecture decision, and the repository is restored to a passing state before the next feature begins.

## 7.9 Execution Queue

The execution queue at Phase 4.5 initialization contains F02–F10 in order. Features are dequeued when their READY conditions are satisfied. The queue is static — no feature is inserted, removed, or reordered without an Engineering Decision.

If a feature is determined to be out of scope during Phase 4.5 (e.g., a dependency is removed because the application no longer needs it), the feature is not deleted from the queue — it is marked DEFERRED with documented justification, and the deferred feature is logged in the platform final report.

## 7.10 Transition Authority

Transitions for F02–F09 are self-authorized by the Chief Platform Engineer when all conditions in §7.5 are satisfied. No additional authorization is required.

The transition into F10 (from F09 COMPLETE to F10 IN PROGRESS) requires explicit acknowledgment from the Chief Software Architect. This is the single mandatory human checkpoint in the automatic execution model for L-2 Active Execution.

---

# Chapter 8: Stop Conditions

## 8.1 Stop Condition Framework

A stop condition is a defined event that requires execution to halt, the condition to be classified and documented, and resolution to occur before execution resumes. Stop conditions are not failures — they are the governance mechanism that prevents failures from propagating.

Every stop condition has a severity classification, a defined recovery path, and a required approval authority. No stop condition is resolved by ignoring it.

Stop conditions are classified by severity class:

| Class | Name | Resolution Authority | Time Expectation |
|---|---|---|---|
| A | Quality Gate | Self (Chief Platform Engineer) | < 4 hours |
| B | Architecture Boundary | Engineering Governance Lead + notification to Architect | < 1 day |
| C | Architecture Conflict | Chief Software Architect | < 2 days |
| D | Dependency Failure | Engineering Governance Lead + Architect | < 2 days |
| E | Platform Limitation | Chief Software Architect + possible scope change | Unbounded |

---

### SC-001 — Build Failure

**ID:** SC-001 | **Class:** A | **Severity:** HIGH

**Description:** `npm run build` exits with a non-zero exit code, indicating a TypeScript compilation error.

**Risk:** A failing build cannot be committed. Infrastructure changes that introduce TypeScript type errors are architecture violations.

**Impact:** Feature blocked; no commit possible.

**Detection:** Quality gate 1 execution; CI pipeline failure.

**Recovery:** Identify the TypeScript error. If the error exists in `src/` (unexpected, as source is protected), stop and escalate — this is a sign that a governance boundary was crossed. If the error is in newly created configuration files (unusual but possible for `.ts` type declaration files), correct the type error.

**Required Approval:** Self-certified (Class A).

**Escalation:** If the build failure cannot be resolved without touching protected paths, escalate to Class C.

**Expected Result:** Build passes with exit 0 after fix; all subsequent gates re-run from gate 1.

---

### SC-002 — Lint Failure

**ID:** SC-002 | **Class:** A | **Severity:** MEDIUM

**Description:** `npm run lint` reports one or more ESLint errors.

**Risk:** Lint errors indicate code style or quality violations. Phase 4.5 creates no TypeScript source files, so lint failures during Phase 4.5 are likely pre-existing or introduced by a protected-path modification.

**Impact:** Feature blocked; no commit possible.

**Detection:** Quality gate 2 execution; CI pipeline failure.

**Recovery:** Apply `npm run lint` (auto-fix is included in the npm script). If auto-fix fails to resolve all errors, investigate the root cause. Phase 4.5 features should not introduce new lint errors.

**Required Approval:** Self-certified (Class A).

**Escalation:** If lint failure results from a protected-path modification, escalate to Class B (SC-005).

**Expected Result:** Lint passes with exit 0 and 0 errors after fix.

---

### SC-003 — Test Failure

**ID:** SC-003 | **Class:** A | **Severity:** HIGH

**Description:** `npm run test` exits with a non-zero exit code or reports fewer than 482 tests passing.

**Risk:** A test failure during Phase 4.5 indicates either (a) a pre-existing test instability that has become visible, or (b) a protected-path modification has broken existing tests.

**Impact:** Feature blocked; no commit possible; test count must not decrease.

**Detection:** Quality gate 3 execution; CI pipeline failure.

**Recovery:** Identify the failing test suite. If the failure is intermittent (flaky test), document it in the KEB and investigate the root cause before proceeding. If the failure is consistent, determine whether Phase 4.5 implementation is responsible. Phase 4.5 features do not modify `src/` — a consistent test failure not attributable to external factors (node version change, npm package update) constitutes SC-005.

**Required Approval:** Self-certified for investigation (Class A); escalates to Class B if source modification is required.

**Escalation:** A consistent test failure requiring source modification is SC-003 + SC-005 combined; escalate to Class B.

**Expected Result:** All 482 tests pass after fix.

---

### SC-004 — Prisma Validate Failure

**ID:** SC-004 | **Class:** A | **Severity:** HIGH

**Description:** `npx prisma validate` exits with a non-zero exit code, indicating the committed `prisma/schema.prisma` is invalid.

**Risk:** A Prisma validation failure means the database client cannot be generated. This is a critical infrastructure failure.

**Impact:** Feature blocked; no commit possible; application cannot be built correctly.

**Detection:** Quality gate 4 execution; CI pipeline failure.

**Recovery:** Immediately verify whether `prisma/schema.prisma` was modified during the current feature implementation. The schema is a protected file. If the schema was modified, SC-005 applies. If the schema was not modified but validate fails, investigate Prisma CLI version compatibility and report the finding.

**Required Approval:** Self-certified if the schema is unmodified (Class A). If schema was modified, escalate to Class C.

**Expected Result:** Prisma validate passes with exit 0 after investigation and fix.

---

### SC-005 — Protected Path Modification

**ID:** SC-005 | **Class:** B | **Severity:** CRITICAL

**Description:** A committed or staged change modifies a protected path: `src/`, `prisma/`, `test/`, `docs/feos/`.

**Risk:** Protected paths contain the application architecture, schema, tests, and the supreme governance document. Modification during a platform phase crosses the architecture boundary and may invalidate the application's established invariants.

**Impact:** Feature blocked immediately. If already committed, the commit must be reverted.

**Detection:** `git diff HEAD -- src/ prisma/ test/ docs/feos/` returns a non-empty diff; post-commit repository audit.

**Recovery:** Revert the modification immediately. If the modification was a legitimate necessity (e.g., an npm package update caused a type change in a shared interface), document the necessity in an EDR and obtain architect approval before re-applying the change.

**Required Approval:** Engineering Governance Lead; notification to Chief Software Architect.

**Escalation:** If the modification cannot be reverted without breaking quality gates, escalate to Class C (SC-009).

**Expected Result:** Protected paths are unmodified. Git history shows the revert. EDR documents the incident.

---

### SC-006 — Credential Exposure

**ID:** SC-006 | **Class:** C | **Severity:** CRITICAL

**Description:** A credential, secret, key, or sensitive value is committed to the repository.

**Risk:** Committed credentials are part of permanent git history. Even if removed in a follow-up commit, the credential remains accessible via `git log` and must be treated as compromised.

**Impact:** Security incident. The affected credential must be rotated immediately, regardless of Phase 4.5 execution state.

**Detection:** Git history search; CI credential scan; manual review; external security scanner alert.

**Recovery:** (1) Rotate the affected credential immediately, before any other action. (2) Assess exposure: was the credential pushed to a remote repository? Was the remote repository public? (3) Attempt history rewrite only if exposure is limited and the git history has not been shared. In most cases, history rewrite is impractical — the credential rotation is the effective mitigation. (4) Document the incident in an EDR with root cause and preventive measures.

**Required Approval:** Chief Software Architect; security team if the organization has one.

**Escalation:** External incident response process if the credential has production scope.

**Expected Result:** Affected credential rotated. `.gitignore` and variable substitution patterns verified. EDR committed.

---

### SC-007 — Engineering Decision Required

**ID:** SC-007 | **Class:** B | **Severity:** MEDIUM

**Description:** The implementation of a feature requires a decision that deviates from, extends, or reinterprets a governing specification (IEF, PMIC, or Book 1 chapter).

**Risk:** Implementing without documenting the decision creates an undocumented governance gap. The deviation becomes invisible to future engineers.

**Impact:** Implementation paused until EDR is authored and approved.

**Detection:** Engineer identifies a conflict, gap, or ambiguity between the specification and the implementation approach; or quality gates cannot pass without a deviation.

**Recovery:** Stop implementation. Author an Engineering Decision Report documenting the situation, the governing specification, the proposed deviation, the rationale, and the expected impact. Submit for review per the EDR approval workflow (Chapter 10). Resume implementation only after the EDR is approved.

**Required Approval:** Engineering Governance Lead (review); Chief Software Architect (approve, if Class B+).

**Expected Result:** EDR committed before the deviation is implemented. Implementation proceeds in conformance with the approved EDR.

---

### SC-008 — Dependency Version Conflict

**ID:** SC-008 | **Class:** A | **Severity:** MEDIUM

**Description:** An npm package update (outside of Phase 4.5 scope) introduces a version conflict that causes a quality gate failure.

**Risk:** Package conflicts can cause build failures, type errors, or test failures that are unrelated to Phase 4.5 work but block feature execution.

**Impact:** Feature blocked until the conflict is resolved.

**Detection:** `npm run build` or `npm run test` fails after a package-related change.

**Recovery:** Identify the conflicting packages using `npm ls`. If the conflict is resolvable without changing `package.json` (e.g., via lockfile resolution), apply the fix. If `package.json` modification is required, an EDR is required (adding/modifying npm packages during Phase 4.5 is governed). If the conflict is in a transitive dependency, document in the KEB and assess whether `npm audit` surfaces a security concern.

**Required Approval:** Self-certified if lockfile-only fix (Class A). EDR required if `package.json` modification needed (Class B).

**Expected Result:** All four quality gates pass after resolution. No new packages added without EDR authorization.

---

### SC-009 — Architecture Conflict

**ID:** SC-009 | **Class:** C | **Severity:** HIGH

**Description:** The implementation of a feature requires a choice that contradicts the established application architecture, the FEOS, or the KEB.

**Risk:** An architecture conflict, if implemented without resolution, creates a fork between the repository state and the governance documents. All subsequent implementation builds on this fork.

**Impact:** Feature blocked. Implementation may need to be reverted if a conflict is discovered post-implementation.

**Detection:** Engineer identifies a conflict; code review reveals a conflict; architect review during EDR process.

**Recovery:** Stop. Document the conflict in an EDR. Escalate to the Chief Software Architect. The architect determines which document must be updated to resolve the conflict. The repository is not modified until resolution is approved.

**Required Approval:** Chief Software Architect.

**Escalation:** If the conflict is with FEOS, the resolution requires a formal FEOS amendment process — this cannot be resolved by an EDR alone.

**Expected Result:** Conflict resolved; PMIC or IEF updated; implementation proceeds in alignment with all governance documents.

---

### SC-010 — Unexpected Dependency

**ID:** SC-010 | **Class:** D | **Severity:** HIGH

**Description:** A circular dependency, an undocumented inter-feature dependency, or an unexpected dependency on an external system or tool is discovered during implementation.

**Risk:** An undocumented dependency compromises the sequential execution model. Features that were planned as independent turn out to share state, configuration, or assumptions.

**Impact:** Execution queue may need to be reordered. One or both features may need to be redesigned.

**Detection:** Implementation reveals that a file created by Feature F(n) conflicts with or depends on a file expected to be created by Feature F(m) where m > n.

**Recovery:** Stop. Document the discovered dependency. Assess whether the dependency graph can be preserved by reordering within the constraints of the known dependencies (requires EDR + architect approval) or whether one feature must be split or redesigned.

**Required Approval:** Engineering Governance Lead + Chief Software Architect.

**Expected Result:** Dependency graph updated in PMIC and IEF. Execution resumes with the corrected graph.

---

### SC-011 — Cross-Platform Build Failure

**ID:** SC-011 | **Class:** D | **Severity:** HIGH

**Description:** A committed artifact passes quality gates on the primary development platform (Windows 11 or Ubuntu) but fails on another supported platform in CI.

**Risk:** A platform-specific failure in CI means the platform cannot be claimed as cross-platform-ready. If the failure is in a primary platform (Windows or Ubuntu), the feature cannot be COMPLETE.

**Impact:** Feature blocked until the platform-specific failure is resolved.

**Detection:** CI matrix failure on one OS while others pass; F08 cross-platform validation failure.

**Recovery:** Reproduce the failure on the failing platform. Identify the platform-specific root cause (path separator, line ending, shell syntax, native module, etc.). Apply the fix using a platform-neutral approach. Commit the fix and verify all three CI targets pass.

**Required Approval:** Engineering Governance Lead for classification. Self-certified fix if the fix is within feature scope (Class D resolution is more complex than Class A but the fix itself may be simple).

**Expected Result:** CI matrix green on all three OS targets.

---

### SC-012 — Cross-Platform Script Failure

**ID:** SC-012 | **Class:** D | **Severity:** MEDIUM

**Description:** A bootstrap script (`setup.sh`, `doctor.sh`, `reset.sh`) passes on one platform but fails on another.

**Risk:** Bootstrap scripts that are not cross-platform produce inconsistent onboarding experiences. Developers on the failing platform cannot set up the development environment using the documented procedure.

**Impact:** F05 blocked or, if discovered post-F05, triggers a rework cycle.

**Detection:** CI matrix (Ubuntu: `.sh` scripts; Windows: `.ps1` equivalents); F08 cross-platform validation; developer report.

**Recovery:** Identify the incompatible construct (bash-ism in POSIX sh script, PowerShell 5.1 pipeline operator, path separator). Apply the platform-neutral alternative defined in the cross-platform standards (PMIC §13.9).

**Required Approval:** Engineering Governance Lead.

**Expected Result:** Doctor script exits 0 on all primary platforms. Setup script is idempotent on all primary platforms.

---

### SC-013 — Tool Version Incompatibility

**ID:** SC-013 | **Class:** D | **Severity:** MEDIUM

**Description:** A required tool version (Node.js, npm, Docker, Compose, Prisma CLI) is incompatible with a feature's implementation on one or more supported platforms.

**Risk:** Tool version incompatibilities produce non-deterministic behavior across platforms. The same command produces different results depending on the installed tool version.

**Impact:** Feature may not be verifiable across all supported platforms.

**Detection:** CI matrix failure related to tool behavior; doctor script failure; developer report.

**Recovery:** Identify the incompatible version. Assess whether the version can be pinned (via `.nvmrc`, Docker image tag, `engines` field) or whether the feature must be adapted to work within a version range. Document the version constraint in the relevant specification and the toolchain standards (PMIC §17).

**Required Approval:** Engineering Governance Lead.

**Expected Result:** Tool version compatibility confirmed across all supported platforms.

---

### SC-014 — DevContainer Build Failure

**ID:** SC-014 | **Class:** D | **Severity:** MEDIUM

**Description:** The DevContainer fails to build or fails to reach the required post-creation state on one or more supported host platforms.

**Risk:** A failing DevContainer blocks the alternative development environment path. Developers who rely on DevContainer cannot work.

**Impact:** F06 blocked.

**Detection:** VSCode "Reopen in Container" produces an error; DevContainer build fails in CI; `postCreateCommand` fails.

**Recovery:** Identify the failure (base image pull error, `npm ci` failure, `prisma generate` failure, port conflict). Apply the fix within F06 scope. If the failure is caused by an incompatibility with the Docker environment specification (F04), raise an inter-feature dependency conflict (SC-010).

**Required Approval:** Self-certified for simple fixes. Engineering Governance Lead if inter-feature dependency discovered.

**Expected Result:** DevContainer opens without error. Container reaches post-creation state: `npm run build` passes, `npm run test` passes (482/482).

---

### SC-015 — CI Pipeline Failure (Infrastructure)

**ID:** SC-015 | **Class:** D | **Severity:** HIGH

**Description:** The GitHub Actions CI pipeline fails due to an infrastructure issue (workflow syntax error, action version incompatibility, missing secret, runner unavailability) rather than a quality gate failure.

**Risk:** A non-functional CI pipeline means quality gates are not enforced across OS targets. The cross-platform guarantee is lost.

**Impact:** F07 blocked; CI cannot be declared COMPLETE.

**Detection:** GitHub Actions workflow run failure not attributable to a quality gate; workflow syntax validation failure.

**Recovery:** Identify the infrastructure failure. Validate workflow YAML syntax locally with `actionlint` or equivalent. Verify action version tags are valid. Confirm required secrets are configured in the repository settings. If the failure is a GitHub-side runner issue, document and retry after the platform recovers.

**Required Approval:** Self-certified for configuration fixes (Class D resolved by engineer within scope). Engineering Governance Lead if action version change or secret scope change is required.

**Expected Result:** CI pipeline executes successfully across all three OS targets.

---

### SC-016 — Commit Message Non-Conformance

**ID:** SC-016 | **Class:** A | **Severity:** LOW

**Description:** A commit message does not conform to the Conventional Commits format and Phase 4.5 scope convention (`feat(platform/FXX): ...` or `docs(platform/FXX): ...`).

**Risk:** Non-conforming commit messages degrade the auditability of the git history and may interfere with automated changelog generation in future phases.

**Impact:** Minor; does not block quality gates but must be corrected before the commit is used as evidence in a feature report.

**Detection:** Post-commit review; `git log` inspection.

**Recovery:** If the commit has not been pushed, amend the commit message. If the commit has been pushed to `main`, a follow-up commit documenting the correction is preferred over force-pushing. The FEOS prohibition on force-pushing `main` governs.

**Required Approval:** Self-certified.

**Expected Result:** Commit message conforms to Conventional Commits with Phase 4.5 scope.

---

### SC-017 — Progress Template Inconsistency

**ID:** SC-017 | **Class:** A | **Severity:** MEDIUM

**Description:** The progress template (`09_PLATFORM_PROGRESS_TEMPLATE.md`) reflects a state inconsistent with the actual repository state (e.g., feature marked DONE but no feature report committed; commit hash incorrect; quality gate status not updated).

**Risk:** The progress template is the single source of truth for execution state. An inaccurate progress template misleads the transition validation and the tracking responsibilities defined in Chapter 3.

**Impact:** Transition validation fails; execution paused.

**Detection:** Transition validation domain §29.7; post-commit audit.

**Recovery:** Reconcile the progress template with the actual repository state. Update the template to reflect the accurate state. Commit the correction as a documentation commit.

**Required Approval:** Self-certified.

**Expected Result:** Progress template accurately reflects repository state. Transition validation passes.

---

### SC-018 — Feature Report Incomplete

**ID:** SC-018 | **Class:** A | **Severity:** MEDIUM

**Description:** A feature report (`reports/FXX_REPORT.md`) is missing one or more mandatory sections as defined in the PMIC (§20.1).

**Risk:** An incomplete feature report means the feature's evidence record is incomplete. The feature cannot be marked COMPLETE under the PMIC's completion requirements.

**Impact:** Feature remains in DONE; COMPLETE transition blocked.

**Detection:** Documentation verification in transition validation (§29.7).

**Recovery:** Author the missing sections. Commit the corrected feature report as a documentation commit.

**Required Approval:** Self-certified.

**Expected Result:** Feature report contains all mandatory sections. Documentation verification passes.

---

### SC-019 — Gitignore Missing Entry

**ID:** SC-019 | **Class:** A | **Severity:** MEDIUM

**Description:** A generated artifact that should be gitignored (e.g., `dist/`, `coverage/`, `node_modules/`, `.env`) appears in `git status` as an untracked file.

**Risk:** An accidentally committed generated artifact pollutes the repository history and, if it contains sensitive data (e.g., a generated client with embedded connection strings), creates a security exposure.

**Impact:** Repository health check fails; commit is blocked if untracked files are present.

**Detection:** `git status` shows untracked files that should be gitignored; pre-commit check.

**Recovery:** Add the missing entry to `.gitignore` (within F02 scope if F02 is the current or last completed feature; otherwise, a new documentation commit is required). Verify that `git status` is clean after the `.gitignore` update.

**Required Approval:** Self-certified.

**Expected Result:** `.gitignore` covers all generated artifact paths. `git status` is clean.

---

### SC-020 — Binary File in Committed Set

**ID:** SC-020 | **Class:** A | **Severity:** MEDIUM

**Description:** A binary file that should not be committed (compiled executable, generated binary, lock file binary blob) is staged for commit.

**Risk:** Committed binaries inflate repository size, are not diff-able, and may contain platform-specific byte sequences that cause issues on other platforms.

**Impact:** The commit is held pending review of the binary's origin and purpose.

**Detection:** `git diff --staged --stat` shows binary files; pre-commit inspection.

**Recovery:** Unstage the binary file. If the file is a legitimate artifact (e.g., an SSL certificate for local development), add it to `.gitignore`. If the file is a generated output (e.g., `dist/main.js`), add it to `.gitignore`. If the file has a legitimate governance reason to be committed, document it in an EDR.

**Required Approval:** Self-certified if the file is clearly a generated artifact. EDR required if binary is intentionally committed.

**Expected Result:** No unintended binaries in the committed set.

---

### SC-021 — EDR Not Committed Before Deviation

**ID:** SC-021 | **Class:** B | **Severity:** HIGH

**Description:** A deviation from a governing specification is implemented and committed before the corresponding Engineering Decision Report is authored and approved.

**Risk:** An undocumented deviation creates a governance gap that cannot be audited. Future engineers encounter a state that contradicts the specification without any record of why.

**Impact:** The deviation commit may need to be reverted. The EDR must be authored retroactively.

**Detection:** Post-commit review; governance audit; transition validation.

**Recovery:** Author the EDR retroactively. The EDR must acknowledge that the deviation preceded its documentation (this is itself a governance finding). Submit for approval. If the deviation is not approved, revert the implementation.

**Required Approval:** Engineering Governance Lead.

**Escalation:** If the deviation contradicts a MANDATORY standard, escalate to Class C.

**Expected Result:** EDR committed; deviation either approved and retained, or reverted.

---

### SC-022 — `npm audit` High Severity Vulnerability

**ID:** SC-022 | **Class:** B | **Severity:** HIGH

**Description:** `npm audit --audit-level=high` reports one or more high-severity vulnerabilities in the dependency tree.

**Risk:** High-severity vulnerabilities represent exploitable security weaknesses. CI will fail with this stop condition active, meaning F07 cannot be completed while the vulnerability is unresolved.

**Impact:** F07 blocked; potentially earlier features blocked if the vulnerability is pre-existing.

**Detection:** CI step `npm audit --audit-level=high`; local `npm audit` execution.

**Recovery:** Assess the vulnerability: (1) Identify the affected package and the vulnerability details. (2) Determine if a fix is available (`npm audit fix`). (3) If `npm audit fix` would update `package.json`, an EDR is required (package changes are governed). (4) If no fix is available, assess whether the vulnerability is exploitable in the FactoryERP context. If not exploitable, document the assessment in an EDR and add an npm audit exception with justification. (5) If exploitable and no fix is available, escalate to Class C.

**Required Approval:** Engineering Governance Lead (audit exception). Chief Software Architect if fix requires `package.json` modification.

**Expected Result:** `npm audit --audit-level=high` exits 0. Vulnerability either resolved or documented exception committed.

---

### SC-023 — Documentation Contradiction

**ID:** SC-023 | **Class:** B | **Severity:** MEDIUM

**Description:** Two governance documents (any combination of FEOS, KEB, PMIC, IEF, Book 1, feature report, EDR) contain contradictory statements about the same fact.

**Risk:** A contradiction in governance documents means the engineer implementing against them cannot determine the correct behavior. Any implementation choice will violate one of the contradictory documents.

**Impact:** Implementation paused until the contradiction is resolved.

**Detection:** Implementation review; EDR authoring (which requires citing all relevant documents); governance audit.

**Recovery:** Identify both contradictory statements. Determine which document has higher authority (Chapter 3). Update the lower-authority document to align with the higher-authority document. Commit the correction.

**Required Approval:** Engineering Governance Lead for resolution. Chief Software Architect if the contradiction involves FEOS.

**Expected Result:** Contradiction resolved; both documents are consistent. Update committed.

---

### SC-024 — Maturity Score Below Target

**ID:** SC-024 | **Class:** A | **Severity:** MEDIUM

**Description:** At the phase boundary where a maturity dimension was expected to advance, the actual maturity score for that dimension is below the expected value.

**Risk:** Maturity gaps mean the platform does not deliver the expected engineering quality improvement. The gap may propagate to later features that depend on the maturity achievement.

**Impact:** Transition to the next feature may be blocked if the maturity gap is in a dimension that subsequent features require.

**Detection:** Maturity assessment at feature completion; PMIC §28.6 tracking.

**Recovery:** Identify the gap between the expected and actual maturity score. Determine which specific capability is missing. If the missing capability is within the current feature's scope, implement it. If it is out of scope, document it as a deferred item with the expectation that it will be addressed in a future feature or a targeted remediation commit.

**Required Approval:** Self-certified for gap identification. Engineering Governance Lead if scope expansion is required to close the gap.

**Expected Result:** Maturity score meets or exceeds the target for the completed feature. Gap documented in feature report if not fully resolved.

---

### SC-025 — Onboarding Verification Failure

**ID:** SC-025 | **Class:** D | **Severity:** HIGH

**Description:** An end-to-end onboarding verification (a developer following documented steps from a clean checkout reaches a running development environment) fails at F09 or F10 validation.

**Risk:** An onboarding failure means the Phase 4.5 primary user-facing deliverable — a reproducible development environment — does not work as documented. The phase cannot be certified while this condition exists.

**Impact:** F09 (Developer Documentation) or F10 (Platform Final Validation) blocked.

**Detection:** End-to-end onboarding test during F09 or F10 validation.

**Recovery:** Identify the exact step at which the onboarding process fails. Determine whether the failure is in the documentation (incorrect instruction), the infrastructure (missing or incorrect artifact), or the environment (developer machine configuration). Apply the fix in the appropriate layer. Re-run the end-to-end onboarding test after the fix.

**Required Approval:** Engineering Governance Lead.

**Expected Result:** End-to-end onboarding succeeds in under 15 minutes on at least one primary supported platform. Documentation updated to reflect any corrections.

---

### SC-026 — Final Acceptance Evidence Gap

**ID:** SC-026 | **Class:** C | **Severity:** HIGH

**Description:** At the Platform Final Acceptance stage, one or more mandatory evidence items (CI run URL, quality gate results, maturity score, git history linearity confirmation) are missing or unverifiable.

**Risk:** A Final Acceptance signed without complete evidence is not a valid acceptance — it is an assertion without proof. Future audits will identify the gap.

**Detection:** Acceptance checklist review during §32.2 workflow.

**Recovery:** Collect the missing evidence. If the evidence requires re-running a CI job, re-run it. If the evidence requires a manual verification, perform and document it. The acceptance workflow waits for complete evidence.

**Required Approval:** Chief Software Architect (determines what evidence is sufficient).

**Expected Result:** All evidence items in the acceptance checklist have corresponding verifiable evidence. Acceptance proceeds only with complete evidence.

---

### SC-027 — Git History Contamination

**ID:** SC-027 | **Class:** C | **Severity:** HIGH

**Description:** A merge commit, an orphaned commit, a force-pushed branch, or a non-linear history segment is detected on `main`.

**Risk:** Git history contamination violates the FEOS governance requirement for linear history and makes auditability unreliable.

**Impact:** Repository certification blocked until history is assessed and, if necessary, remediated.

**Detection:** `git log --merges` returns results; `git fsck --lost-found` shows orphaned commits; commit history shows non-linear segments.

**Recovery:** Assess the scope of contamination. If a merge commit was introduced accidentally, determine whether the merge can be reversed without data loss. Consult FEOS for guidance on history remediation — history rewriting on `main` is generally prohibited. Document the situation in an EDR. Engage the Chief Software Architect for the remediation path.

**Required Approval:** Chief Software Architect.

**Expected Result:** Git history is linear on `main`. Contamination documented. Future prevention measures committed.

---

### SC-028 — Node Version Mismatch in CI

**ID:** SC-028 | **Class:** A | **Severity:** MEDIUM

**Description:** The CI pipeline uses a Node.js version different from the one specified in `.nvmrc`.

**Risk:** A version mismatch between local and CI environments means that passing locally does not guarantee passing in CI. This undermines the determinism principle.

**Detection:** CI job `node --version` output; `actions/setup-node` configuration review; CI failure on Node-version-dependent behavior.

**Recovery:** Verify that `.github/workflows/ci.yml` uses `node-version-file: '.nvmrc'` in the `actions/setup-node` step. If not, update the workflow file within F07 scope.

**Required Approval:** Self-certified (Class A within F07 scope).

**Expected Result:** `node --version` in CI matches the content of `.nvmrc` (`24.16.0`).

---

### SC-029 — Incomplete Docker Health Check

**ID:** SC-029 | **Class:** A | **Severity:** MEDIUM

**Description:** A Docker service in `docker-compose.dev.yml` that requires a health check does not have one, or the health check is implemented using a `sleep`-based approach rather than a tool-based probe.

**Risk:** Without a proper health check, dependent services may start before their dependency is ready, producing intermittent startup failures that are difficult to debug and reproduce.

**Detection:** `docker compose config` inspection; F04 validation; `docker ps` showing no HEALTH status for stateful services.

**Recovery:** Add or correct the health check for the affected service. Use tool-based probes (`pg_isready`, `redis-cli ping`) with the minimum configuration defined in the Docker standards (PMIC §14.6).

**Required Approval:** Self-certified (within F04 scope).

**Expected Result:** All stateful services have health checks using tool-based probes. `docker ps` shows HEALTHY status within 60 seconds.

---

### SC-030 — Prisma Schema Modification Detected

**ID:** SC-030 | **Class:** C | **Severity:** CRITICAL

**Description:** `prisma/schema.prisma` has been modified during a Phase 4.5 feature implementation, either intentionally or accidentally.

**Risk:** The Prisma schema is the source of truth for the database structure. Any modification during Phase 4.5 could introduce breaking changes to the application's data layer, violate the schema's established custom enums, directives, and indexes, and cause the TypeScript client to diverge from the deployed database.

**Impact:** Immediate halt. Schema must be verified and, if modified, reverted immediately.

**Detection:** `git diff HEAD -- prisma/schema.prisma` returns a non-empty diff; `git diff --staged -- prisma/schema.prisma` returns a non-empty diff.

**Recovery:** Immediately run `git checkout HEAD -- prisma/schema.prisma`. Run `npx prisma generate` to restore the client. Run all four quality gates. If the modification was intentional (e.g., resolving a discovered inconsistency), escalate to Class C: the schema modification requires a full migration workflow and architect approval, not a platform engineering fix.

**Required Approval:** Chief Software Architect.

**Escalation:** Schema modification that cannot be reverted without data loss requires emergency escalation.

**Expected Result:** `git diff HEAD -- prisma/schema.prisma` returns empty. Prisma validate passes. Original schema is restored.

---

# Chapter 9: Recovery Policy

## 9.1 Recovery Philosophy

Recovery is the governance-controlled process of restoring the repository to a known-good state after a stop condition. Recovery never bypasses quality gates, never circumvents governance processes, and never treats symptoms when root causes are diagnosable. The cost of a proper recovery is always lower than the cost of an improper one that creates a second stop condition.

Every recovery follows the same structural pattern:
1. Stop all implementation work.
2. Assess the scope of the failure.
3. Document the finding.
4. Apply the minimum-scope fix.
5. Verify the fix resolves the root cause.
6. Re-run quality gates.
7. Document the resolution.
8. Resume execution from the appropriate checkpoint.

## 9.2 Build Failure Recovery

**Precondition:** `npm run build` exits non-zero.

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Review the build error output in full. |
| 2 | Identify the TypeScript error: file, line, error code. |
| 3 | Determine whether the error is in a Phase 4.5 artifact or in `src/`. |
| 4 | If in `src/`: halt — this is SC-005 (protected path). Escalate. |
| 5 | If in a Phase 4.5 artifact: correct the error within feature scope. |
| 6 | Re-run all four quality gates from gate 1. |
| 7 | Document the failure and resolution in the feature report. |

**Recovery exit criterion:** `npm run build` exits 0 and the full gate sequence passes.

## 9.3 Lint Failure Recovery

**Precondition:** `npm run lint` exits non-zero or reports errors.

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Review lint error output for affected files and rule names. |
| 2 | Apply `npm run lint` (auto-fix is included). |
| 3 | Review remaining errors (if any) after auto-fix. |
| 4 | If remaining errors are in Phase 4.5 artifacts: correct manually. |
| 5 | If remaining errors are in `src/`: halt — SC-005. Escalate. |
| 6 | Re-run all four quality gates from gate 1. |

**Recovery exit criterion:** `npm run lint` exits 0 with 0 errors.

## 9.4 Test Failure Recovery

**Precondition:** `npm run test` exits non-zero or reports fewer than 482 passing tests.

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Identify the failing test(s) from the test runner output. |
| 2 | Run the failing suite in isolation: `npm run test -- --testPathPattern=<suite>`. |
| 3 | Determine whether the failure is intermittent (flaky) or consistent. |
| 4 | If intermittent: document in KEB; run full suite three times to confirm; proceed if all three pass. |
| 5 | If consistent: determine root cause. |
| 6 | If root cause is a Phase 4.5 artifact: correct within feature scope. |
| 7 | If root cause requires `src/` modification: halt — SC-003 + SC-005. Escalate to Class B. |
| 8 | Re-run full test suite after fix. |

**Recovery exit criterion:** `npm run test` exits 0 with exactly 482 passing tests.

## 9.5 Prisma Failure Recovery

**Precondition:** `npx prisma validate` exits non-zero.

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Inspect the Prisma validate error output. |
| 2 | Run `git diff HEAD -- prisma/schema.prisma` to determine if the schema was modified. |
| 3 | If schema was modified: immediately run `git checkout HEAD -- prisma/schema.prisma`. Re-run `npx prisma generate`. Trigger SC-030. |
| 4 | If schema was not modified: investigate Prisma CLI version (`npx prisma --version`) and compatibility. |
| 5 | Document the finding in the feature report. |
| 6 | Re-run all four quality gates from gate 1 after any fix. |

**Recovery exit criterion:** `npx prisma validate` exits 0. Schema unchanged from HEAD.

## 9.6 Repository Corruption Recovery

**Precondition:** `git status`, `git fsck`, or `git log` reveals an unexpected state (orphaned commits, corrupt objects, incomplete merge state).

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Do not attempt to continue implementation. |
| 2 | Capture the full output of `git status`, `git log --oneline -10`, `git fsck`. |
| 3 | Identify the last known-good commit hash from the progress template. |
| 4 | Assess: is the corruption limited to the working tree, the index, or the object store? |
| 5 | Working tree corruption: `git checkout -- .` may restore. |
| 6 | Index corruption: `git reset HEAD` may restore. |
| 7 | Object store corruption: contact git infrastructure support. Document SC-027. |
| 8 | After recovery, run full validation: `git status` clean, all four quality gates pass. |

**Recovery exit criterion:** `git status` is clean. `git fsck` reports no errors. All four quality gates pass.

## 9.7 Git Conflict Recovery

**Precondition:** A merge conflict is present in the working tree (not expected in Phase 4.5 but possible if a branch was used for exploration).

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Do not commit while conflict markers are present. |
| 2 | Identify conflicting files: `git diff --name-only --diff-filter=U`. |
| 3 | Assess whether the conflict is in a protected path. If yes: SC-005 + SC-009. Escalate. |
| 4 | If conflict is in Phase 4.5 artifacts: resolve manually, preserving the governance-correct version. |
| 5 | After resolving: run all four quality gates. |
| 6 | Commit the resolution with an explanatory commit message. |

**Recovery exit criterion:** No conflict markers in repository. All four quality gates pass.

## 9.8 Dependency Conflict Recovery

**Precondition:** npm package conflict prevents `npm ci` or `npm install` from succeeding.

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Capture full `npm ci` error output. |
| 2 | Identify conflicting packages and version ranges. |
| 3 | Run `npm ls <package>` to trace the conflict origin. |
| 4 | Assess: is the conflict resolvable without `package.json` modification? |
| 5 | If yes (lockfile-only resolution): apply and verify. |
| 6 | If no: EDR required before `package.json` is modified. |
| 7 | After resolution: run all four quality gates. |

**Recovery exit criterion:** `npm ci` succeeds. All four quality gates pass.

## 9.9 Platform Incompatibility Recovery

**Precondition:** An infrastructure artifact works on one supported platform but fails on another (SC-011 or SC-012).

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Reproduce the failure on the failing platform (or in CI). |
| 2 | Isolate the incompatible construct (path separator, line ending, shell syntax, native module). |
| 3 | Apply the cross-platform standard from PMIC §13 to the affected artifact. |
| 4 | Verify the fix on both the original and the failing platform. |
| 5 | Commit the fix within the owning feature's scope. |
| 6 | Run all four quality gates after the fix. |
| 7 | Verify CI matrix passes on all three OS targets. |

**Recovery exit criterion:** CI matrix green on all three OS targets. Doctor script passes on both primary platforms.

## 9.10 Architecture Conflict Recovery

**Precondition:** A Phase 4.5 implementation choice contradicts the application architecture, the FEOS, or the KEB (SC-009).

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Stop immediately. Do not implement the conflicting choice. |
| 2 | Author an EDR documenting: the governing document, the conflicting requirement, the proposed deviation, and the rationale. |
| 3 | Submit the EDR to the Chief Software Architect for review. |
| 4 | Await architect decision: (a) approve the deviation, (b) reject the deviation and require alignment with the governing document, (c) update the governing document and proceed with implementation. |
| 5 | Implement based on the architect's decision. |
| 6 | Run all four quality gates after implementation. |

**Recovery exit criterion:** Architecture conflict resolved per architect decision. EDR committed. Implementation aligns with approved direction.

## 9.11 Documentation Conflict Recovery

**Precondition:** Two governance documents contain contradictory statements (SC-023).

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Identify both contradictory statements and their source documents. |
| 2 | Determine the authority hierarchy position of each document (Chapter 3). |
| 3 | The lower-authority document must be updated to align with the higher-authority document. |
| 4 | Author the correction as a documentation commit. |
| 5 | If the contradiction involves FEOS: the resolution requires a formal FEOS amendment process — escalate to Chief Software Architect. |
| 6 | Cross-reference the correction in an EDR if the contradiction was non-obvious. |

**Recovery exit criterion:** Both documents are consistent. No contradictory statements remain. Correction committed.

## 9.12 Repository Rollback

**Precondition:** A committed change must be reversed because it introduces a defect, violates governance, or is otherwise unacceptable.

**Recovery workflow:**

| Step | Action |
|---|---|
| 1 | Identify the commit hash to roll back to (the last known-good state). |
| 2 | Assess: has the commit been pushed to the remote? |
| 3 | If not pushed: `git reset --hard <hash>` and `git push --force-with-lease` (requires architect authorization given FEOS restrictions). |
| 4 | If pushed: use `git revert <hash>` to create a reverting commit. This preserves history per FEOS policy. |
| 5 | After rollback: run all four quality gates on the post-rollback state. |
| 6 | Document the rollback in an EDR or commit message with full rationale. |

**Recovery exit criterion:** Repository is at the intended known-good state. All four quality gates pass. Rollback documented.

## 9.13 Recovery Validation

After any recovery action, the following validation sequence confirms the recovery is complete:

| Validation Step | Expected Result |
|---|---|
| `git status` | Clean working tree |
| `git log --oneline -3` | Last three commits are known and expected |
| `npm run build` | Exit 0 |
| `npm run lint` | Exit 0, 0 errors |
| `npm run test` | Exit 0, 482/482 |
| `DATABASE_URL="..." npx prisma validate` | Exit 0 |
| `git diff HEAD -- src/ prisma/ test/` | Empty (protected paths unchanged) |

Recovery is not complete until all seven validations pass.

---

# Chapter 10: Engineering Decision Policy

## 10.1 When an EDR is Mandatory

An Engineering Decision Report is mandatory whenever:

| Trigger | Classification |
|---|---|
| A governing standard (MANDATORY) is not followed | MANDATORY EDR |
| A feature implements behavior outside its IEF specification | MANDATORY EDR |
| A protected path is modified for any reason | MANDATORY EDR |
| A npm package is added or removed from `package.json` | MANDATORY EDR |
| A tool version is changed (Node, Docker image, Prisma CLI) | MANDATORY EDR |
| A stop condition requires a resolution that involves a governance change | MANDATORY EDR |
| An implementation choice contradicts two governance documents | MANDATORY EDR |
| A feature's defined scope is expanded during implementation | MANDATORY EDR |
| A credential is committed (even briefly) | MANDATORY EDR |
| A CI secret scope or configuration is changed | MANDATORY EDR |
| A RECOMMENDED standard is not followed | RECOMMENDED EDR |
| An implementation technique differs from the IEF specification but achieves the same outcome | RECOMMENDED EDR |

## 10.2 Naming Convention

| Context | Name Format | Example |
|---|---|---|
| Feature-specific EDR | `ENGINEERING_DECISION_REPORT_FXX.md` | `ENGINEERING_DECISION_REPORT_F04.md` |
| Phase-level EDR (not feature-specific) | `ENGINEERING_DECISION_REPORT_P45_NNN.md` | `ENGINEERING_DECISION_REPORT_P45_001.md` |
| Book-level governance amendment | `BOOK_1_AMENDMENT_NNN.md` | `BOOK_1_AMENDMENT_001.md` |

EDR files are committed in `docs/execution/platform/`.

## 10.3 EDR Structure

Every EDR contains the following sections:

| Section | Content |
|---|---|
| Document Identity | ID, Title, Feature, Date, Author, Status |
| Triggering Condition | Which stop condition or governance gap triggered this EDR |
| Governing Reference | The specific FEOS / KEB / PMIC / IEF / Book 1 section being deviated from or amended |
| Situation | What implementation situation made the EDR necessary |
| Decision | The specific decision made |
| Rationale | Why this decision is correct for this situation |
| Alternatives Considered | What alternatives were evaluated and why they were rejected |
| Impact | Effect on the current feature; effect on future features; effect on governance documents |
| Implementation | How the decision will be implemented (no source code; procedural description only) |
| Cross References | All governance documents affected by this decision |
| Approval | Reviewer(s), Approver, Date |
| Status | DRAFT → UNDER REVIEW → APPROVED → SUPERSEDED |

## 10.4 Approval Process

| EDR Trigger Class | Reviewer | Approver | Timeline |
|---|---|---|---|
| Class A (quality gate resolution) | Self | Chief Platform Engineer | Immediate |
| Class B (architecture boundary) | Engineering Governance Lead | Engineering Governance Lead | Same day |
| Class C (architecture conflict) | Engineering Governance Lead | Chief Software Architect | Next business day |
| Class D (dependency failure, platform) | Engineering Governance Lead | Chief Software Architect | Next business day |
| Class E (platform limitation) | Engineering Governance Lead + Chief Architect | Chief Software Architect | Per complexity |

Implementation of a deviation does not proceed until the EDR is in APPROVED status.

## 10.5 EDR Lifecycle

| Status | Meaning | Transition |
|---|---|---|
| DRAFT | EDR authored; not yet submitted for review | → UNDER REVIEW |
| UNDER REVIEW | Submitted to reviewer; awaiting feedback | → APPROVED or REJECTED |
| APPROVED | Decision accepted; implementation may proceed | → SUPERSEDED (if later decision overrides) |
| REJECTED | Decision not accepted; alternative must be found | EDR updated and resubmitted, or SC-009 escalated |
| SUPERSEDED | A later EDR or governance amendment overrides this one | Reference to superseding document added |

## 10.6 Review Policy

EDRs in APPROVED status are reviewed at each phase-boundary review (§1.8). The review assesses:

- Is the decision still valid given the current platform state?
- Has the governing document been updated to reflect the decision?
- Should the decision be incorporated into Book 1 (making it permanent governance rather than a one-time decision)?

An approved EDR that represents a general engineering principle — not a one-time situation-specific decision — is a candidate for incorporation into Book 1 as an amendment.

## 10.7 Retirement Policy

An EDR is SUPERSEDED when a later governance document (PMIC amendment, Book 1 amendment, or newer EDR) addresses the same situation with greater authority or specificity. Superseded EDRs are:

- Updated with `[SUPERSEDED by <document reference>]` in the header.
- Retained in the repository (never deleted).
- Excluded from active governance reviews.

An EDR is not retired simply because the feature it governs is COMPLETE. The EDR is part of the permanent engineering record.

## 10.8 Cross References

Every EDR cross-references:

- The governing documents it deviates from or amends.
- The feature report(s) that implement the decision.
- The stop condition(s) that triggered it.
- Any EDRs that are superseded by or that supersede this one.

Cross-references use document name and section number, not line numbers.

## 10.9 Relationship with FEOS

FEOS is the supreme governance authority. An EDR cannot override FEOS. An EDR that appears to require a FEOS deviation is actually an escalation trigger: it surfaces the need for a formal FEOS amendment, which follows FEOS's own amendment process (defined in FEOS `02_PROJECT_GOVERNANCE.md`).

An EDR that contradicts FEOS, whether intentionally or through oversight, is invalid. It is rejected and the implementation that reflects it is reverted.

## 10.10 Relationship with KEB

EDRs document decisions made during execution. The KEB documents knowledge accumulated across execution. When an EDR reveals a non-obvious engineering constraint (e.g., "PowerShell 5.1 does not support pipeline chain operators"), that constraint is added to the KEB at the next phase boundary, ensuring the knowledge is available to all future engineers independently of the EDR.

## 10.11 Relationship with PMIC

The PMIC is the execution authority for the active platform phase. EDRs modify or extend the PMIC's standards on a point-in-time basis. If an EDR establishes a standard that should apply to all future features (not just the current one), the PMIC is updated to reflect the standard — and the EDR is marked SUPERSEDED by the PMIC amendment.

---

# Chapter 11: Governance Validation

## 11.1 Purpose

This chapter is the self-certification checklist for Book 1. It confirms that the document is internally consistent, compliant with all higher-authority governance documents, and complete in its coverage of the governance domain. It must be reviewed at every annual review cycle and every phase-boundary review.

## 11.2 Internal Consistency

| Check | Status |
|---|---|
| All chapter cross-references are valid (no reference to a non-existent section) | PASS |
| Stop condition IDs are unique (SC-001 through SC-030) | PASS |
| Recovery workflows in Chapter 9 correspond to stop conditions in Chapter 8 | PASS |
| Authority hierarchy in Chapter 3 matches the PMIC authority hierarchy | PASS |
| Terminology definitions in §1.11 are consistent throughout the document | PASS |
| Approval matrix in §3.7 is consistent with role definitions in §3.8 | PASS |
| Governance principles in Chapter 4 are non-contradictory | PASS |
| Execution philosophy in Chapter 5 is consistent with orchestration in Chapter 6 | PASS |
| Continuous execution policy in Chapter 7 is consistent with orchestration in Chapter 6 | PASS |
| EDR policy in Chapter 10 is consistent with stop condition references in Chapter 8 | PASS |

## 11.3 FEOS Compliance

| FEOS Requirement | Book 1 Compliance |
|---|---|
| FEOS is supreme governance authority | Stated in §3.1, §3.2, §10.9 |
| No force-push to `main` | Stated in §2.9 and PMIC references |
| Linear git history required | SC-027; §2.9 |
| Protected paths not modified during platform phases | Principle 2; SC-005 |
| Quality gates required before commit | Principle 3; §6.5 |
| Engineering decisions must be documented | Principle 9; Chapter 10 |
| Credentials not committed | Principle 11; SC-006 |

**FEOS Compliance:** CONFIRMED

## 11.4 KEB Compliance

| KEB Requirement | Book 1 Compliance |
|---|---|
| KEB is L2 authority; PMIC is L3 | §3.1 authority hierarchy |
| KEB is updated at phase boundaries, not during execution | §34.1 of PMIC; §10.10 |
| KEB contains non-obvious engineering knowledge, not derivable from code | §10.10 |
| KEB is never contradicted by execution-phase documents | §3.2 conflict resolution |

**KEB Compliance:** CONFIRMED

## 11.5 PMIC Compliance

| PMIC Requirement | Book 1 Compliance |
|---|---|
| PMIC is L3 authority; Book 1 operates as governance interpretation within L3 | §3.1 |
| Feature execution follows PMIC §23 template | §6.3–§6.12 |
| Stop conditions follow PMIC §6 classification | Chapter 8 (compatible; Book 1 adds SC-017 through SC-030) |
| Recovery follows PMIC §7 | Chapter 9 (extends PMIC with additional workflows) |
| EDR policy follows PMIC §8 | Chapter 10 (extends PMIC with full lifecycle) |
| Quality gates follow PMIC §21 | §6.5 |
| Commit standards follow PMIC §22 | §6.7 |
| Progress tracking follows PMIC §28 | §7.8 |

**PMIC Compliance:** CONFIRMED

## 11.6 IEF Compliance

| IEF Requirement | Book 1 Compliance |
|---|---|
| IEF is L4 authority; Book 1 does not override IEF feature specifications | §3.1 |
| IEF defines feature scope; Book 1 defines governance processes | Scope is clear; no overlap |
| IEF and Book 1 cross-reference each other | IEF references PMIC; Book 1 references IEF via PMIC §3.1 |

**IEF Compliance:** CONFIRMED

## 11.7 Cross-Reference Validation

| Cross-Reference | Verification |
|---|---|
| All PMIC references use section numbers | Confirmed (§XX.Y format) |
| All FEOS references use document names | Confirmed |
| All KEB references are at the category level (not line references) | Confirmed |
| All IEF references use document number and section | Confirmed |
| All stop condition references in Chapter 9 match Chapter 8 IDs | Confirmed |
| EDR lifecycle in §10.5 is consistent with approval matrix in §10.4 | Confirmed |

**Cross-Reference Validation:** PASS

## 11.8 Governance Completeness

| Governance Domain | Coverage |
|---|---|
| Authority hierarchy | Chapter 3 — COMPLETE |
| Governance principles | Chapter 4 — 20 principles — COMPLETE |
| Execution philosophy | Chapter 5 — 11 philosophy items — COMPLETE |
| Execution orchestration | Chapter 6 — 12 phases — COMPLETE |
| Continuous execution | Chapter 7 — 10 policy items — COMPLETE |
| Stop conditions | Chapter 8 — 30 stop conditions (SC-001–SC-030) — COMPLETE |
| Recovery policy | Chapter 9 — 12 recovery workflows — COMPLETE |
| Engineering decision policy | Chapter 10 — Full lifecycle — COMPLETE |
| Current repository state | Chapter 2 — Phase 4.5 baseline — COMPLETE |
| Permanent governance | Chapter 4 Principle 20; Chapter 1 §1.8 review cycle — COMPLETE |

**Governance Completeness:** CONFIRMED

## 11.9 Forward Applicability

Book 1 must remain applicable to future platform phases. Verify:

| Forward Applicability Check | Result |
|---|---|
| Chapter 3 authority hierarchy is phase-agnostic | PASS |
| Chapter 4 governance principles are phase-agnostic | PASS |
| Chapter 5 execution philosophy is phase-agnostic | PASS |
| Chapter 6 orchestration is phase-agnostic (parameterized by feature count) | PASS |
| Chapter 8 stop conditions include phase-agnostic conditions (SC-001 through SC-010 are universal) | PASS |
| Chapter 9 recovery workflows are phase-agnostic | PASS |
| Chapter 10 EDR policy is phase-agnostic | PASS |
| Chapter 2 (Repository State) is explicitly Phase 4.5-specific — must be updated each phase | NOTED — Review action at each phase start |
| Chapter 1 §1.9 versioning policy governs Book 1 evolution | PASS |

**Forward Applicability:** CONFIRMED with noted Chapter 2 update requirement.

## 11.10 Final Certification Statement

Book 1 — Engineering Governance is internally consistent, compliant with FEOS, KEB, PMIC, and IEF requirements, complete in its governance coverage, and forward-applicable to future platform phases. Chapter 2 requires update at each new platform phase to reflect the current repository state.

This governance validation was performed at Book 1 Version 1.0 authoring. Subsequent reviews must repeat this validation and document any findings.

**Governance Validation:** PASS

---

*End of Book 1 — Engineering Governance*
*FactoryERP Platform Engineering*
*Version 1.0 — 2026-07-01*
