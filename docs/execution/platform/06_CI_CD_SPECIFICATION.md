# 06 — CI/CD Specification
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Purpose** | Complete specification for GitHub Actions CI/CD pipelines |
| **Scope** | Build, lint, test, and Prisma validation pipelines; branch policy; matrix strategy; caching |
| **Audience** | DevOps lead, platform engineers, all contributors |
| **Status** | SPECIFICATION COMPLETE — Implementation Pending |
| **Owner** | Principal DevOps Engineer |
| **Review Cycle** | On GitHub Actions major version changes or pipeline restructure |
| **Version** | 1.0 |
| **Dependencies** | Repository audit (01), cross-platform requirements (02), bootstrap spec (05) |
| **Inputs** | Quality gate definitions from MEC (00); OS matrix from (02); tool versions from (05) |
| **Outputs** | `.github/workflows/ci.yml` (primary); `.github/workflows/pr-validation.yml` (optional) |

---

## 1. Pipeline Philosophy

### 1.1 CI Scope for Phase 4.5

Phase 4.5 CI validates the quality of the application codebase and the cross-platform environment. It does NOT:
- Deploy the application to any environment
- Publish Docker images to a registry
- Run end-to-end tests against a live application

CD (Continuous Deployment) is explicitly out of scope for Phase 4.5. A future phase governs deployment.

### 1.2 Pipeline Structure

Two pipeline files are defined:

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | `push` to `main`; `push` to feature branches; `pull_request` to `main` | Full CI pipeline: build + lint + test + prisma + matrix |
| `.github/workflows/security.yml` | `push` to `main`; weekly schedule | Secret scanning; dependency audit |

A single merged `ci.yml` is preferred over multiple small workflow files to reduce orchestration complexity and improve visibility.

### 1.3 Fail-Fast Policy

**MANDATORY:** The CI pipeline MUST use `fail-fast: true` in the matrix strategy. When any matrix job fails, remaining jobs are cancelled immediately. This prevents wasted runner minutes on already-failing branches.

---

## 2. Trigger Policy

### 2.1 `ci.yml` Triggers

```yaml
on:
  push:
    branches:
      - main
      - 'feat/**'
      - 'fix/**'
      - 'chore/**'
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened]
```

**Rationale:**
- `push` to `main`: validates that merges have not broken the build
- `push` to feature branches: provides early feedback before PR creation
- `pull_request` to `main`: required check that must pass before merge

### 2.2 Branch Protection (GitHub Configuration — Not a Workflow File)

The following branch protection rules MUST be configured on `main` via GitHub repository settings. This is documented here as a requirement for the platform engineer who implements Phase 4.5.

| Rule | Value |
|---|---|
| Require status checks to pass before merging | Enabled |
| Required status checks | `ci / build-and-test (ubuntu-latest)` (minimum) |
| Require branches to be up to date | Enabled |
| Restrict force pushes | Enabled (FEOS `10_GIT_GOVERNANCE.md` also prohibits force push to main) |
| Require pull request reviews | Recommended — at least 1 approval |
| Allow deletions | Disabled |

---

## 3. Matrix Strategy

### 3.1 OS Matrix

Phase 4.5 targets three operating systems in CI:

| OS | GitHub Actions Runner | Priority | Node Version |
|---|---|---|---|
| Ubuntu 24 LTS | `ubuntu-latest` | PRIMARY | 24.16.0 |
| Windows 11 | `windows-latest` | PRIMARY | 24.16.0 |
| macOS 14 | `macos-latest` | SECONDARY | 24.16.0 |

All three MUST pass for the CI pipeline to succeed.

### 3.2 Node Version Matrix

Phase 4.5 pins to Node 24.16.0 only. A multi-version Node matrix is NOT required for this project. The `.nvmrc` defines the single target version.

**Rationale:** Testing against multiple Node versions is appropriate for published libraries. For an application with a pinned deployment target, a single version is sufficient and faster.

### 3.3 Matrix Configuration

```yaml
strategy:
  fail-fast: true
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
```

Each matrix job is named `ci / build-and-test (${{ matrix.os }})`.

---

## 4. Build Pipeline

### 4.1 Job: `build-and-test`

**Runs on:** `${{ matrix.os }}`

**Steps (in order):**

| Step | Action | Notes |
|---|---|---|
| Checkout | `actions/checkout@v4` | Always `fetch-depth: 1` (shallow clone for speed) |
| Setup Node | `actions/setup-node@v4` | `node-version-file: '.nvmrc'`; `cache: 'npm'` |
| Restore npm cache | Handled by `actions/setup-node` `cache: 'npm'` | See caching section |
| Install dependencies | `npm ci` | `--engines-strict` to enforce `engines` field |
| Generate Prisma client | `npx prisma generate` | Requires `DATABASE_URL` env var (see §4.2) |
| Build | `npm run build` | `nest build`; deletes outDir first |
| Lint | `npm run lint` | ESLint — must exit 0 with 0 errors |
| Test | `npm run test` | Jest — all 482 tests must pass |
| Prisma validate | `npx prisma validate` | Schema validation — no database required |

### 4.2 Prisma in CI

Prisma CLI requires `DATABASE_URL` even for `prisma generate` and `prisma validate` (project-specific constraint: `prisma.config.ts` skips `.env` loading).

**For `prisma generate` and `prisma validate`:** A real database is NOT required. A placeholder URL is sufficient:

```yaml
env:
  DATABASE_URL: "postgresql://ci:ci@localhost:5432/factory_erp"
```

This URL does not need to resolve. `prisma generate` and `prisma validate` are purely static operations.

**For `prisma migrate status` (NOT in Phase 4.5 CI):** A real PostgreSQL instance would be required. This is deferred to a future CD pipeline.

### 4.3 Environment Variables in CI

| Variable | Source | Value |
|---|---|---|
| `DATABASE_URL` | Workflow `env:` block | `postgresql://ci:ci@localhost:5432/factory_erp` (placeholder; no real DB) |
| `JWT_SECRET` | GitHub Actions Secret | `${{ secrets.JWT_SECRET }}` |
| `JWT_EXPIRES_IN` | Workflow `env:` block | `15m` |
| `REFRESH_EXPIRES_IN` | Workflow `env:` block | `7d` |
| `NODE_ENV` | Workflow `env:` block | `test` |

**MANDATORY:** `JWT_SECRET` and `DATABASE_URL` (if real) MUST be stored as GitHub Actions encrypted secrets, not hardcoded in the workflow file.

---

## 5. Caching

### 5.1 npm Cache

`actions/setup-node@v4` with `cache: 'npm'` automatically caches the npm cache directory. This is keyed on the `package-lock.json` hash. A `package-lock.json` change invalidates the cache and triggers a full `npm ci`.

**Expected cache hit on warm runs:** 60–90 seconds saved per matrix job.

### 5.2 Build Cache

TypeScript `incremental: true` generates `tsconfig.tsbuildinfo`. This file SHOULD be cached between CI runs to speed up the `npm run build` step.

**Cache key:** `tsbuildinfo-${{ runner.os }}-${{ hashFiles('src/**/*.ts') }}`

**RECOMMENDED:** Cache `tsconfig.tsbuildinfo` using `actions/cache@v4`. The cache is invalidated when any `.ts` file changes.

### 5.3 Prisma Client Cache

The generated Prisma client (`node_modules/@prisma/client/`) is part of `node_modules/`, which is already cached via the npm cache. No separate Prisma cache is required.

### 5.4 Cache Eviction

GitHub Actions caches are evicted after 7 days of inactivity or when total cache size exceeds 10 GB per repository. Both are handled automatically by GitHub.

---

## 6. Artifact Policy

### 6.1 Coverage Reports

`npm run test:cov` generates a `coverage/` directory. This artifact SHOULD be uploaded to GitHub Actions on the `ubuntu-latest` job only (not all matrix jobs):

```yaml
- uses: actions/upload-artifact@v4
  if: matrix.os == 'ubuntu-latest'
  with:
    name: coverage-report
    path: coverage/
    retention-days: 7
```

### 6.2 Build Artifacts

The `dist/` directory is NOT uploaded as a CI artifact in Phase 4.5. Production artifacts are a CD concern.

### 6.3 Artifact Retention

All Phase 4.5 CI artifacts have a retention period of 7 days. This is sufficient for developer review and debugging.

---

## 7. Failure Handling

### 7.1 Lint Failure

If `npm run lint` fails, the step exits non-zero. CI fails immediately. The developer receives:
- The ESLint error output in the CI log
- The specific rule(s) violated
- `npm run lint` locally reproduces the failure

### 7.2 Test Failure

If `npm run test` fails, Jest outputs the failing test names and error messages. The developer runs `npm run test -- --testPathPattern=<failing-spec>` locally to reproduce.

### 7.3 Build Failure

TypeScript compilation errors appear in the `npm run build` step output. CI fails on the first TypeScript error.

### 7.4 Matrix Partial Failure

If `windows-latest` fails and `ubuntu-latest` passes, the CI job is reported as failed. The developer investigates the Windows-specific failure. Common Windows-specific failures in Node.js CI:
- Path separator issues in scripts
- `node_modules/.bin/` symlink resolution differences
- CRLF in test snapshots (if snapshot testing is used)

### 7.5 Flaky Test Policy

Tests that fail intermittently in CI MUST be investigated within 2 business days. A consistently flaky test MUST be either fixed or explicitly skipped (with a GitHub issue reference) before the next release cycle.

---

## 8. Security Workflow

### 8.1 `security.yml` Triggers

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 06:00 UTC
```

### 8.2 Security Checks

| Check | Tool | Notes |
|---|---|---|
| Dependency audit | `npm audit --audit-level=high` | Fails on high/critical vulnerabilities |
| Secret scanning | GitHub Advanced Security (if enabled) or `truffleHog` action | Detects hardcoded credentials |

### 8.3 `npm audit` Policy

**MANDATORY:** The CI pipeline MUST run `npm audit --audit-level=high`. Failures on `high` or `critical` vulnerabilities MUST block the pipeline. `moderate` and `low` vulnerabilities generate warnings only.

An `npm audit` failure means a dependency has a known vulnerability. Resolution options:
1. Update the affected package
2. File a `npm audit` ignore entry with justification (temporary — maximum 30 days)
3. Replace the dependency

---

## 9. Pull Request Validation

### 9.1 PR Title Convention

PR titles MUST follow the Conventional Commits format:
`type(scope): description`

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`

This is enforced by the FEOS `10_GIT_GOVERNANCE.md`. A GitHub Actions step MAY validate PR titles using `amannn/action-semantic-pull-request`.

### 9.2 PR Checks

Every PR to `main` MUST pass:
- All three matrix CI jobs (`ubuntu-latest`, `windows-latest`, `macos-latest`)
- At minimum the `ubuntu-latest` build MUST be a required check (configurable in branch protection)
- `npm audit` at `--audit-level=high`

---

## 10. Workflow File Requirements

### 10.1 Mandatory Workflow Header

Every workflow file MUST include:

```yaml
name: CI
permissions:
  contents: read
```

**MANDATORY:** All workflows MUST explicitly declare permissions using the principle of least privilege. Default permissive tokens are prohibited.

### 10.2 Action Version Pinning

**MANDATORY:** All `uses:` references MUST be pinned to an exact SHA or a major version tag:

| Acceptable | Unacceptable |
|---|---|
| `actions/checkout@v4` | `actions/checkout@latest` |
| `actions/setup-node@v4` | `actions/setup-node` |
| `actions/cache@v4` | `actions/cache@main` |

Pinning to `@v4` (major version) is acceptable because these actions follow semantic versioning. Pinning to SHA is required for third-party (non-GitHub-owned) actions.

### 10.3 Timeout

**MANDATORY:** All jobs MUST declare a `timeout-minutes` value:

```yaml
jobs:
  build-and-test:
    timeout-minutes: 15
```

This prevents runaway jobs from consuming runner minutes indefinitely.

---

## 11. Validation

The CI/CD implementation is valid when:

| Check | Verification |
|---|---|
| `ci.yml` is syntactically valid | `yamllint .github/workflows/ci.yml` exits 0 |
| CI passes on `ubuntu-latest` | GitHub Actions green check |
| CI passes on `windows-latest` | GitHub Actions green check |
| CI passes on `macos-latest` | GitHub Actions green check |
| `npm audit` passes | No high/critical vulnerabilities |
| Prisma validate passes in CI | Step completes without error |
| All 482 tests pass in CI | Jest output shows `Test Suites: 42 passed` |
| Build output is 0 TypeScript errors | `npm run build` exits 0 |
| Lint output is 0 errors | `npm run lint` exits 0 |
| No secrets in workflow files | `git grep -r "password\|secret\|token" .github/` returns nothing suspicious |
| PR status checks enabled on `main` | GitHub branch protection settings |

---

## 12. Compliance

- Master Execution Contract (00) — Rules IEF-007, IEF-008, IEF-010
- Cross-Platform Requirements (02) — Sections 2 (OS matrix), 7 (Prisma in CI)
- FEOS `10_GIT_GOVERNANCE.md` — branch protection and commit policy
- FEOS `09_SECURITY_GOVERNANCE.md` — secret management; audit policy

---

## 13. Engineering Rules Summary

| Rule | Classification | Description |
|---|---|---|
| CI triggers on `pull_request` to `main` | MANDATORY | All PRs validated before merge |
| `npm ci` in all CI jobs | MANDATORY | Respects lock file; `engines-strict` |
| Secrets via GitHub Actions Secrets only | MANDATORY | No plaintext credentials in workflow files |
| Workflow permissions declared explicitly | MANDATORY | Principle of least privilege |
| All action `uses:` pinned to major version | MANDATORY | Supply chain safety |
| `timeout-minutes` on all jobs | MANDATORY | Prevents runaway runners |
| `fail-fast: true` in matrix | MANDATORY | Cost efficiency on failure |
| Coverage artifact from `ubuntu-latest` only | RECOMMENDED | Avoids duplicate artifact uploads |
| `npm audit --audit-level=high` | MANDATORY | Blocks on high/critical vulnerabilities |
