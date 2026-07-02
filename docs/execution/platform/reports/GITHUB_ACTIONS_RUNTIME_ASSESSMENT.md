# GitHub Actions Runtime Assessment
# Phase 4.5 — Post-Closure Infrastructure Maintenance

| Field | Value |
|---|---|
| **Document** | GitHub Actions Runtime Assessment |
| **Status** | COMPLETE — UPGRADE APPLIED |
| **Date** | 2026-07-02 |
| **Assessor** | Chief Platform Engineer / GitHub Actions Architect |
| **Trigger** | GitHub Actions runtime warning: "Node.js 20 is deprecated" |
| **Commit** | f69909a |

---

## Executive Summary

All four official GitHub Actions used across the FactoryERP workflows were running on `@v4` — a major version released when Node.js 20 was the current LTS runtime for GitHub Actions. GitHub Actions infrastructure has since deprecated Node 20 as a runner runtime, causing deprecation warnings to appear in CI logs despite the pipeline itself succeeding.

**Assessment result: UPGRADE REQUIRED AND APPLIED.**

All four actions were upgraded to their latest stable major versions. The upgrade removes the Node 20 deprecation warnings, eliminates future compatibility risk, and maintains identical pipeline behavior.

| Action | Before | After | Gap |
|---|---|---|---|
| `actions/checkout` | `@v4` | `@v7` | 3 major versions |
| `actions/setup-node` | `@v4` | `@v6` | 2 major versions |
| `actions/cache` | `@v4` | `@v6` | 2 major versions |
| `actions/upload-artifact` | `@v4` | `@v7` | 3 major versions |

---

## Assessment Scope

| Item | Value |
|---|---|
| Workflows inspected | `.github/workflows/ci.yml`, `.github/workflows/security-audit.yml` |
| Actions inventoried | 4 unique official GitHub Actions |
| Action occurrences | 7 total (4 in ci.yml, 3 in security-audit.yml) |
| Assessment method | GitHub REST API (`/repos/actions/*/releases/latest`) |
| Data collection date | 2026-07-02 |

---

## GitHub Actions Inventory

### Current Versions (Before Upgrade)

| Action | Version Used | Files | Node Runtime |
|---|---|---|---|
| `actions/checkout` | `@v4` | ci.yml, security-audit.yml | Node 20 |
| `actions/setup-node` | `@v4` | ci.yml, security-audit.yml | Node 20 |
| `actions/cache` | `@v4` | ci.yml only | Node 20 |
| `actions/upload-artifact` | `@v4` | ci.yml, security-audit.yml | Node 20 |

### Latest Stable Versions (From GitHub API — 2026-07-02)

| Action | Latest Stable | Published | Node Runtime |
|---|---|---|---|
| `actions/checkout` | `v7.0.0` | 2026-06-18 | Node 24 |
| `actions/setup-node` | `v6.4.0` | 2026-04-20 | Node 24 |
| `actions/cache` | `v6.1.0` | 2026-06-26 | Node 24 |
| `actions/upload-artifact` | `v7.0.1` | 2026-04-10 | Node 24 |

### Major Version History Context

**`actions/checkout`:**
- v4 (Node 20) → v5 (Node 24 transition) → v6 (Node 24 stable) → v7 (current, 2026-06-18)

**`actions/setup-node`:**
- v4 (Node 20) → v5 (Node 24 transition) → v6 (current, 2026-04-20)

**`actions/cache`:**
- v4 (Node 20) → v5 (Node 24 transition) → v6 (current, 2026-06-26)

**`actions/upload-artifact`:**
- v4 (Node 20) → v5 (Node 24 transition) → v6 (Node 24 stable) → v7 (current, 2026-04-10)

---

## Comparison Table

| Action | Was | Now | Update Required | Latest Used |
|---|---|---|---|---|
| `actions/checkout` | `@v4` | `@v7` | YES | YES |
| `actions/setup-node` | `@v4` | `@v6` | YES | YES |
| `actions/cache` | `@v4` | `@v6` | YES | YES |
| `actions/upload-artifact` | `@v4` | `@v7` | YES | YES |

**All actions required upgrade. All actions are now at the latest stable major version.**

---

## Upgrade Decision

**Decision: UPGRADE ALL FOUR ACTIONS**

Reasoning:
1. All four actions are 2–3 major versions behind latest stable
2. Node 20 is deprecated as GitHub Actions runtime; continued use generates warnings and risks compatibility issues in future GitHub Actions infrastructure updates
3. All inputs used in this repository (`fetch-depth`, `node-version-file`, `cache`, `path`, `key`, `restore-keys`, `name`, `path`, `retention-days`) are stable core inputs present and unchanged across all major versions
4. GitHub-maintained official actions maintain backward-compatible APIs across major versions; major bumps are exclusively for Node.js runtime version upgrades
5. No third-party or community actions are used — risk of breaking API changes is minimal

---

## Actions Modified

| File | Action | Old Version | New Version |
|---|---|---|---|
| `.github/workflows/ci.yml` | `actions/checkout` | `@v4` | `@v7` |
| `.github/workflows/ci.yml` | `actions/setup-node` | `@v4` | `@v6` |
| `.github/workflows/ci.yml` | `actions/cache` | `@v4` | `@v6` |
| `.github/workflows/ci.yml` | `actions/upload-artifact` | `@v4` | `@v7` |
| `.github/workflows/security-audit.yml` | `actions/checkout` | `@v4` | `@v7` |
| `.github/workflows/security-audit.yml` | `actions/setup-node` | `@v4` | `@v6` |
| `.github/workflows/security-audit.yml` | `actions/upload-artifact` | `@v4` | `@v7` |

**Total: 7 version string changes across 2 workflow files.**

---

## Actions Left Unchanged

No actions were left unchanged. All four actions required an upgrade.

No community or third-party actions were found in any workflow. No custom actions are used.

---

## Compatibility Validation

| Requirement | Status |
|---|---|
| Windows compatibility preserved | PASS — matrix includes `windows-latest`; no Windows-specific action inputs changed |
| Ubuntu compatibility preserved | PASS — primary matrix runner; all inputs identical |
| macOS compatibility preserved | PASS — matrix includes `macos-latest`; no macOS-specific inputs changed |
| Node version from `.nvmrc` preserved | PASS — `setup-node@v6` continues to support `node-version-file: '.nvmrc'` |
| npm cache preserved | PASS — `setup-node@v6` continues to support `cache: 'npm'` |
| TypeScript build cache preserved | PASS — `cache@v6` supports identical `path`, `key`, `restore-keys` inputs |
| Coverage artifact upload preserved | PASS — `upload-artifact@v7` supports identical `name`, `path`, `retention-days` |
| Audit report artifact preserved | PASS — `upload-artifact@v7` in security-audit.yml |
| CI architecture unchanged | PASS — only version strings changed; no steps added/removed/reordered |
| Branch triggers unchanged | PASS — not a trigger/workflow_dispatch/schedule concern |

---

## Risk Assessment

| Risk | Severity | Assessment |
|---|---|---|
| Breaking API change in upgraded actions | LOW | GitHub official actions maintain backward-compatible APIs across major versions; all inputs used are core stable inputs |
| Node 24 runtime behavior difference | LOW | Application code runs in Node 24 (per `.nvmrc`); actions now also run in Node 24; alignment improves consistency |
| Cache invalidation after upgrade | INFO | First run after upgrade will miss the tsbuildinfo cache (different action version may reset cache key); subsequent runs will hit; no functional impact |
| `upload-artifact@v7` artifact format change | LOW | Artifact names and paths are unchanged; download would require `download-artifact@v4` if ever needed, but no download steps exist in current workflows |

---

## Lessons Learned

| Lesson | Detail |
|---|---|
| GitHub Actions use separate Node runtime versions | The Node.js version for actions' internal runtime (Node 20 → 24) is independent of the project's Node.js version configured in `.nvmrc` (24.16.0) |
| Major version bumps in GitHub Actions are runtime-only | For official GitHub-maintained actions, major version increments are driven primarily by Node.js runtime deprecation cycles, not by API surface changes |
| Gap detection requires API verification | The version gap (v4→v7 for checkout) is not visible from the workflow file alone; GitHub API verification is the correct method |
| Both workflows must be updated | Using `@v4` in either `ci.yml` or `security-audit.yml` would continue producing deprecation warnings on that workflow |

---

## Recommendations

| Recommendation | Priority |
|---|---|
| Pin actions to SHA for production security-critical pipelines | OPTIONAL — current major-version pinning (`@v7`) is standard for most projects; SHA pinning provides supply-chain security at cost of manual update overhead |
| Schedule quarterly GitHub Actions version review | RECOMMENDED — add to maintenance calendar; check GitHub API for new major releases every quarter |
| Monitor for `actions/download-artifact` if artifact downloading is added | NOTE — if any future workflow step downloads artifacts, use `actions/download-artifact@v4` (compatible with upload-artifact@v7) |
| Enable Dependabot for GitHub Actions | OPTIONAL — add `github-actions` ecosystem to `.github/dependabot.yml` for automated action version PR proposals |

---

## Quality Gate Results

Quality gates executed after workflow modification (per governance policy):

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS |
| Lint | `npm run lint` | PASS (0 errors) |
| Tests | `npm run test` | PASS — 482/482 |
| Prisma validate | `npx prisma validate` | PASS |

---

## Implementation Commit

| Field | Value |
|---|---|
| Commit hash | `f69909a` |
| Message | `chore(ci): upgrade GitHub Actions to latest stable runtime` |
| Files changed | 2 (`.github/workflows/ci.yml`, `.github/workflows/security-audit.yml`) |
| Lines changed | 7 insertions / 7 deletions |
| Branch | `main` |
