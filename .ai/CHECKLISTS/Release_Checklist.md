# Release Checklist

Execute in order. Do not skip steps. Do not release if any Critical item is unchecked.

---

## Critical Pre-Release Gates

- [ ] `npm run lint` exits 0 — no errors, no warnings
- [ ] `npm run build` exits 0 — no TypeScript errors
- [ ] `npm run test` — 0 failures, count ≥ previous release
- [ ] Acceptance Review: ACCEPTED
- [ ] Architecture Review: PASS
- [ ] Working tree: `git status` shows only intentional uncommitted files
- [ ] No known Critical-severity risks in `docs/PROJECT_MEMORY.md`

## Documentation

- [ ] Release notes exist at `docs/releases/v{VERSION}.md`
- [ ] `docs/PROJECT_MEMORY.md` has been updated with this release's metrics
- [ ] `docs/checkpoints/PROJECT_CHECKPOINT.md` reflects the release state
- [ ] Sprint report exists in `docs/sprint-reports/`
- [ ] All new ADRs are in `docs/architecture/ADR_INDEX.md`

## Version Consistency

```bash
grep -r "v{VERSION}" docs/ README_ARCHITECTURE.md --include="*.md" | wc -l
# Must return > 0
grep "Recommended Next Tag.*v{NEXT_VERSION}" docs/PROJECT_MEMORY.md
# Must find the next version reference
```

- [ ] All version references in docs point to the new version
- [ ] "Recommended Next Tag" points to the next milestone version

## Git

- [ ] Release commit created
- [ ] Annotated tag created: `git tag -v v{VERSION}`
- [ ] Tag annotation contains release summary

## GitHub

- [ ] Tag pushed to remote: `git push origin v{VERSION}`
- [ ] Branch pushed to remote: `git push origin main`
- [ ] GitHub Release created with release notes
- [ ] GitHub Release marked as Latest

## Post-Release

- [ ] `RELEASE_PROMPTS/Governance_Update.md` executed
- [ ] `docs/PROJECT_MEMORY.md` "Latest Git Tag" field updated to new version
- [ ] `README_ARCHITECTURE.md` "Latest Stable Tag" updated
- [ ] Final verification: `git status` clean, all tests passing
