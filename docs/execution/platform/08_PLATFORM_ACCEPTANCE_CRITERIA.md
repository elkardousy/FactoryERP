# 08 — Platform Acceptance Criteria
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Definitive acceptance checklist for Phase 4.5 completion; all criteria must be satisfied before Final Acceptance (10) |
| **Scope** | Repository state, Docker, DevContainer, bootstrap, CI/CD, cross-platform, documentation, performance, security, developer experience |
| **Audience** | Chief Architect, QA lead, DevOps lead |
| **Status** | ACTIVE — Awaiting Implementation |
| **Owner** | Chief Software Architect / QA Lead |
| **Review Cycle** | Once — at Phase 4.5 completion |
| **Version** | 1.0 |
| **Dependencies** | All feature specifications (03–07); Master Execution Contract (00) |
| **Inputs** | All Phase 4.5 implementations |
| **Outputs** | Completed acceptance checklist; input to Final Acceptance (10) |

---

## Instructions

Each acceptance criterion (AC) has a binary outcome: PASS or FAIL. There is no partial credit. All criteria in categories A–H (core) MUST be PASS. Category I (performance) MUST have at least 4 of 5 PASS. Category J (optional services) items are RECOMMENDED and do not block acceptance.

Criteria are verified by the methods described. "Manual" means a human must perform the verification. "Automated" means CI asserts the criterion.

---

## A. Repository Baseline

> Verify that all Phase 4.5 implementation artifacts are present and the application quality baseline is unchanged.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-A-001 | `.nvmrc` exists at repository root containing `24.16.0` | `test -f .nvmrc && cat .nvmrc` | [ ] |
| AC-A-002 | `package.json` contains `engines.node` field `>=24.0.0 <25.0.0` | `cat package.json \| jq .engines` | [ ] |
| AC-A-003 | `.gitattributes` exists at repository root | `test -f .gitattributes` | [ ] |
| AC-A-004 | `.editorconfig` exists at repository root | `test -f .editorconfig` | [ ] |
| AC-A-005 | `.env.example` exists at repository root with all required variables | `test -f .env.example && cat .env.example` | [ ] |
| AC-A-006 | `docker-compose.dev.yml` exists at repository root | `test -f docker-compose.dev.yml` | [ ] |
| AC-A-007 | `.devcontainer/devcontainer.json` exists | `test -f .devcontainer/devcontainer.json` | [ ] |
| AC-A-008 | `.github/workflows/ci.yml` exists | `test -f .github/workflows/ci.yml` | [ ] |
| AC-A-009 | `.vscode/settings.json`, `.vscode/tasks.json`, `.vscode/launch.json`, `.vscode/extensions.json` all exist | `ls .vscode/` | [ ] |
| AC-A-010 | `scripts/doctor.sh` and `scripts/doctor.ps1` exist | `ls scripts/` | [ ] |
| AC-A-011 | `npm run build` exits 0 (0 TypeScript errors) | Automated — CI | [ ] |
| AC-A-012 | `npm run lint` exits 0 (0 ESLint errors) | Automated — CI | [ ] |
| AC-A-013 | `npm run test` exits 0 — all 482 tests pass | Automated — CI | [ ] |
| AC-A-014 | `DATABASE_URL="..." npx prisma validate` exits 0 | Automated — CI | [ ] |
| AC-A-015 | No source files under `src/` were modified during Phase 4.5 | `git diff HEAD~N -- src/` shows no changes | [ ] |
| AC-A-016 | `prisma/schema.prisma` was not modified during Phase 4.5 | `git diff HEAD~N -- prisma/schema.prisma` shows no changes | [ ] |

---

## B. Docker Development Environment

> Verify that the Docker Compose development environment starts correctly and provides a healthy PostgreSQL instance.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-B-001 | `docker compose -f docker-compose.dev.yml config` exits 0 (file is valid) | Manual / CI | [ ] |
| AC-B-002 | `docker compose -f docker-compose.dev.yml up -d` exits 0 | Manual | [ ] |
| AC-B-003 | `factory-erp-db` container reaches `healthy` status within 60 seconds | `docker compose -f docker-compose.dev.yml ps` | [ ] |
| AC-B-004 | `psql "$DATABASE_URL" -c "SELECT 1"` connects and returns 1 | Manual | [ ] |
| AC-B-005 | Named volume `factory-postgres-data` is created | `docker volume ls | grep factory-postgres-data` | [ ] |
| AC-B-006 | PostgreSQL image is pinned to exact version (not `latest`) | `cat docker-compose.dev.yml | grep image` | [ ] |
| AC-B-007 | No credentials are hardcoded in `docker-compose.dev.yml` | `git diff HEAD -- docker-compose.dev.yml | grep -i 'password\|secret'` returns empty | [ ] |
| AC-B-008 | `docker compose -f docker-compose.dev.yml down` exits 0 and volumes are preserved | Manual | [ ] |
| AC-B-009 | Application starts with `npm run start:dev` against containerized PostgreSQL | `curl http://localhost:3000/api/docs` returns HTTP 200 | [ ] |
| AC-B-010 | `docker compose -f docker-compose.dev.yml down -v` destroys volumes (documented in README) | Manual (verified in docs, not executed unless testing reset) | [ ] |

---

## C. DevContainer

> Verify that the DevContainer opens correctly in VSCode and provides a functioning development environment inside the container.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-C-001 | DevContainer opens without errors in VSCode | Manual — `Remote-Containers: Reopen in Container` | [ ] |
| AC-C-002 | `node --version` inside container returns `v24.16.0` | Manual — terminal inside container | [ ] |
| AC-C-003 | `npm ci` runs without error inside container (`postCreateCommand`) | Check DevContainer creation log | [ ] |
| AC-C-004 | `npx prisma generate` runs without error inside container (`postCreateCommand`) | Check DevContainer creation log | [ ] |
| AC-C-005 | `npm run build` exits 0 inside container | Manual — terminal inside container | [ ] |
| AC-C-006 | `npm run test` exits 0, 482 tests pass inside container | Manual — terminal inside container | [ ] |
| AC-C-007 | ESLint extension is active (red underlines for violations) | Manual — introduce violation in editor | [ ] |
| AC-C-008 | Prettier formats `.ts` files on save inside container | Manual — edit and save a `.ts` file | [ ] |
| AC-C-009 | Port 3000 is forwarded and application is reachable at `localhost:3000` from host | Manual — browser | [ ] |
| AC-C-010 | Container runs as non-root user `vscode` | `whoami` inside container returns `vscode` | [ ] |
| AC-C-011 | PostgreSQL is reachable from inside container at hostname `db:5432` | `psql -h db ...` from inside container | [ ] |
| AC-C-012 | DevContainer base image is pinned to minor version (not `latest`) | `cat .devcontainer/devcontainer.json | grep image` | [ ] |
| AC-C-013 | No secrets or credentials in `devcontainer.json` | `cat .devcontainer/devcontainer.json | grep -i 'password\|secret'` returns empty | [ ] |

---

## D. Bootstrap and Doctor Scripts

> Verify that bootstrap and doctor scripts perform correctly under configured and misconfigured conditions.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-D-001 | `scripts/doctor.sh` exits 0 on a fully configured machine | Manual — execute script | [ ] |
| AC-D-002 | `scripts/doctor.ps1` exits 0 on a fully configured Windows machine | Manual — execute script | [ ] |
| AC-D-003 | `scripts/doctor.sh` exits 1 with specific error message when Node version is wrong | Manual — temporarily switch to wrong Node version | [ ] |
| AC-D-004 | `scripts/doctor.sh` exits 1 with specific error message when `.env` is missing | Manual — rename `.env` and run | [ ] |
| AC-D-005 | `scripts/doctor.sh` exits 1 with specific error message when Docker is not running | Manual — stop Docker and run | [ ] |
| AC-D-006 | `scripts/setup.sh` completes successfully on a clean machine (all prerequisites met) | Manual — full clean install | [ ] |
| AC-D-007 | `scripts/setup.sh` is idempotent (run twice, exits 0 both times, no errors) | Manual — run setup twice | [ ] |
| AC-D-008 | `scripts/reset.sh` prompts for confirmation before destructive operations | Manual — run and observe prompt | [ ] |
| AC-D-009 | Doctor script output format matches specification (doc 05 §5.4) | Manual — compare output format | [ ] |
| AC-D-010 | Doctor script completes in under 10 seconds on a healthy machine | Manual — time execution | [ ] |

---

## E. CI/CD Pipeline

> Verify that the GitHub Actions pipeline passes on all matrix targets and enforces quality gates.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-E-001 | `ci.yml` is syntactically valid YAML | `yamllint .github/workflows/ci.yml` exits 0 | [ ] |
| AC-E-002 | CI pipeline runs on `push` to `main` | GitHub Actions — check run history | [ ] |
| AC-E-003 | CI pipeline runs on `pull_request` to `main` | GitHub Actions — open test PR | [ ] |
| AC-E-004 | `ubuntu-latest` matrix job passes (build + lint + test + prisma validate) | GitHub Actions green check | [ ] |
| AC-E-005 | `windows-latest` matrix job passes | GitHub Actions green check | [ ] |
| AC-E-006 | `macos-latest` matrix job passes | GitHub Actions green check | [ ] |
| AC-E-007 | Node version in CI matches `.nvmrc` | CI step assertion | [ ] |
| AC-E-008 | `npm ci` used (not `npm install`) in all CI jobs | `cat .github/workflows/ci.yml | grep "npm ci"` | [ ] |
| AC-E-009 | No credentials hardcoded in `ci.yml` | `cat .github/workflows/ci.yml | grep -i 'password\|secret'` — only `${{ secrets.* }}` references | [ ] |
| AC-E-010 | `npm audit --audit-level=high` passes (no high/critical vulnerabilities) | Automated — CI step | [ ] |
| AC-E-011 | Workflow `permissions: contents: read` is declared | `cat ci.yml | grep permissions` | [ ] |
| AC-E-012 | All `uses:` actions pinned to major version tag | `cat ci.yml | grep uses` — no bare names or `@main` | [ ] |
| AC-E-013 | `timeout-minutes` declared on all jobs | `cat ci.yml | grep timeout-minutes` | [ ] |
| AC-E-014 | `fail-fast: true` set in matrix strategy | `cat ci.yml | grep fail-fast` | [ ] |
| AC-E-015 | Branch protection on `main` requires CI checks | GitHub repository settings — branch protection rules | [ ] |

---

## F. Cross-Platform Validation

> Verify that all governed files have LF line endings and encoding is correct.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-F-001 | All `.ts` files have LF line endings | `git ls-files --eol -- '*.ts'` shows `i/lf` | [ ] |
| AC-F-002 | All `.sql` files have LF line endings | `git ls-files --eol -- '*.sql'` shows `i/lf` | [ ] |
| AC-F-003 | All `.yml` / `.yaml` files have LF line endings | `git ls-files --eol -- '*.yml'` shows `i/lf` | [ ] |
| AC-F-004 | All `.prisma` files have LF line endings | `git ls-files --eol -- '*.prisma'` shows `i/lf` | [ ] |
| AC-F-005 | All `.json` files have LF line endings | `git ls-files --eol -- '*.json'` shows `i/lf` | [ ] |
| AC-F-006 | `.nvmrc` has LF line ending | `git ls-files --eol -- '.nvmrc'` shows `i/lf` | [ ] |
| AC-F-007 | All source files are UTF-8 without BOM | `file --mime-encoding src/**/*.ts` shows `us-ascii` or `utf-8` | [ ] |
| AC-F-008 | No forward slashes used as path separator in shell scripts (already forward slash — verify) | `grep -r '\\\\' scripts/` returns empty | [ ] |
| AC-F-009 | `tsconfig.json` has `forceConsistentCasingInFileNames: true` (unchanged) | `cat tsconfig.json | grep forceConsistentCasing` | [ ] |

---

## G. Documentation

> Verify that all required documentation is authored and accurate.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-G-001 | All 11 Phase 4.5 framework documents exist in `docs/execution/platform/` | `ls docs/execution/platform/ | wc -l` ≥ 11 | [ ] |
| AC-G-002 | `README.md` contains "Getting Started" section | Manual review | [ ] |
| AC-G-003 | `README.md` onboarding section verified end-to-end by a developer | Manual — sign-off from developer who followed steps | [ ] |
| AC-G-004 | `.env.example` documents all required environment variables | Compare against boot-time Joi schema in `env.validation.ts` | [ ] |
| AC-G-005 | `TROUBLESHOOTING.md` (or README section) covers all known issues from audit (01) | Manual review | [ ] |
| AC-G-006 | `CLAUDE.md` updated to reference new bootstrap scripts and Docker Compose commands | Manual review | [ ] |

---

## H. Security

> Verify that no credentials or sensitive information exist in committed files.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-H-001 | No plaintext passwords in any committed file | `git grep -r "password\s*=" -- . ':!*.md' ':!*.example'` returns empty or safe hits only | [ ] |
| AC-H-002 | No JWT secrets in any committed file | `git grep -rE "JWT_SECRET\s*=\s*[^${\{]" -- .` returns empty | [ ] |
| AC-H-003 | `.env` is in `.gitignore` | `cat .gitignore | grep ".env"` | [ ] |
| AC-H-004 | `DATABASE_URL` in `docker-compose.dev.yml` uses variable substitution | `cat docker-compose.dev.yml | grep DATABASE_URL` shows `${DATABASE_URL}` or env var reference | [ ] |
| AC-H-005 | `npm audit` reports 0 high or critical vulnerabilities | `npm audit --audit-level=high` exits 0 | [ ] |

---

## I. Performance Targets

> Verify that the development environment meets minimum performance thresholds.

| ID | Criterion | Target | Verification Method | Status |
|---|---|---|---|---|
| AC-I-001 | `npm run build` completes in under 30 seconds (warm, incremental) | < 30s | Manual — `time npm run build` (second run) | [ ] |
| AC-I-002 | `npm run test` completes in under 60 seconds | < 60s | Manual — `time npm run test` | [ ] |
| AC-I-003 | `docker compose up` PostgreSQL reaches healthy in under 30 seconds | < 30s | Manual — time from `up -d` to healthy status | [ ] |
| AC-I-004 | Doctor script completes in under 10 seconds | < 10s | Manual — `time scripts/doctor.sh` | [ ] |
| AC-I-005 | DevContainer build completes in under 5 minutes (first build) | < 5 min | Manual — time from `Reopen in Container` to ready | [ ] |

At least 4 of 5 performance criteria MUST pass.

---

## J. Optional Services (Recommended, Non-Blocking)

> These criteria do not block Phase 4.5 acceptance but should be verified when optional services are enabled.

| ID | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-J-001 | PgAdmin accessible at `localhost:5050` when `--profile tools` | Manual — `docker compose --profile tools up -d` | [ ] |
| AC-J-002 | PgAdmin can connect to the `factory-erp-db` PostgreSQL instance | Manual — PgAdmin web UI | [ ] |
| AC-J-003 | Redis container starts healthy when `--profile cache` | Manual — `docker compose --profile cache up -d` | [ ] |

---

## Final Acceptance Gate

Phase 4.5 proceeds to Final Acceptance (document 10) only when:

- [ ] ALL criteria in sections A–H: PASS (0 failures)
- [ ] AT LEAST 4/5 criteria in section I: PASS
- [ ] Section J: evaluated but does not block
- [ ] Sign-off by Chief Architect and QA Lead

If any criterion in sections A–H fails, Phase 4.5 is BLOCKED. The blocking criterion must be resolved before Final Acceptance.

---

## Compliance

- Master Execution Contract (00) — Quality Gates (§10), Completion Definition (§12)
- Cross-Platform Requirements (02) — All acceptance criteria in §10
- FEOS `08_TEST_GOVERNANCE.md` — test passing requirement
- FEOS `18_ENGINEERING_CHECKLISTS.md` — checklist format

---

## Validation of This Document

This document is valid when:

- [ ] Every AC has a binary verification method (no ambiguous criteria)
- [ ] Every AC maps to at least one feature specification (03–07)
- [ ] No AC modifies source code, schema, or tests
- [ ] Final Acceptance Gate is consistent with document 10
