# Bugfix Playbook

Step-by-step procedure for diagnosing and fixing a non-critical bug.

For production-blocking or security bugs → use `.ai/PLAYBOOKS/Emergency_Fix_Playbook.md` instead.

---

## Phase 1 — Triage

**1.1 Classify the bug**

| Severity | Criteria | Playbook |
|----------|----------|----------|
| Critical | Data corruption, security bypass, production down | Emergency_Fix_Playbook |
| High | Core business flow broken, data loss possible | This playbook (expedited) |
| Medium | Feature degraded, workaround exists | This playbook |
| Low | Cosmetic, minor UX issue | This playbook |

**1.2 Locate the defect**
```bash
# Find relevant test failures:
npm run test -- --testPathPattern={area}

# Find relevant source files:
grep -r "{symptom_keyword}" src/ --include="*.ts" -l
```

**1.3 Write a failing test first**
Before fixing the code, write a test that reproduces the bug. This proves:
- The bug is understood correctly
- The fix actually resolves it
- Regression cannot recur silently

---

## Phase 2 — Root Cause Analysis

Ask:
1. Which layer contains the defect? (Controller / Use Case / Service / Repository)
2. Is it a logic error, a missing validation, or a wrong assumption?
3. Was there a test that should have caught this? If not, why not?

**Do NOT fix symptoms.** Fix the root cause.

---

## Phase 3 — Fix

Apply the minimal change that resolves the root cause.

Rules:
- Do not refactor unrelated code in the same commit
- Do not add features in a bugfix commit
- Do not change DTOs in a way that breaks API contracts unless the bug requires it

If the fix requires changing Prisma schema → follow `.ai/PLAYBOOKS/Database_Playbook.md`.

---

## Phase 4 — Verify

```bash
npm run lint
npm run build
npm run test
```

- The failing test from Phase 1 now passes
- No other tests broke
- All three commands exit 0

---

## Phase 5 — Commit

```bash
git add src/{affected files} test/{affected files}
git commit -m "fix({scope}): {short description of what was wrong and what was fixed}"
```

Commit message must reference the fix, not just describe "what changed."

Examples:
- `fix(auth): refresh token not invalidated on session revocation`
- `fix(cmo): line item total not recalculated on quantity update`

---

## Phase 6 — Post-Fix

- [ ] Update `docs/PROJECT_MEMORY.md` Technical Debt section if this bug was a known item
- [ ] If the bug exposed a missing architectural safeguard, create an ADR documenting the prevention pattern
- [ ] If the bug was High severity, update the Risks section of `docs/PROJECT_MEMORY.md`
