# Git Tag Prompt

**Purpose:** Create and verify an annotated Git tag for a release.

---

## Pre-Conditions

- [ ] Release commit exists (from `RELEASE_PROMPTS/Release.md`)
- [ ] Working tree is clean
- [ ] `npm run test` passes

---

## Step 1 — Verify Tag Does Not Exist

```bash
git tag | grep {VERSION}
```

If tag exists: verify it points to the correct commit before proceeding.
```bash
git rev-parse {VERSION}
git rev-parse HEAD
```

If they are the same, the tag already points to the current release — skip tag creation.

---

## Step 2 — Create Annotated Tag

```bash
git tag -a {VERSION} -m "$(cat <<'EOF'
{Milestone Name}

Completed milestones:
- {list each milestone}

Quality: lint 0 errors, build clean, {N} tests passing

Ready for: {next milestone}
EOF
)"
```

Example for v0.5.0:
```bash
git tag -a v0.5.0-inventory-engine -m "$(cat <<'EOF'
Inventory Engine Release

Completed milestones:
- Physical bag tracking (barcode-based)
- Inventory bag records with stock levels
- Atomic inventory transactions (receive/reserve/release/consume/return)
- Stock reservations linked to production orders

Quality: lint 0 errors, build clean, 187 tests passing

Ready for: v0.6.0-production-foundation
EOF
)"
```

---

## Step 3 — Verify Tag

```bash
git tag -v {VERSION}
```

Output should show:
- `object {commit hash}`
- `type commit`
- `tag {VERSION}`
- `tagger {your name}`
- Annotation message

---

## Step 4 — Push Tag (when remote is configured)

```bash
git push origin {VERSION}
```

---

## Step 5 — Verify Tag is Latest

```bash
git tag --sort=-creatordate | head -3
```

New tag should be first in the list.
