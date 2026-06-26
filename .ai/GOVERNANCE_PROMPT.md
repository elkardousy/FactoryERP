# GOVERNANCE PROMPT — FactoryERP Engineering Governance

> Governs all engineering decisions, approvals, reviews, lifecycle management, and policy enforcement.

---

## 1. Engineering Principles

The following principles govern all engineering decisions. They are derived from the project's 14 Architecture Principles (see `docs/architecture/ARCHITECTURE_PRINCIPLES.md`) and are summarized here for quick reference.

| # | Principle | Rule |
|---|-----------|------|
| P-1 | Strict Layer Ordering | Controllers → Use Cases → Services → Repositories → PrismaService |
| P-2 | Use Cases Own Business Logic | No logic in Controllers or Repositories |
| P-3 | Services Are Cross-Cutting | Reusable, stateless capabilities only |
| P-4 | Deny by Default | No `@Roles()` = system admin only |
| P-5 | Audit Every Write | `void this.auditService.log()` on all mutations |
| P-6 | No process.env | `ConfigService.getOrThrow()` always |
| P-7 | BigInt PKs | All primary keys are `BigInt` |
| P-8 | Schema First | Prisma schema is the source of truth |
| P-9 | Stable API Contracts | URI versioning, never remove existing versions |
| P-10 | LoggerService Only | No `console.log` in production code |
| P-11 | Repository Isolation | Repositories are module-private |
| P-12 | Factory Schema | All tables in `factory` PostgreSQL schema |
| P-13 | Interface at Boundaries | Depend on interfaces for swappable infrastructure |
| P-14 | Tests for All Use Cases | Every Use Case has a unit test suite |

---

## 2. Architecture Ownership

| Role | Responsibility |
|------|---------------|
| Chief Architect | ADR authorship, architecture review approval, breaking change decisions |
| Module Owner | Use-case correctness, test coverage, documentation for their module |
| Platform Owner | Core infrastructure changes: PrismaModule, LoggerModule, AuditModule, global filters/pipes |
| Release Manager | Release notes, version tagging, checkpoint updates, GitHub releases |

In AI-assisted development, the AI fulfills all roles under human review. All ADRs and acceptance decisions are recorded in the repository.

---

## 3. Approval Flow

### Feature / New Module

```
Schema PR → Architecture Review → Code PR → Code Quality Review → Acceptance Review → Merge → Documentation Update → Checkpoint Update
```

### Breaking Change

```
Problem Statement → ADR Draft → Architecture Review → ADR Accepted → Implementation PR → Security Review (if auth/data affected) → Acceptance Review → Merge → Release Notes → Version Bump
```

### ADR Creation

```
Identify decision → Draft ADR using TEMPLATES/ADR_Template.md → Architecture Review → Status: Accepted → Add to ADR_INDEX.md → Commit
```

### Emergency Fix

```
Read Emergency_Fix_Playbook.md → Minimal fix branch → Code review → Merge → Post-mortem ADR (if architectural) → Checkpoint Update
```

---

## 4. ADR Lifecycle

| Status | Meaning | Transition |
|--------|---------|-----------|
| Proposed | Draft under review | → Accepted after Architecture Review |
| Accepted | Decision is in effect | → Superseded when replaced by newer ADR |
| Superseded | Replaced by a later ADR | Terminal — links to replacement |
| Deprecated | No longer applies; no replacement | Terminal |

**Rules:**
- ADR numbers are monotonically increasing. Never reuse a number.
- A decision already covered by an Accepted ADR may NOT be re-decided without first writing a Superseding ADR.
- Every new ADR must reference related ADRs in its "Related Components" section.
- ADR file naming: `ADR-{NNN}-{Title-Kebab-Case}.md`

---

## 5. Release Lifecycle

```
Sprint Complete
  → All Quality Gates pass
  → Acceptance Review passed
  → Documentation updated (PROJECT_MEMORY, CHECKPOINT, release notes)
  → Git commit (release commit)
  → Annotated Git tag created
  → GitHub Release published
  → PROJECT_MEMORY "Latest Tag" updated
  → PROJECT_CHECKPOINT refreshed
  → Governance_Update.md executed
```

**Version naming:**
```
v{major}.{minor}.0-{milestone-slug}
```

Examples:
- `v0.3.0-business-foundation`
- `v0.4.0-cmo-foundation`
- `v0.5.0-inventory-engine`
- `v1.0.0` (production release)

Patch versions (`v0.x.{patch}`) are reserved for hotfixes between milestones.

---

## 6. Sprint Lifecycle

Each sprint follows this governance sequence:

**Sprint Start:**
1. AI reads all mandatory startup documents
2. AI opens the sprint prompt from `.ai/SPRINT_PROMPTS/`
3. Current technical debt is reviewed; high-priority items are addressed first

**Sprint Implementation:**
- Schema changes committed separately from application code changes
- Test coverage maintained or increased every commit
- ADRs written for any new architectural decisions before implementation

**Sprint Close:**
1. All quality gates pass
2. Acceptance review executed
3. `docs/PROJECT_MEMORY.md` updated
4. `docs/checkpoints/PROJECT_CHECKPOINT.md` updated
5. Sprint report created in `docs/sprint-reports/`
6. Release executed if milestone is complete

---

## 7. Technical Debt Policy

**Classification:**
- **Critical**: blocks correct operation (must fix before next commit)
- **High**: violates architecture invariants or security (must fix this sprint)
- **Medium**: degrades code quality or user experience (schedule within 2 sprints)
- **Low**: minor improvement (schedule when convenient)

**Tracking:**
- All technical debt is recorded in `docs/PROJECT_MEMORY.md` under "Technical Debt"
- Every item has an ID (TD-N), priority, and description
- Items are resolved in priority order before adding new features
- Resolved items are removed from PROJECT_MEMORY and noted in the sprint report

---

## 8. Refactoring Policy

- No refactoring within the same PR as a feature addition
- Large refactors require an ADR if they cross module boundaries
- Refactoring must not reduce test count
- Performance refactoring requires a Performance Review before and after
- See `PLAYBOOKS/Refactoring_Playbook.md` for procedure

---

## 9. Deprecation Policy

- No public API is removed without a two-sprint deprecation notice in the release notes
- Deprecated endpoints return a `Deprecation` response header
- The replacement must be available before the deprecation is announced
- ADR required for any API deprecation

---

## 10. Backward Compatibility Policy

- Major version (`v1.x.x` → `v2.x.x`): breaking changes allowed with full migration guide
- Minor version (`v0.3.x` → `v0.4.x`): additive only; no removal of existing endpoints or fields
- Patch version: bug fixes only; no behavioral changes to existing endpoints

**Breaking changes require:**
- New version number
- Migration guide in release notes
- Minimum two-sprint advance notice
- Updated Swagger documentation

---

## 11. Security Governance

- Security reviews are mandatory for: new authentication flows, new authorization patterns, new data access patterns, dependency upgrades touching security libraries
- Vulnerabilities are classified: Critical (fix immediately), High (fix this sprint), Medium (fix within two sprints)
- Sensitive data in logs is never acceptable — automatic redaction is configured; it must not be disabled
- No security-related ADR is optional — every security decision must be documented

---

## 12. AI-EOS Governance

Changes to any file in `.ai/` require:
1. Architecture Review (via `REVIEW_PROMPTS/Architecture_Review.md`)
2. ADR if the change affects architecture invariants
3. Acceptance Review
4. Documentation update
5. Checkpoint update

Rationale: AI-EOS files directly affect how every future session operates. Incorrect guidance in a prompt or checklist will propagate across all future development.

---

## 13. Repository Documentation Supremacy

**The repository documentation is the single source of truth.**

If any of the following conflict with each other, priority order is:
1. `MASTER_PROMPT.md` (this context)
2. Active ADRs (by number, higher = more recent)
3. `docs/PROJECT_MEMORY.md`
4. `CLAUDE.md`
5. Prior conversation history (lowest priority — may be stale)

A new AI session must never operate from conversation memory alone. Repository documents take precedence.
