# Acceptance Review — Sprint {N} — {Sprint Name}

**Date:** {YYYY-MM-DD}
**Reviewer:** {Name / AI Session}
**Sprint prompt:** `.ai/SPRINT_PROMPTS/Sprint_{N}_{Name}.md`
**Release target:** v{X.Y.Z}-{slug}

---

## Sprint Objectives Assessment

| Objective | Status | Notes |
|-----------|--------|-------|
| {Objective 1} | ✅ Complete / ❌ Incomplete / ⚠️ Partial | |
| {Objective 2} | | |

**Objectives complete:** {N}/{M}

---

## Acceptance Criteria Assessment

| Criterion | Status | Evidence |
|-----------|--------|---------|
| `npm run lint` exits 0 | ✅ / ❌ | |
| `npm run build` succeeds | ✅ / ❌ | |
| All tests passing | ✅ / ❌ | {N} tests |
| {Business criterion 1} | ✅ / ❌ | |
| {Business criterion 2} | ✅ / ❌ | |
| All endpoints have `@Roles()` | ✅ / ❌ | |
| Audit events on all writes | ✅ / ❌ | |
| ADR-{NNN} written | ✅ / ❌ | |

**Criteria met:** {N}/{M}

---

## Quality Gates

| Gate | Status |
|------|--------|
| Build Gate | ✅ PASS / ❌ FAIL |
| Testing Gate | ✅ PASS / ❌ FAIL |
| Architecture Gate | ✅ PASS / ❌ FAIL |
| Security Gate | ✅ PASS / ❌ SKIP (not required) |
| Performance Gate | ✅ PASS / ❌ FAIL |
| Documentation Gate | ✅ PASS / ❌ FAIL |

---

## Review Results

| Review | Result | Date |
|--------|--------|------|
| Architecture Review | PASS / FAIL | |
| Security Review | PASS / CONDITIONAL / N/A | |
| Performance Review | PASS / CONDITIONAL | |
| Code Quality Review | PASS / CONDITIONAL | |
| Documentation Review | PASS / FAIL | |

---

## Test Summary

```
Test Suites: {N} passed, {N} total
Tests:       {N} passed, {N} total
Previous:    {N} tests (Sprint {N-1})
Delta:       +{N} tests this sprint
```

---

## Findings

### Critical (blocks release)

{List findings or "None"}

### High (must be documented as TD)

{List findings or "None"}

### Medium / Low (noted for future sprints)

{List findings or "None"}

---

## Documentation Status

- [ ] `docs/PROJECT_MEMORY.md` updated
- [ ] `docs/checkpoints/PROJECT_CHECKPOINT.md` updated
- [ ] ADR-{NNN} written and in ADR_INDEX
- [ ] Sprint report in `docs/sprint-reports/`
- [ ] Release notes in `docs/releases/`

---

## Final Verdict

**Status:** ACCEPTED / CONDITIONAL ACCEPTED / REJECTED

**Rationale:**
{One paragraph explaining the verdict}

**Conditions (if CONDITIONAL):**
{List any conditions for final acceptance}

**Recommended Git Tag:** v{X.Y.Z}-{slug}
