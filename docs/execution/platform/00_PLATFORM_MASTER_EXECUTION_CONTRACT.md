# 00 — Platform Master Execution Contract
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Governing contract for the complete Cross-Platform Development Environment implementation |
| **Scope** | All infrastructure, toolchain, CI/CD, and developer experience components for Phase 4.5 |
| **Audience** | Chief Architect, DevOps Lead, Principal Engineers, QA Lead |
| **Status** | ACTIVE — Execution Pending |
| **Owner** | Chief Software Architect / Principal DevOps Engineer |
| **Review Cycle** | On each milestone completion |
| **Version** | 1.0 |
| **Dependencies** | FEOS, Knowledge Baseline, Production Module Closure (MMCC) |
| **Inputs** | Repository audit (01), cross-platform requirements (02), feature specifications (03–07) |
| **Outputs** | Fully governed execution plan; implementation contracts for each feature |

---

## 1. Mission

Phase 4.5 establishes a reproducible, cross-platform development environment for FactoryERP that eliminates developer machine variance, standardizes CI validation, and ensures the application builds and tests identically on Windows 11, Ubuntu 24 LTS, Debian 12, Fedora 40, and macOS 14.

The current repository state lacks: containerized development environment, pinned Node version, CI/CD pipeline, cross-platform line-ending governance, and standardized onboarding toolchain. Phase 4.5 closes all of these gaps.

---

## 2. Goals

| ID | Goal | Priority |
|---|---|---|
| G-01 | Eliminate developer machine variance via DevContainer | CRITICAL |
| G-02 | Pin and enforce Node.js LTS version across all environments | CRITICAL |
| G-03 | Provide reproducible PostgreSQL environment via Docker Compose | CRITICAL |
| G-04 | Implement CI/CD matrix across Windows, Ubuntu, macOS | HIGH |
| G-05 | Enforce line-ending policy via `.gitattributes` | HIGH |
| G-06 | Standardize VSCode workspace configuration | HIGH |
| G-07 | Document zero-to-running onboarding in one command | HIGH |
| G-08 | Provide doctor/verify scripts for environment validation | MEDIUM |
| G-09 | Establish secrets management policy | MEDIUM |
| G-10 | Provide debug profiles for NestJS and Jest | MEDIUM |

---

## 3. Success Criteria

Phase 4.5 is successful when ALL of the following are true:

- [ ] A developer on a clean Windows 11 machine can open the repository in VSCode and reach a running application within 15 minutes using only documented steps
- [ ] A developer on a clean Ubuntu 24 machine achieves the same in 15 minutes
- [ ] `npm run build`, `npm run lint`, and `npm run test` pass identically in the DevContainer and on the CI matrix
- [ ] `npx prisma validate` passes in CI without a running database
- [ ] No hardcoded paths, drive letters, or OS-specific assumptions exist in any script or configuration file
- [ ] All 11 Phase 4.5 feature documents are authored and reviewed
- [ ] Implementation of each feature passes its own acceptance criteria (documents 08 and 10)

---

## 4. Scope

### In Scope

- DevContainer configuration (`.devcontainer/`)
- Docker Compose development topology (`docker-compose.dev.yml`)
- GitHub Actions CI/CD pipeline (`.github/workflows/`)
- `.nvmrc` / Node version pinning
- `.gitattributes` (line-ending governance)
- `.editorconfig` (cross-editor formatting baseline)
- VSCode workspace settings, tasks, launch profiles, extension recommendations
- Bootstrap and doctor scripts (`scripts/`)
- `README.md` onboarding section
- npm scripts augmentation for cross-platform safety (cross-env if required)

### Out of Scope

- Production deployment (Kubernetes, Terraform, cloud provisioning)
- Staging environment infrastructure
- Secrets rotation or vault integration
- Database migration automation beyond development workflow
- Performance benchmarking infrastructure
- Load testing infrastructure
- Application source code changes
- Prisma schema changes
- API contract changes

---

## 5. Execution Philosophy

### 5.1 Principle of Minimum Viable Configuration

Every configuration file introduced must earn its place. Files that duplicate information already derivable from `package.json`, `tsconfig.json`, or `nest-cli.json` are prohibited. Configuration must be additive, not redundant.

### 5.2 Principle of Cross-Platform Neutrality

No script, configuration, or documentation may assume a specific operating system. Where OS-specific behavior is unavoidable, it must be isolated, documented, and tested.

### 5.3 Principle of Auditability

Every tool version, image tag, and dependency pinned in Phase 4.5 must be traceable to a specific decision. All version choices are recorded in this framework.

### 5.4 Principle of Repository Integrity

Phase 4.5 does not modify: source code, Prisma schema, SQL migrations, test files, or FEOS documents. The repository must build, lint, and test identically before and after Phase 4.5 execution.

### 5.5 Principle of Progressive Onboarding

The developer experience flows from simple to complete: `docker compose up` starts infrastructure; `npm install && npm run start:dev` starts the application. No manual environment setup should be required beyond these two operations.

---

## 6. Engineering Rules

### 6.1 MANDATORY Rules

| Rule ID | Rule | Impact of Violation |
|---|---|---|
| IEF-001 | `.nvmrc` MUST pin the exact Node LTS version in use (currently `24.16.0`) | Build non-reproducibility across developer machines |
| IEF-002 | `.gitattributes` MUST normalize all `.ts`, `.js`, `.json`, `.md`, `.sql`, `.prisma`, `.yml`, `.yaml` files to LF on commit | CRLF contamination breaks Linux CI and Prisma migrations |
| IEF-003 | No drive letters or Windows-specific path separators in any script | CI failure on Ubuntu/macOS |
| IEF-004 | All Docker image tags MUST be pinned to major.minor (e.g., `postgres:16.4`), never `latest` | Environment drift between developers |
| IEF-005 | `DATABASE_URL` MUST be set via container environment; never hardcoded in scripts | Credential exposure in CI logs |
| IEF-006 | The DevContainer MUST extend, not replace, the local development workflow | Developers not using DevContainer must not be blocked |
| IEF-007 | CI pipeline MUST run on pull_request and push to main | Unvalidated merges to main |
| IEF-008 | `npm ci` (not `npm install`) MUST be used in all CI contexts | Lock file bypass |
| IEF-009 | No `sudo` commands in bootstrap scripts | Non-portable; blocked in DevContainer |
| IEF-010 | Prisma CLI commands in CI MUST include explicit `DATABASE_URL` prefix | Prisma skips .env loading (known project constraint) |

### 6.2 RECOMMENDED Rules

| Rule ID | Rule | Rationale |
|---|---|---|
| IEF-011 | Use `cross-env` for any `NODE_ENV=` prefix in npm scripts | Windows CMD does not support inline env vars |
| IEF-012 | Pin Node via `engines` field in `package.json` | Provides npm-level enforcement |
| IEF-013 | Doctor script SHOULD run in under 5 seconds | Slow health checks discourage use |
| IEF-014 | All Docker health checks SHOULD use `pg_isready` for PostgreSQL | Robust vs. simple sleep |
| IEF-015 | GitHub Actions SHOULD cache `node_modules` via `actions/cache` | CI cost and speed |

### 6.3 OPTIONAL Rules

| Rule ID | Rule | Rationale |
|---|---|---|
| IEF-016 | Add PgAdmin to Docker Compose for database inspection | Developer convenience, not required for app function |
| IEF-017 | Add MailHog for email integration testing | Only relevant when email features are implemented |
| IEF-018 | Add Redis service to Docker Compose | Not currently required; reserve for session/cache features |

---

## 7. Authority Order

When a conflict exists between any two documents or instructions:

1. FEOS (`docs/feos/`) — highest authority; never contradicted
2. Knowledge Baseline (`docs/knowledge/`) — authoritative on module state
3. This Master Execution Contract — governs Phase 4.5 execution
4. Feature Specification Documents (03–07) — govern their respective features
5. Repository state (existing files) — implementation baseline
6. External tooling documentation — consulted, never blindly followed

---

## 8. Repository Protection Rules

During Phase 4.5 execution, the following files MUST NOT be modified:

| Protected File / Path | Reason |
|---|---|
| `src/**/*` | Source code is frozen post-Production Module |
| `prisma/schema.prisma` | Architecture frozen |
| `prisma/migrations/**/*` | Schema migrations are not in scope |
| `docs/feos/**/*` | FEOS is never modified by execution phases |
| `docs/knowledge/**/*` | KEB updated only at module closure |
| `package.json` | Requires architect sign-off; version pinning done via `.nvmrc` and `engines` field only |
| `tsconfig.json` | TypeScript configuration frozen |
| `test/**/*` | Test suite frozen; no additions in this phase |

The following files MAY be created or modified:

| Allowed File / Path | Reason |
|---|---|
| `.nvmrc` | Node version pinning |
| `.gitattributes` | Line-ending governance |
| `.editorconfig` | Cross-editor formatting baseline |
| `.devcontainer/**/*` | DevContainer configuration |
| `docker-compose.dev.yml` | Development infrastructure |
| `.github/workflows/**/*` | CI/CD pipelines |
| `.vscode/settings.json` | Workspace settings |
| `.vscode/tasks.json` | VSCode task definitions |
| `.vscode/launch.json` | Debug profiles |
| `.vscode/extensions.json` | Extension recommendations |
| `scripts/**/*` | Bootstrap and doctor scripts |
| `README.md` | Onboarding documentation |
| `docs/execution/platform/**/*` | This framework and progress tracking |

---

## 9. Implementation Order

Features must be implemented in the following sequence. Each feature must pass its quality gates before the next begins.

| Order | Feature | Document | Gate |
|---|---|---|---|
| 1 | Node version pinning (`.nvmrc`, `engines`) | 05 | `node --version` matches `.nvmrc` in CI |
| 2 | Line-ending governance (`.gitattributes`) | 07 | `git ls-files --eol` shows consistent LF on all governed files |
| 3 | EditorConfig (`.editorconfig`) | 07 | Formatting consistent across VSCode and vim/emacs |
| 4 | Docker development environment (`docker-compose.dev.yml`) | 04 | `docker compose up -d` starts healthy PostgreSQL |
| 5 | DevContainer (`.devcontainer/`) | 03 | Container opens; `npm run build` and `npm run test` pass inside container |
| 6 | VSCode workspace configuration (`.vscode/`) | 07 | Tasks, debug profiles, and extension recommendations load |
| 7 | Bootstrap and doctor scripts (`scripts/`) | 05 | `scripts/doctor.sh` exits 0 on a properly configured machine |
| 8 | CI/CD pipeline (`.github/workflows/`) | 06 | CI passes on all matrix targets |
| 9 | README onboarding section | 07 | Zero-to-running documented and verified |
| 10 | Platform acceptance validation | 08 | All acceptance criteria in document 08 checked |

---

## 10. Quality Gates

| Gate ID | Gate | Enforced By |
|---|---|---|
| QG-001 | `npm run build` exits 0 | CI pipeline; local pre-commit check |
| QG-002 | `npm run lint` exits 0 with 0 errors | CI pipeline |
| QG-003 | `npm run test` exits 0, all 482 tests pass | CI pipeline |
| QG-004 | `DATABASE_URL="..." npx prisma validate` exits 0 | CI pipeline |
| QG-005 | `docker compose -f docker-compose.dev.yml up -d` exits 0 and PostgreSQL reports healthy | Local + CI |
| QG-006 | DevContainer build completes without error | DevContainer CI action |
| QG-007 | No secrets present in any committed file | Pre-commit hook + CI secret scan |
| QG-008 | All `.ts`, `.json`, `.md`, `.sql` files have LF line endings in the repository | CI `git ls-files --eol` check |
| QG-009 | `.nvmrc` version matches `node --version` in CI runner | CI assertion step |
| QG-010 | Doctor script exits 0 on a machine that meets all prerequisites | CI dry-run |

---

## 11. Feature Breakdown

| Feature ID | Feature Name | Document | Status |
|---|---|---|---|
| F-P01 | DevContainer | 03 | PENDING |
| F-P02 | Docker Development Environment | 04 | PENDING |
| F-P03 | Bootstrap and Toolchain | 05 | PENDING |
| F-P04 | CI/CD Pipeline | 06 | PENDING |
| F-P05 | Developer Experience (VSCode, EditorConfig, Git Attributes) | 07 | PENDING |
| F-P06 | Cross-Platform Validation | 02 | PENDING |
| F-P07 | Node Version Pinning | 05 | PENDING |
| F-P08 | Secrets Management Policy | 04 | PENDING |
| F-P09 | Onboarding Documentation | 07 | PENDING |
| F-P10 | Platform Acceptance Validation | 08 | PENDING |

---

## 12. Completion Definition

Phase 4.5 is declared COMPLETE when:

1. All 10 implementation features (F-P01 through F-P10) have passed their acceptance gates
2. Document `10_PLATFORM_FINAL_ACCEPTANCE.md` has been fully populated and signed off
3. `docs/knowledge/07_MODULE_STATUS.md` and `08_IMPLEMENTATION_STATUS.md` have been updated to reflect Phase 4.5 completion
4. `docs/feos/17_ENGINEERING_METRICS.md` has been updated with Phase 4.5 metrics
5. `npm run build`, `npm run lint`, and `npm run test` all pass on the final commit
6. The final commit has been pushed to `origin/main`

Phase 4.5 is declared BLOCKED if any quality gate cannot be resolved within the current execution context and requires architectural decision outside the scope of this contract.

---

## 13. Compliance

All work performed under this contract is subject to:

- FEOS `01_ENGINEERING_CONSTITUTION.md` — engineering principles
- FEOS `07_CODE_GOVERNANCE.md` — code standards
- FEOS `10_GIT_GOVERNANCE.md` — commit, branch, and PR rules
- FEOS `14_OPERATIONAL_PLAYBOOK.md` — operational procedures
- FEOS `09_SECURITY_GOVERNANCE.md` — secrets and access policies

---

## 14. Validation

This document is valid when:

- [ ] All referenced document numbers (01–10) exist in `docs/execution/platform/`
- [ ] No implementation has been performed (source, schema, tests unchanged)
- [ ] Feature breakdown is consistent with the implementation specifications
- [ ] Authority order does not contradict FEOS
- [ ] Engineering rules are classified MANDATORY / RECOMMENDED / OPTIONAL
