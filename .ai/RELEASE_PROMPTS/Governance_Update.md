# Governance Update Prompt

**Purpose:** Update all governance documents after a release to prepare the repository for the next sprint.

---

## Execute After Every Release

### Step 1 — Update PROJECT_MEMORY.md

Required updates:
1. **Latest Git Tag** field → new version
2. **Recommended Next Tag** field → next milestone version
3. **Current Phase** → update if phase changes
4. **Completed Milestones** → add the new milestone
5. **Repository Metrics** → update all counts (modules, use cases, tests, ADRs)
6. **Technical Debt** → remove resolved items; keep open items
7. **Known Risks** → update or remove resolved risks
8. **Immediate Next Sprint** → replace with the upcoming sprint description
9. **"Current Git tag" in Final Recommendation** → update to new tag

### Step 2 — Update PROJECT_CHECKPOINT.md

Replace with a fresh checkpoint reflecting the completed release state. Use `RELEASE_PROMPTS/Checkpoint.md` procedure.

### Step 3 — Update README_ARCHITECTURE.md

Required updates:
1. **Latest Stable Tag** → new version
2. **Recommended Next Tag** → next milestone
3. **Business Foundation Status** / relevant status field → mark completed phase
4. **Current Milestone** → update to reflect new current state
5. **Immediate Next Sprint** in roadmap → update

### Step 4 — Update Architecture Timeline

Add new milestone to `docs/architecture/ARCHITECTURE_TIMELINE.md`:

```markdown
## Sprint {N} — {Module Name}

**Date:** {date}
**Version:** {VERSION}

{One paragraph summary of what was delivered}
```

### Step 5 — Update AI-EOS Memory

Update `.ai/MASTER_PROMPT.md`:
1. **Current release** field → new version
2. **Current phase** field → new phase

### Step 6 — Verify Consistency

```bash
# Check all version references are consistent
grep -r "v0\." docs/ README_ARCHITECTURE.md .ai/MASTER_PROMPT.md --include="*.md" \
  | grep -v "v0.3.0-business-foundation"  # the released version should appear as history
```

All "latest" or "current" version references must point to the new release.

### Step 7 — Commit Governance Updates

```bash
git add docs/PROJECT_MEMORY.md \
        docs/checkpoints/PROJECT_CHECKPOINT.md \
        README_ARCHITECTURE.md \
        docs/architecture/ARCHITECTURE_TIMELINE.md \
        .ai/MASTER_PROMPT.md

git commit -m "docs(governance): update documentation for {VERSION} release"
```
