# GitHub Release Prompt

**Purpose:** Create a GitHub Release from a Git tag.

---

## Pre-Conditions

- [ ] Git tag exists locally and has been pushed to remote
- [ ] Release notes exist at `docs/releases/{VERSION}.md`
- [ ] `gh` CLI is available: `gh --version`
- [ ] Remote is configured: `git remote get-url origin`

---

## Step 1 — Verify Prerequisites

```bash
gh --version || echo "GitHub CLI not available"
git remote get-url origin || echo "No remote configured"
git tag | grep {VERSION} || echo "Tag not found"
```

If any check fails, follow the fallback procedure below.

---

## Step 2 — Push Branch and Tag (if not already pushed)

```bash
git push -u origin main
git push origin {VERSION}
```

---

## Step 3 — Create GitHub Release

```bash
gh release create {VERSION} \
  --title "FactoryERP {VERSION} – {Milestone Name}" \
  --notes-file docs/releases/{VERSION}.md \
  --latest
```

Example:
```bash
gh release create v0.5.0-inventory-engine \
  --title "FactoryERP v0.5.0 – Inventory Engine" \
  --notes-file docs/releases/v0.5.0-inventory-engine.md \
  --latest
```

---

## Step 4 — Verify Release

```bash
gh release view {VERSION}
```

Expected output:
- Title matches
- Tag matches
- Notes are from release notes file
- Status: latest

---

## Fallback — No GitHub CLI or No Remote

If GitHub CLI is unavailable or no remote is configured, prepare the following commands for manual execution:

```bash
# 1. Add the remote (replace with actual URL)
git remote add origin https://github.com/{owner}/FactoryERP.git

# 2. Push all
git push -u origin main
git push origin {VERSION}

# 3. Create GitHub Release via CLI
gh release create {VERSION} \
  --title "FactoryERP {VERSION} – {Milestone Name}" \
  --notes-file docs/releases/{VERSION}.md \
  --latest

# OR create via GitHub web UI:
# Repository → Releases → Create a new release
# Tag: {VERSION}
# Title: FactoryERP {VERSION} – {Milestone Name}
# Description: paste contents of docs/releases/{VERSION}.md
# Mark as Latest Release
```

Document the fallback in the sprint report.

---

## Step 5 — Record Release URL

After creation, record the GitHub Release URL in `docs/PROJECT_MEMORY.md` under the completed milestone entry.
