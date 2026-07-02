# F07 — CI Pipeline
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Feature** | F07 — CI Pipeline |
| **Status** | COMPLETE |
| **Commit** | 0bc3f35 |
| **Date** | 2026-07-02 |
| **Specification** | 06_CI_CD_SPECIFICATION.md |

---

## Summary

F07 delivers the GitHub Actions CI pipeline for FactoryERP. The pipeline runs a three-OS matrix (`ubuntu-latest`, `windows-latest`, `macos-latest`) with `fail-fast: true` on every push to `main` and feature branches, and on every pull request to `main`.

All nine pipeline steps execute per-job: checkout → setup-node → tsbuildinfo cache → `npm ci --engines-strict` → `prisma generate` → `build` → `lint` → `test` → `prisma validate` → `npm audit`. Coverage is collected via `test:cov` on `ubuntu-latest` only and uploaded as a 7-day artifact.

CD (deployment) is explicitly out of scope for Phase 4.5 per spec §1.1.

---

## Files Created

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | CREATED — full CI pipeline |

## Files Modified

None.

## Files NOT Modified

All source files (`src/`), Prisma schema (`prisma/`), tests (`test/`), FEOS documents (`docs/feos/`), and all other platform files are unchanged.

---

## Implementation Details

### Trigger Policy (spec §2.1)

| Trigger | Branches |
|---|---|
| `push` | `main`, `feat/**`, `fix/**`, `chore/**` |
| `pull_request` | `main` (types: opened, synchronize, reopened) |

### Matrix Strategy (spec §3.3)

| OS | Runner | Role |
|---|---|---|
| Ubuntu 24 LTS | `ubuntu-latest` | PRIMARY — also runs coverage |
| Windows 11 | `windows-latest` | PRIMARY |
| macOS 14 | `macos-latest` | SECONDARY |

`fail-fast: true` · `timeout-minutes: 15`

### Pipeline Steps

| # | Step | Tool / Command |
|---|---|---|
| 1 | Checkout | `actions/checkout@v4` `fetch-depth: 1` |
| 2 | Setup Node.js | `actions/setup-node@v4` `node-version-file: .nvmrc` `cache: npm` |
| 3 | Cache tsbuildinfo | `actions/cache@v4` keyed on `src/**/*.ts` hash |
| 4 | Install dependencies | `npm ci --engines-strict` |
| 5 | Generate Prisma client | `npx prisma generate` |
| 6 | Build | `npm run build` |
| 7 | Lint | `npm run lint` |
| 8 | Test | `npm run test` (non-ubuntu) / `npm run test:cov` (ubuntu-latest) |
| 9 | Prisma validate | `npx prisma validate` |
| 10 | Audit dependencies | `npm audit --audit-level=high` |
| 11 | Upload coverage | `actions/upload-artifact@v4` (ubuntu-latest only, 7-day retention) |

### Environment Variables

| Variable | Source | Value |
|---|---|---|
| `DATABASE_URL` | Workflow `env:` | `postgresql://ci:ci@localhost:5432/factory_erp` (placeholder — no live DB needed) |
| `JWT_SECRET` | GitHub Actions Secret | `${{ secrets.JWT_SECRET }}` |
| `JWT_EXPIRES_IN` | Workflow `env:` | `15m` |
| `REFRESH_EXPIRES_IN` | Workflow `env:` | `7d` |
| `NODE_ENV` | Workflow `env:` | `test` |

### Security and Governance

| Rule | Implementation |
|---|---|
| Permissions declared (least privilege) | `permissions: contents: read` at workflow level |
| All `uses:` pinned to major version | `@v4` throughout |
| No credentials in workflow file | `JWT_SECRET` from GitHub Actions Secret |
| `npm audit --audit-level=high` | Explicit step; blocks pipeline on high/critical |

---

## Engineering Decisions

| Decision | Rationale |
|---|---|
| `test:cov` on ubuntu-latest, `test` on others | Avoids running tests twice; coverage artifact is informational (ubuntu-only per spec §6.1) |
| `DATABASE_URL` placeholder `postgresql://ci:ci@localhost:5432/factory_erp` | `prisma generate` and `prisma validate` are static; no live DB required (spec §4.2) |
| `fetch-depth: 1` | Shallow clone for CI speed (spec §4.1) |
| `fail-fast: true` | Prevents wasted runner minutes (spec §1.3 MANDATORY) |
| tsbuildinfo cache keyed on `src/**/*.ts` | Invalidated on any source change; OS-specific key prevents cross-OS cache contamination |

---

## Branch Protection (GitHub Configuration)

The following must be configured manually in GitHub repository settings (spec §2.2 — not a workflow concern):

| Rule | Value |
|---|---|
| Required status checks | `ci / build-and-test (ubuntu-latest)` (minimum) |
| Require branches to be up to date | Enabled |
| Restrict force pushes | Enabled |
| Require pull request reviews | Recommended (1 approval) |
| Allow deletions | Disabled |

---

## Quality Gates

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS |
| Lint | `npm run lint` | PASS (0 errors) |
| Tests | `npm run test` | PASS — 482/482 |
| Prisma Validate | `DATABASE_URL="..." npx prisma validate` | PASS |

---

## Repository Health

| Metric | Value |
|---|---|
| Commit | 0bc3f35 |
| Build | PASS |
| Lint | PASS (0 errors) |
| Tests | 482/482 PASS |
| Prisma | PASS |
| Source files modified | 0 |
| Schema files modified | 0 |
| Test files modified | 0 |
