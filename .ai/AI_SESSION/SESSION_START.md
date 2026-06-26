# Session Start Protocol

Execute this protocol at the beginning of every AI development session. Do not skip steps.

---

## Mandatory Startup Sequence

Execute in order. Each step informs the next.

### Step 1 — Read Project Entry Point
```
Read: README_ARCHITECTURE.md (repository root)
```
Confirm: current milestone, latest stable tag, current phase.

### Step 2 — Read Operational Memory
```
Read: docs/PROJECT_MEMORY.md
```
Confirm:
- Current Status (Platform / Auth / Modules / Database / Tests / Build / Lint)
- Latest Git Tag
- Known Risks (Critical and High items)
- Technical Debt (active TD-N items)
- Immediate Next Sprint

### Step 3 — Read Current Checkpoint
```
Read: docs/checkpoints/PROJECT_CHECKPOINT.md
```
Confirm:
- What was completed in the last sprint
- What is explicitly NOT done
- Next checkpoint target

### Step 4 — Read ADR Index
```
Read: docs/architecture/ADR_INDEX.md
```
Confirm: no new ADRs added since last session that affect current work.

### Step 5 — Read AI-EOS Entry Point
```
Read: .ai/README.md
```
Confirm: which sprint prompt or playbook governs this session's work.

### Step 6 — Read Governing Prompts
```
Read: .ai/MASTER_PROMPT.md
Read: .ai/GOVERNANCE_PROMPT.md
```
These override everything. Re-read even if familiar.

---

## Session Context Statement

After completing startup, state explicitly:

```
Session Context:
- Current milestone: {milestone}
- Latest tag: {tag}
- Sprint: {N} — {name}
- Playbook: {playbook}
- Active technical debt: {TD-N items}
- Active risks: {Critical/High items}
- Session goal: {one sentence describing what will be accomplished}
```

---

## Git State Check

```bash
git status
git log --oneline -5
```

Confirm:
- Branch is `main`
- No unexpected uncommitted changes
- Last commit is the release commit or a sprint commit (not a dangling WIP commit)

---

## Ready Criteria

The session is ready to begin implementation when:
- [ ] All 6 startup documents have been read
- [ ] Session Context Statement has been stated
- [ ] Git state is clean or understood
- [ ] The governing sprint prompt has been identified

Do NOT write any code before completing this protocol.
