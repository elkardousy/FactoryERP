# Acceptance Review Prompt

**Purpose:** Final verification that a sprint is complete, correct, and ready for release.

---

## Inputs Required

- Sprint prompt from `.ai/SPRINT_PROMPTS/Sprint_N_*.md`
- Architecture Review result
- Security Review result (if applicable)
- Performance Review result
- `npm run lint` output
- `npm run build` output
- `npm run test` output

---

## Review Process

### Step 1 — Sprint Objective Verification

For each objective listed in the sprint prompt:
- [ ] Is it implemented?
- [ ] Is it tested?
- [ ] Is it documented (Swagger, ADR if applicable)?

### Step 2 — Acceptance Criteria Checklist

For each item in the sprint prompt's "Acceptance Criteria" section:
- [ ] Is the criterion met?
- [ ] Is there a test that verifies it?
- [ ] Can it be demonstrated via a Swagger request?

### Step 3 — Quality Gates Verification

```bash
npm run lint    # Must exit 0 with no output
npm run build   # Must exit 0 with no TypeScript errors
npm run test    # All suites must pass; count must not have decreased
```

- [ ] Lint: 0 errors, 0 warnings
- [ ] Build: clean
- [ ] Tests: all passing; count ≥ previous sprint's count

### Step 4 — Architecture Compliance

- [ ] Architecture Review: PASSED
- [ ] No new critical violations since Architecture Review
- [ ] All new ADRs written and accepted

### Step 5 — Security Compliance

- [ ] Security Review: PASSED or CONDITIONAL PASS
- [ ] No new critical or high security findings

### Step 6 — Documentation Completeness

- [ ] `docs/PROJECT_MEMORY.md` updated (metrics, completed milestones, risks)
- [ ] `docs/checkpoints/PROJECT_CHECKPOINT.md` updated
- [ ] New ADRs added to `docs/architecture/ADR_INDEX.md`
- [ ] `docs/architecture/ARCHITECTURE_TIMELINE.md` updated (if milestone)
- [ ] Sprint report created in `docs/sprint-reports/`
- [ ] Release notes created in `docs/releases/` (if releasing)

### Step 7 — Regression Check

- [ ] Test count has not decreased
- [ ] No existing endpoints return different status codes than before
- [ ] No existing DTO fields have been removed without a version bump

---

## Scoring

| Area | Weight | Result |
|------|--------|--------|
| Sprint objectives complete | Critical | Pass/Fail |
| Acceptance criteria met | Critical | Pass/Fail |
| Quality gates pass | Critical | Pass/Fail |
| Architecture review passed | Critical | Pass/Fail |
| Documentation complete | High | Pass/Fail |
| No regression | High | Pass/Fail |
| Security review passed | High | Pass/Fail |

---

## Output Report

```
Acceptance Review — Sprint {N} — {Date}

SPRINT OBJECTIVES: [{N}/{M} complete]
  Incomplete: {list or "none"}

ACCEPTANCE CRITERIA: [{N}/{M} met]
  Unmet: {list or "none"}

QUALITY GATES:
  Lint: [PASS / FAIL]
  Build: [PASS / FAIL]
  Tests: [PASS / FAIL] ({N} suites, {M} tests)

ARCHITECTURE REVIEW: [PASS / FAIL / NOT RUN]
SECURITY REVIEW: [PASS / CONDITIONAL / NOT REQUIRED]
PERFORMANCE REVIEW: [PASS / CONDITIONAL / NOT REQUIRED]

DOCUMENTATION:
  PROJECT_MEMORY: [UPDATED / PENDING]
  CHECKPOINT: [UPDATED / PENDING]
  ADRs: [{N} new, all in ADR_INDEX]
  Sprint Report: [CREATED / PENDING]

REGRESSION CHECK: [PASS / FAIL]

OVERALL: [ACCEPTED / CONDITIONAL / REJECTED]
```

---

## Final Recommendation

- **ACCEPTED**: Proceed to release
- **CONDITIONAL ACCEPTED**: Minor issues documented; release may proceed with explicit acknowledgment
- **REJECTED**: Sprint not complete. Address findings and re-run Acceptance Review.
