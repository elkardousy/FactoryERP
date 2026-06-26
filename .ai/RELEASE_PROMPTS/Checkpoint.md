# Checkpoint Update Prompt

**Purpose:** Update `docs/checkpoints/PROJECT_CHECKPOINT.md` at sprint completion or release.

---

## When to Execute

- At the end of every sprint
- At every release
- When a significant milestone is reached

---

## Checkpoint Content

A checkpoint captures:
- What sprint was completed
- What is done
- What is NOT done (explicit)
- Verification commands
- The next checkpoint target

---

## Step 1 — Gather Current State

```bash
# Current branch and commit
git branch --show-current
git log --oneline -1

# Test counts
npm run test 2>&1 | grep "Tests:"

# Lint and build
npm run lint 2>&1 | tail -2
npm run build 2>&1 | tail -2
```

---

## Step 2 — Identify What Was Completed This Sprint

From the sprint prompt, list every completed objective. Be precise:
- Module names implemented
- Use case counts
- Test counts added
- ADRs created

---

## Step 3 — Identify What Is NOT Done

From `docs/PROJECT_MEMORY.md` Technical Debt and Known Limitations sections. Be explicit — a checkpoint that hides incomplete work is worse than useless.

---

## Step 4 — Write Checkpoint File

File: `docs/checkpoints/PROJECT_CHECKPOINT.md`

Use `TEMPLATES/Checkpoint_Template.md` as the starting point.

Key fields to update:
- Sprint number and name
- Completion date
- Git tag (current)
- Build/lint/test status
- What is done (exhaustive list)
- What is NOT done (explicit list)
- Verification commands
- Next checkpoint target and expected tag

---

## Step 5 — Commit the Checkpoint

The checkpoint update is included in the release commit or as a standalone commit if no release:

```bash
git add docs/checkpoints/PROJECT_CHECKPOINT.md
git commit -m "docs(checkpoint): update to sprint {N} completion state"
```
