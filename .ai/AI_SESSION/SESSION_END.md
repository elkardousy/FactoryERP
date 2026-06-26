# Session End Protocol

Execute this protocol at the end of every AI development session. Do not skip steps.

---

## Phase 1 — Quality Verification

```bash
npm run lint
npm run build
npm run test
```

**If any command fails:** Fix before ending the session. Do not leave the repository in a broken state.

Record results:
```
Lint:  PASS / FAIL
Build: PASS / FAIL
Tests: {count} passing, {count} failing
```

---

## Phase 2 — Git State

```bash
git status
git diff --stat
```

Confirm:
- [ ] All intended changes are committed
- [ ] No unintended files are staged or modified
- [ ] No `.env`, `dist/`, `node_modules/` accidentally staged

If work is complete → commit with appropriate Conventional Commits message.
If work is incomplete → commit as WIP with clear message:
```bash
git commit -m "wip({scope}): {what is done, what remains}"
```

---

## Phase 3 — Documentation Update

For every sprint or significant feature completed:

**Update `docs/PROJECT_MEMORY.md`:**
- [ ] Current Status section reflects actual state
- [ ] Latest Git Tag is current
- [ ] Repository metrics updated (module count, use case count, test count)
- [ ] Resolved TD-N items removed
- [ ] New risks or debt added if discovered

**Update `docs/checkpoints/PROJECT_CHECKPOINT.md`:**
- [ ] Sprint number and name reflect completed work
- [ ] "What was completed" is accurate and exhaustive
- [ ] "What is NOT done" is explicit (no silently dropped items)
- [ ] Next checkpoint target stated

---

## Phase 4 — ADR Documentation

If any architectural decisions were made during this session:
- [ ] ADR file created from `.ai/TEMPLATES/ADR_Template.md`
- [ ] ADR added to `docs/architecture/ADR_INDEX.md`

---

## Phase 5 — Session Summary

State the session summary in this format:

```
Session Summary:
- Completed: {list of completed items}
- Committed: {commit hash(es)}
- Test count: {before} → {after}
- Build: PASS
- Lint: PASS
- Remaining work: {list of items not completed, if any}
- Next session goal: {one sentence}
- Documents updated: {list}
```

---

## Phase 6 — Release Check

If this session completed a sprint milestone:
- [ ] Run `.ai/CHECKLISTS/Sprint_Checklist.md`
- [ ] Run `.ai/REVIEW_PROMPTS/Acceptance_Review.md`
- [ ] If accepted → run `.ai/RELEASE_PROMPTS/Release.md`

---

## Handoff Statement

End with an explicit handoff:

```
Repository state at end of session:
- Branch: main
- Last commit: {hash} — {message}
- Build: PASS
- Tests: {N} passing
- Ready for next session: YES / NO
- Blocking issue (if NO): {description}
```
