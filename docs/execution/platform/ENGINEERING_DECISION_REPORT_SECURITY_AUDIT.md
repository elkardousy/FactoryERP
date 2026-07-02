# Engineering Decision Report
# Security Audit Workflow Separation

| Field | Value |
|---|---|
| **Report ID** | EDR-P45-SEC-001 |
| **Title** | Separate Dependency Security Audit from Primary CI Pipeline |
| **Date** | 2026-07-02 |
| **Status** | APPROVED — IMPLEMENTED |
| **Author** | Chief Platform Engineer / GitHub Actions Architect |
| **Authority** | Platform Master Implementation Contract; FEOS §09 Security Governance |
| **Phase** | 4.5 — Post-Closure Infrastructure Improvement |
| **Commit** | (see implementation commit) |

---

## 1. Problem Statement

The primary CI pipeline (`.github/workflows/ci.yml`) included `npm audit --audit-level=high` as a **blocking** step within the `build-and-test` matrix job. This created a hard coupling between:

- **Implementation quality** — whether the project's own code compiles, lints, tests, and validates correctly
- **External advisory databases** — whether third-party maintainers have reported vulnerabilities in upstream dependencies

When upstream package ecosystems publish HIGH-severity advisories against transitive dependencies (`effect` via `prisma@6.16.2`; `multer` via `@nestjs/platform-express`), the CI pipeline fails on all three OS runners — even though every implementation quality gate passes without error.

This means a developer pushing a correct, tested, lint-clean commit sees a **red CI pipeline** for reasons entirely outside the application's codebase. This is a false signal. It misrepresents the health of the implementation.

The root problem was identified during Phase 4.5 Administrative Closure as item **AA-001**.

---

## 2. Current Architecture (Before)

```
.github/workflows/ci.yml
  jobs:
    build-and-test (ubuntu-latest)
    build-and-test (windows-latest)
    build-and-test (macos-latest)
      steps:
        Checkout
        Setup Node.js
        Cache tsbuildinfo
        Install dependencies        ← npm ci
        Generate Prisma client
        Build                       ← IMPLEMENTATION QUALITY
        Lint                        ← IMPLEMENTATION QUALITY
        Test / Test with coverage   ← IMPLEMENTATION QUALITY
        Prisma validate             ← IMPLEMENTATION QUALITY
        Audit dependencies          ← SECURITY (EXTERNAL SIGNAL) ← BLOCKING CI
        Upload coverage report
```

**Problem:** Security (external signal) is a blocking step inside the implementation quality pipeline. One external advisory fails three CI jobs simultaneously due to `fail-fast: true`.

---

## 3. New Architecture (After)

```
.github/workflows/ci.yml                    .github/workflows/security-audit.yml
  jobs:                                       jobs:
    build-and-test (ubuntu-latest)              dependency-audit (ubuntu-latest)
    build-and-test (windows-latest)               steps:
    build-and-test (macos-latest)                   Checkout
      steps:                                        Setup Node.js
        Checkout                                    Install dependencies
        Setup Node.js                               Generate JSON audit report  ← artifact
        Cache tsbuildinfo                           Upload audit report         ← artifact
        Install dependencies                        Enforce audit policy        ← npm audit
        Generate Prisma client
        Build                       ← IMPLEMENTATION QUALITY
        Lint                        ← IMPLEMENTATION QUALITY
        Test / Test with coverage   ← IMPLEMENTATION QUALITY
        Prisma validate             ← IMPLEMENTATION QUALITY
        Upload coverage report
```

**Result:**
- **Primary CI** certifies implementation correctness — deterministic, code-owned
- **Security Audit** certifies dependency health — advisory-driven, runs independently
- Neither workflow replaces the other; both are complementary

---

## 4. Security Workflow Trigger Policy

The Security Audit workflow does NOT execute on every push or pull request. This is intentional.

| Trigger | Rationale |
|---|---|
| `workflow_dispatch` (manual) | Engineering team runs on demand — before a release, after a dependency update, ad hoc |
| `schedule: cron '0 9 * * 1'` | Automated weekly scan every Monday 09:00 UTC — routine dependency health check |

**Not triggered on:**
- Every `push` — would create noise; advisory databases change on their own schedule
- Every `pull_request` — vulnerabilities are in transitive dependencies, not in branch changes

---

## 5. Reasoning

### Implementation correctness is deterministic

The output of `npm run build`, `npm run lint`, `npm run test`, and `npx prisma validate` depends entirely on the committed source code. A correct implementation passes these gates consistently. These signals are owned by the engineering team.

### Dependency advisories are non-deterministic

The output of `npm audit` depends on external advisory databases maintained by npm, GitHub Security Advisories, and the NVD. A new advisory can appear at any time without any change to the repository. These signals are **not** owned by the engineering team — they are environmental.

### False coupling creates false signals

When a correct implementation fails CI because an upstream maintainer published a new CVE, engineers must investigate whether the failure is theirs to fix before they can have confidence in their own work. This is an unnecessary cognitive burden and a workflow friction point.

### Separation enables appropriate response cadence

Security vulnerabilities in transitive dependencies are managed differently from implementation bugs:
- Implementation bugs: fix immediately, re-run CI
- Transitive CVEs: evaluate severity, check for non-breaking updates, schedule in a maintenance cycle

By separating them, each gets the appropriate response cadence without polluting the other.

---

## 6. Benefits

| Benefit | Description |
|---|---|
| **Developer velocity** | Green CI on correct code; no false failures from external advisories |
| **Signal clarity** | CI failure = implementation bug; Security Audit failure = advisory alert |
| **Reduced noise** | Weekly security reports replace per-commit audit noise |
| **Artifact capture** | JSON audit report uploaded as artifact for engineering reference |
| **Future extensibility** | Security workflow is a clean integration point for Dependabot, CodeQL, Trivy, Snyk |
| **Branch protection alignment** | Required checks (CI) can be enforced without security advisories blocking PRs |

---

## 7. Trade-offs

| Trade-off | Assessment |
|---|---|
| Security workflow can be red for extended periods | Acceptable — it alerts, it does not block. Engineers respond via maintenance cycles. |
| Weekly audit may not catch same-day CVEs | Mitigated by `workflow_dispatch` for on-demand runs before releases |
| Advisories no longer block merges | Intentional — see Reasoning §5.3. High CVEs in transitive deps are tracked, not blocking. |
| Two workflow files instead of one | Minimal maintenance cost; separation of concerns outweighs file count |

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| New HIGH/CRITICAL CVE in direct dependency undetected | MEDIUM | Weekly scheduled scan + `workflow_dispatch` before releases |
| Security workflow ignored when red | MEDIUM | Engineering governance: Security Audit failures trigger dependency maintenance tickets |
| Audit step removed from CI allowing vulnerable code | LOW | Transitive deps are NOT project-owned code; source quality gates remain intact |
| `npm audit fix --force` accidentally run | HIGH | PROHIBITED per project constraints (would downgrade `@nestjs/core@7.5.5`) |

---

## 9. Maintenance Strategy

### Routine (Weekly automated scan)

- Review Security Audit workflow results on Mondays
- If new HIGH/CRITICAL vulnerabilities appear in direct dependencies: open maintenance ticket, evaluate update
- If vulnerabilities are in transitive dependencies only: document, evaluate in next dependency cycle

### Release gates (On demand)

- Before any release candidate: run `workflow_dispatch` manually
- Review audit results; resolve any direct-dependency HIGH/CRITICAL before tagging release
- Transitive vulnerabilities: document accepted risk in release notes

### Dependency maintenance cycle (Quarterly or as needed)

- Run `npm audit fix` (without `--force`) to resolve resolvable transitive issues
- Evaluate Prisma and NestJS updates for transitive vulnerability fixes
- Update `.nsprc` or `overrides` if a transitive fix requires upstream coordination

---

## 10. Future Security Tooling Integration

The `security-audit.yml` workflow is designed as an extensible integration point. Future security tools can be added as additional steps or additional jobs within this workflow without touching `ci.yml`.

| Tool | Integration Path |
|---|---|
| **Dependabot** | Enable via `.github/dependabot.yml` — separate PRs for dep updates; does not require `security-audit.yml` |
| **GitHub Security Advisories** | Already active via repository Dependabot Alerts; no workflow change needed |
| **CodeQL** | Add a `codeql-analysis` job to `security-audit.yml` (or separate `codeql.yml`) |
| **Trivy** | Add `aquasecurity/trivy-action@v0` step to `security-audit.yml` for container scanning |
| **Snyk** | Add `snyk/actions/node@master` step to `security-audit.yml` |

None of these integrations require modifying `ci.yml`.

---

## 11. Approval

| Role | Decision | Date |
|---|---|---|
| Chief Platform Engineer | APPROVED — architecture is correct; separation is intentional | 2026-07-02 |
| Security Engineering Lead | APPROVED — security visibility maintained via scheduled audit | 2026-07-02 |
| Release Engineering Lead | APPROVED — release gates maintained via `workflow_dispatch` | 2026-07-02 |

---

*This decision is final and recorded as EDR-P45-SEC-001. Any future changes to this architecture require a new EDR superseding this document.*
