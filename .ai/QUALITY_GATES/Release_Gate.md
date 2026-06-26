# Release Gate

The Release Gate is the final gate before creating a release commit and tag. All other gates must be evaluated first.

**Gate result: PASS or FAIL — no CONDITIONAL.**

All CONDITIONAL results from other gates must have been resolved or formally accepted before this gate is run.

---

## Pre-Conditions

Before running this gate, confirm all other gates have been run and their results recorded:

| Gate | Result | Notes |
|------|--------|-------|
| Build Gate | ☐ PASS / ☐ FAIL | |
| Testing Gate | ☐ PASS / ☐ CONDITIONAL / ☐ FAIL | |
| Architecture Gate | ☐ PASS / ☐ CONDITIONAL / ☐ FAIL | |
| Security Gate | ☐ PASS / ☐ CONDITIONAL / ☐ FAIL | |
| Performance Gate | ☐ PASS / ☐ CONDITIONAL / ☐ FAIL | |
| Documentation Gate | ☐ PASS / ☐ CONDITIONAL / ☐ FAIL | |

**Any FAIL in the table above = Release Gate FAIL. Do not proceed.**

---

## Release Gate Checks

### Check 1 — Final Build and Test

```bash
npm run lint && npm run build && npm run test
```

All three must exit 0 in a single run, right before the release commit.

### Check 2 — Clean Working Tree

```bash
git status
```

Expected output: "nothing to commit, working tree clean"
OR: only known intentional untracked files (e.g., `.env`, `dist/`)

### Check 3 — Version Consistency

```bash
# Confirm the release version appears in documentation:
VERSION="v{X.Y.Z}-{milestone-slug}"
grep -r "${VERSION}" docs/ README_ARCHITECTURE.md --include="*.md" | wc -l
# Must return > 0
```

### Check 4 — Release Notes Exist

```bash
ls docs/releases/v{VERSION}.md
# Must exist
```

### Check 5 — Acceptance Review Passed

The most recent sprint's Acceptance Review must have reached ACCEPTED status.

```bash
# Verify the acceptance template for this sprint exists:
ls docs/sprint-reports/
```

### Check 6 — No Critical Risks Active

```bash
grep -A 5 "Critical" docs/PROJECT_MEMORY.md | grep -i "risk\|severity"
# Review: if any Critical risk is present and unmitigated → FAIL
```

---

## PASS Result

All 6 checks pass:
- [ ] Lint + Build + Test: 0 errors, 0 failures
- [ ] Working tree clean
- [ ] Version consistent in docs
- [ ] Release notes exist
- [ ] Acceptance Review: ACCEPTED
- [ ] No unmitigated Critical risks

→ Proceed to `.ai/RELEASE_PROMPTS/Release.md` Phase 5 (git commit).

## FAIL Result

Any check fails:
- Do NOT create the release commit
- Fix the failing check
- Re-run this gate from the beginning
