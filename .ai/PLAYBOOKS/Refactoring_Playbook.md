# Refactoring Playbook

Step-by-step procedure for safe code refactoring without introducing regressions.

**Rule:** Refactoring must not change observable behavior. If tests break, either the test is wrong or the refactoring changed behavior — investigate before proceeding.

---

## Eligibility Check

A refactoring is eligible if:
- [ ] The change improves clarity, reduces duplication, or resolves Technical Debt (TD-N items)
- [ ] It does NOT add new features
- [ ] It does NOT change public API contracts (DTOs, endpoint paths, response shapes)
- [ ] It does NOT change database schema

If any of the above are false, this is not a pure refactoring — use `.ai/PLAYBOOKS/Feature_Playbook.md` or `.ai/PLAYBOOKS/Database_Playbook.md`.

---

## Phase 1 — Baseline

Before touching any code:

```bash
npm run test -- --testPathPattern={scope}
# Save the test count and output
npm run lint
npm run build
```

All three must be green. If they are not, fix them first (use Bugfix Playbook), then refactor.

---

## Phase 2 — Identify Scope

State explicitly:
- Which files will change?
- What pattern is being removed / replaced?
- What pattern is replacing it?

Example:
> "Moving AuditRepository from AuthModule to AuditModule (TD-1). Affected files: auth.module.ts, login.use-case.ts, refresh-token.use-case.ts, revoke-session.use-case.ts. Pattern: direct AuditRepository injection → AuditService injection."

---

## Phase 3 — Refactor Incrementally

Refactor one file or one pattern at a time. After each step:
```bash
npm run build  # must exit 0 before moving to next file
```

Do not leave the codebase in a broken intermediate state.

---

## Phase 4 — Test

```bash
npm run test
```

- Same test count as baseline (no tests deleted)
- Zero new failures
- If a test required changing: verify the test itself was testing the wrong thing, not that behavior changed

---

## Phase 5 — Final Check

```bash
npm run lint
npm run build
npm run test
```

All three exit 0.

Run `.ai/REVIEW_PROMPTS/Architecture_Review.md` if the refactoring touched layer boundaries or cross-module dependencies.

---

## Phase 6 — Commit

```bash
git add {specific files}
git commit -m "refactor({scope}): {what changed and why}"
```

Examples:
- `refactor(auth): migrate AuditRepository to AuditService (resolves TD-1)`
- `refactor(common): extract buildPaginationMeta to shared helper`

---

## Phase 7 — Update Technical Debt Register

If the refactoring resolves a TD item in `docs/PROJECT_MEMORY.md`:
- Remove the TD entry from the Technical Debt section
- Update the "Repository Health" section metrics
