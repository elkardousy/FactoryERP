# 09 — Production Feature Report Template

| Field | Value |
|---|---|
| **Purpose** | Standard report format for completing each Production Module feature |
| **Scope** | Per-feature completion report |
| **Audience** | Implementing agents, project lead, QA |
| **Status** | TEMPLATE — copy and fill in per feature |
| **Owner** | Implementing agent |
| **Review Cycle** | Per-feature |
| **Version** | 1.0 |

**Usage:** Copy the section below for each feature report. File in `docs/execution/production/reports/P<NN>_REPORT.md`.

---

## TEMPLATE START

```markdown
# Production Feature Report — P<NN>: <Feature Name>

**Feature ID:** P<NN>  
**Status:** DONE  
**Date:** YYYY-MM-DD  
**Commit:** <git hash>  

---

## 1. What Was Built

<Short description of the feature — what it does, why it matters>

### Files Created
- `src/modules/production/...`

### Files Modified
- `src/modules/production/...`

---

## 2. Use Cases Implemented

| Use Case | File | Tests |
|---|---|---|
| <Name> | `path/to/use-case.ts` | `path/to/use-case.spec.ts` |

---

## 3. API Endpoints Added

| Method | Path | Controller Method |
|---|---|---|
| POST | /v1/production/... | `create()` |

---

## 4. Business Rules Applied

List each BR-* rule from `03_PRODUCTION_BUSINESS_RULES.md` that this feature enforces, and how:

| Rule | Enforcement |
|---|---|
| BR-X01 | Validated in use case before write |

---

## 5. Events Emitted

| Event Name | Trigger |
|---|---|
| `production.*.xxx` | Use case completes |

---

## 6. Quality Gate Results

| Gate | Result | Notes |
|---|---|---|
| C-001 Build (`npm run build`) | PASS | |
| C-002 Lint (`npm run lint`) | PASS | 0 errors |
| C-003 Tests (`npm run test`) | PASS | <N> tests, <M> suites |
| Prisma validate | PASS | |

---

## 7. Acceptance Criteria Verification

Reference `07_PRODUCTION_ACCEPTANCE_CRITERIA.md` §P<NN>:

| Criteria | Status | Notes |
|---|---|---|
| AC-P<NN>-01 | PASS | |
| AC-P<NN>-02 | PASS | |

---

## 8. Known Limitations / Deferred Items

List any items that were intentionally deferred, along with the reason:

| Item | Reason | Target Feature |
|---|---|---|
| <description> | <reason> | P<NN> or N/A |

---

## 9. Unknown Items Resolved

List any U-* items from `08_PRODUCTION_PROGRESS_TEMPLATE.md` that were resolved during this feature:

| Item | Resolution |
|---|---|
| U-001 | <how it was resolved> |

---

## 10. Blockers Encountered

| Blocker | How Resolved |
|---|---|
| <description> | <resolution> |
```

## TEMPLATE END

---

## Guidelines for Writing Feature Reports

**Section 1:** Be specific. "Added `CreateProductionOrderUseCase` with DocumentNumberingService integration" is better than "Created production order functionality."

**Section 4:** Every business rule in the feature's AC must appear here. If a rule was deferred, note it.

**Section 6:** Copy the actual gate output (test count, error count). Do not write PASS without running the gates.

**Section 7:** Every AC must be verified — not assumed. Mark PASS only after manual verification or test coverage confirms it.

**Section 8:** Deferred items must reference a target feature or be marked N/A with justification. Do not defer items silently.

**Section 9:** Update `08_PRODUCTION_PROGRESS_TEMPLATE.md` to remove resolved U-* items after writing the report.
