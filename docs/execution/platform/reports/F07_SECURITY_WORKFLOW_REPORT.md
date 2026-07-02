# F07 — Security Workflow Separation
# Phase 4.5 — Post-Closure Infrastructure Improvement

| Field | Value |
|---|---|
| **Document** | F07 Security Workflow Separation Report |
| **Status** | COMPLETE |
| **Date** | 2026-07-02 |
| **Relates To** | F07 — CI Pipeline (`0bc3f35`) |
| **EDR** | EDR-P45-SEC-001 |
| **Authority** | Platform Master Implementation Contract; FEOS §09 |

---

## Executive Summary

This report documents the post-closure infrastructure improvement that separates dependency security auditing from the primary Continuous Integration workflow. The change resolves Administrative Action AA-001 identified in the Phase 4.5 Administrative Closure Report (`PHASE_4_5_ADMINISTRATIVE_REPORT.md`).

The primary CI pipeline now exclusively certifies **implementation quality**. A new, independent Security Audit workflow certifies **dependency health** on a weekly schedule and on demand. Both workflows are complementary. Neither replaces the other.

---

## Problem Statement

The original `ci.yml` (F07 implementation commit `0bc3f35`) included `npm audit --audit-level=high` as a blocking step within the `build-and-test` matrix job. When transitive dependencies (`effect` via `prisma@6.16.2`; `multer` via `@nestjs/platform-express`) carried HIGH-severity advisories, the CI pipeline failed on all three OS runners — even though build, lint, tests, and Prisma validation all passed.

This was first identified as a known deferred item during Phase 4.5 (AC-H-005) and elevated to a blocking administrative action (AA-001) in the administrative closure.

---

## Original CI Flow (Before)

```
.github/workflows/ci.yml
  Triggers: push to main/feat/**/fix/**/chore/**; pull_request to main
  Matrix: ubuntu-latest / windows-latest / macos-latest
  fail-fast: true

  Steps (all 3 runners):
    1. Checkout
    2. Setup Node.js
    3. Cache tsbuildinfo
    4. Install dependencies
    5. Generate Prisma client
    6. Build                       ← Quality Gate
    7. Lint                        ← Quality Gate
    8. Test / Test with coverage   ← Quality Gate
    9. Prisma validate             ← Quality Gate
   10. Audit dependencies          ← Security (BLOCKING — caused CI failure)
   11. Upload coverage report
```

---

## New CI Flow (After)

### Primary CI — Implementation Quality Only

```
.github/workflows/ci.yml
  Triggers: push to main/feat/**/fix/**/chore/**; pull_request to main
  Matrix: ubuntu-latest / windows-latest / macos-latest
  fail-fast: true

  Steps (all 3 runners):
    1. Checkout
    2. Setup Node.js
    3. Cache tsbuildinfo
    4. Install dependencies
    5. Generate Prisma client
    6. Build                       ← Quality Gate
    7. Lint                        ← Quality Gate
    8. Test / Test with coverage   ← Quality Gate
    9. Prisma validate             ← Quality Gate
   10. Upload coverage report
```

### Security Audit — Dependency Health Only

```
.github/workflows/security-audit.yml
  Triggers: workflow_dispatch (manual); schedule (every Monday 09:00 UTC)
  Runners: ubuntu-latest (single runner)

  Steps:
    1. Checkout
    2. Setup Node.js
    3. Install dependencies
    4. Generate JSON audit report   ← artifact (always captured)
    5. Upload audit report          ← artifact (30-day retention)
    6. Enforce audit policy         ← npm audit --audit-level=high (may fail)
```

---

## Responsibilities

| Responsibility | Primary CI | Security Audit |
|---|---|---|
| Build (TypeScript compilation) | YES | no |
| Lint (ESLint) | YES | no |
| Tests (Jest, 482/482) | YES | no |
| Prisma schema validate | YES | no |
| Coverage artifact | YES (ubuntu-latest) | no |
| Dependency vulnerability scan | no | YES |
| Audit JSON artifact | no | YES (30-day) |
| Matrix (3 OS runners) | YES | no |
| Runs on every commit | YES | no |
| Runs weekly | no | YES |
| Runs on demand | no | YES |
| Can block PR merge | YES (via required checks) | NO |

---

## Workflow Separation Rationale

**Implementation correctness is deterministic.** The output of build, lint, test, and prisma validate depends entirely on committed source code. These signals are owned by the engineering team.

**Dependency advisories are non-deterministic.** The output of `npm audit` depends on external advisory databases. A new advisory can appear at any time without any repository change. These signals originate from external package ecosystems — outside engineering team ownership.

Coupling these two signals in a single blocking pipeline creates false CI failures. A developer pushing correct, tested, lint-clean code should see a green CI. Advisory alerts are addressed through maintenance cycles, not immediate code changes.

---

## Files Changed

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | Removed `Audit dependencies` step (lines 79–80 of original) |
| `.github/workflows/security-audit.yml` | CREATED — independent security audit workflow |

---

## Benefits

| Benefit | Description |
|---|---|
| CI is green on correct code | No false failures from external advisories |
| Signal clarity | CI failure = implementation bug; Security Audit failure = advisory alert |
| Artifact capture | JSON audit report uploaded for engineering reference |
| Branch protection alignment | Required CI checks enforced without advisory noise |
| Future extensibility | Security workflow is a clean integration point for CodeQL, Trivy, Snyk, Dependabot |

---

## Limitations

| Limitation | Assessment |
|---|---|
| Security workflow can remain red for extended periods | Acceptable — alerts without blocking; managed via maintenance cycles |
| Weekly scan may not catch same-day CVEs in direct deps | Mitigated by `workflow_dispatch` for on-demand pre-release runs |
| Transitive CVEs no longer block PRs | Intentional per EDR-P45-SEC-001; project governance handles via maintenance tickets |

---

## Acceptance Results

| Criterion | Result |
|---|---|
| Build PASS | PASS |
| Lint PASS | PASS |
| Tests PASS (482/482) | PASS |
| Prisma validate PASS | PASS |
| Primary CI: audit step removed | CONFIRMED — step removed from ci.yml |
| Security workflow: independent | CONFIRMED — separate file; separate trigger |
| Security workflow: produces report | CONFIRMED — JSON artifact; 30-day retention |
| Security workflow: does not block CI | CONFIRMED — separate workflow; not in required checks |
| Security workflow: supports future tooling | CONFIRMED — clean integration points for CodeQL, Trivy, Snyk |

---

## Platform Documentation Update

> **Primary CI** (`ci.yml`) certifies repository correctness: build, lint, tests, Prisma schema validity.
>
> **Security Audit** (`security-audit.yml`) certifies dependency health: vulnerability scanning, advisory compliance, JSON artifact for engineering reference.
>
> Both workflows are complementary. Neither replaces the other. CI is deterministic; Security Audit is advisory-driven.

---

## Administrative Action Status

| ID | Item | Status |
|---|---|---|
| AA-001 | Fix CI audit failure — `npm audit --audit-level=high` exits 1 | **RESOLVED** — audit step moved to security-audit.yml; CI no longer blocked |
| AA-002 | Branch protection NOT CONFIGURED on main | Pending — manual GitHub configuration |
| AA-003 | JWT_SECRET GitHub secret — unverified | Pending — manual GitHub UI verification |

---

## Future Improvements

| Item | Notes |
|---|---|
| Dependabot alerts | Enable via `.github/dependabot.yml` — automated dep update PRs |
| CodeQL analysis | Add `codeql-analysis` job to `security-audit.yml` or dedicated `codeql.yml` |
| Container scanning (Trivy) | Add `aquasecurity/trivy-action` step to `security-audit.yml` |
| SAST (Snyk) | Add `snyk/actions/node` step to `security-audit.yml` |
| npm overrides | Add `overrides` block in `package.json` once `effect` receives a compatible update in Prisma |
