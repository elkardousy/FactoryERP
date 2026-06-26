# Context Recovery

Use this protocol when a session begins without prior context — after a context window reset, a new conversation, or when the current state of the repository is unknown.

---

## Symptom: Unknown State

Signs that context recovery is needed:
- The conversation history does not include the session startup sequence
- The last action in the conversation is unclear
- Git history shows commits that are not reflected in `docs/PROJECT_MEMORY.md`
- The build or tests are failing with no known cause

---

## Recovery Sequence

### Step 1 — Establish Ground Truth from Repository

Do NOT rely on conversation memory. Read the repository directly.

```bash
# What is the current branch and tag?
git log --oneline -10
git tag --sort=-creatordate | head -5
git status

# What changed recently?
git diff HEAD~3 --stat
```

### Step 2 — Read All Authoritative Documents

In this order (each supersedes the previous for conflicts):
1. `docs/PROJECT_MEMORY.md` — current status, risks, debt
2. `docs/checkpoints/PROJECT_CHECKPOINT.md` — last sprint state
3. `docs/architecture/ADR_INDEX.md` — latest architecture decisions
4. `.ai/MASTER_PROMPT.md` — invariants
5. `.ai/GOVERNANCE_PROMPT.md` — rules

### Step 3 — Verify Build State

```bash
npm run lint
npm run build
npm run test
```

Record actual results. Do not assume they pass.

### Step 4 — Reconcile

Compare:
- What `docs/PROJECT_MEMORY.md` says the state is
- What `git log` shows was actually committed
- What `npm run test` actually reports

If they conflict: trust `git log` and test output over documents. Update documents to reflect reality.

### Step 5 — State Recovery Summary

```
Recovery Summary:
- Last committed tag: {tag}
- Last commit: {hash} — {message}
- Build: PASS / FAIL
- Tests: {N} passing / {N} failing
- Discrepancies found: {list or NONE}
- Documents corrected: {list or NONE}
- Actual current phase: {description}
- Next action: {one sentence}
```

---

## Recovery from Partial Implementation

If the repository contains partially implemented code (e.g., a use case exists but its module registration is missing):

1. Run `npm run build` to identify TypeScript errors — they will point to the incomplete wiring
2. Run `npm run test` to identify failing tests
3. Read the relevant sprint prompt to understand what was in progress
4. Complete the minimal wiring to make build and tests pass
5. Do not add new features until the partial work is stable

---

## Document Precedence (in case of conflict)

```
.ai/MASTER_PROMPT.md
    > ADRs (newest supersedes oldest)
        > docs/PROJECT_MEMORY.md
            > docs/checkpoints/PROJECT_CHECKPOINT.md
                > CLAUDE.md
                    > conversation history
```

When two documents conflict, trust the higher-precedence document. Update the lower-precedence document to match.
