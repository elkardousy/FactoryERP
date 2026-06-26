# Release Prompt

**Purpose:** Execute a complete release — documentation freeze, version normalization, commit, tag, and GitHub publication.

---

## Pre-Release Checklist

Before executing any release step, confirm ALL of the following:

- [ ] Acceptance Review: ACCEPTED
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `npm run test`: 0 failures
- [ ] All quality gates in `.ai/QUALITY_GATES/` pass
- [ ] Sprint report exists in `docs/sprint-reports/`
- [ ] Release notes drafted (see `TEMPLATES/Release_Template.md`)

If any item is unchecked, **STOP**. Do not proceed with the release.

---

## Step 1 — Determine Release Version

Read `docs/PROJECT_MEMORY.md` to identify the recommended next tag.

Format: `v{major}.{minor}.0-{milestone-slug}`

Current milestone version sequence:
```
v0.3.0-business-foundation  ← RELEASED
v0.4.0-cmo-foundation
v0.5.0-inventory-engine
v0.6.0-production-foundation
v0.7.0-quality
v0.8.0-purchasing
v0.9.0-shipping
v0.10.0-workflow-engine
v0.11.0-reporting
v0.12.0-dashboard
v1.0.0
```

---

## Step 2 — Verify No Existing Tag

```bash
git tag | grep {VERSION}
```

If the tag already exists, **STOP**. Verify whether the release was already performed.

---

## Step 3 — Normalize Version References

Search all documentation files for outdated version references:
```bash
grep -r "v0\." docs/ README_ARCHITECTURE.md .ai/ --include="*.md"
```

Update:
- `docs/PROJECT_MEMORY.md` — Latest Git Tag field
- `docs/checkpoints/PROJECT_CHECKPOINT.md` — Git tag field
- `README_ARCHITECTURE.md` — Latest Stable Tag field
- New "Recommended Next Tag" in all three documents

---

## Step 4 — Create Release Notes

File: `docs/releases/{VERSION}.md`

Use `TEMPLATES/Release_Template.md` as the starting template.

Required sections: Version, Date, Architecture Maturity, ERP Maturity, Completed Milestones, Metrics, Build/Lint/Test Status, Known Limitations, Technical Debt, Next Milestone.

---

## Step 5 — Commit

```bash
git add -A
git status   # verify no sensitive files (.env) are staged
git commit -m "$(cat <<'EOF'
release({VERSION}): {Milestone Name}

{2-3 line summary of what this release delivers}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Step 6 — Tag

Execute `RELEASE_PROMPTS/Git_Tag.md`.

---

## Step 7 — GitHub Release

Execute `RELEASE_PROMPTS/GitHub_Release.md`.

---

## Step 8 — Post-Release

Execute `RELEASE_PROMPTS/Governance_Update.md`.

---

## Step 9 — Verify Final State

```bash
git status           # Must show: "nothing to commit, working tree clean"
git log --oneline -3 # Release commit must be HEAD
git tag --sort=-creatordate | head -3  # New tag must be latest
npm run lint && npm run build && npm run test  # All must pass
```
