# 16 — Release Playbook

**Document:** FEOS-16  
**Category:** Release  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per release  
**Related FEOS:** FEOS-10 (Git Governance), FEOS-14 (Operational Playbook), FEOS-18 (Checklists)  
**Related KEB:** KEB-08 (Implementation Status), KEB-12 (Git Baseline)

---

## Purpose

This document defines the release preparation, acceptance, tagging, and post-release validation procedures for FactoryERP. A release is a versioned milestone that marks a set of sprints as production-ready.

## Scope

All version releases and sprint tags for FactoryERP.

## Audience

Engineers and AI agents managing or executing release processes.

---

## Release Types

| Type | Trigger | Version Bump | Example |
|------|---------|-------------|---------|
| Sprint tag | Single sprint completion | Patch or pre-release label | `v0.5.0-sprint12-container-engine` |
| Phase release | Multiple sprints completing a phase | Minor version | `v0.5.0` |
| Major release | ERP feature complete for a domain | Major version | `v1.0.0` |

At FEOS 1.0 baseline, the project is at version `0.0.1` (package.json) with the `v0.4.0-sprint11-ready` tag as the most recent sprint readiness marker.

---

## Version Policy

FactoryERP follows semantic versioning (semver):

```
v<MAJOR>.<MINOR>.<PATCH>[-<pre-release-label>]
```

| Segment | Increments When |
|---------|----------------|
| MAJOR | Breaking API changes or major architecture shift |
| MINOR | New module or feature set added |
| PATCH | Bug fixes only |
| Label | Sprint tag, pre-release marker |

**Current version trajectory:**
- `v0.4.x` — Phase 3 / Sprint 11 series
- `v0.5.x` — Sprint 12 (Container Receiving Engine)
- `v0.6.x` — Sprint 13 (Production Orders)
- `v1.0.0` — Feature complete for first production candidate

---

## Release Preparation Checklist

Before tagging any release:

### Code Quality
- [ ] `npm run build` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` exits 0.
- [ ] No known open defects blocking the release.

### Documentation
- [ ] Sprint report committed to `docs/sprint-reports/`.
- [ ] All new ADRs committed.
- [ ] KEB updated to reflect delivered features.
- [ ] Swagger documentation complete for all new endpoints.

### Database
- [ ] All migrations committed to `prisma/migrations/`.
- [ ] `prisma migrate status` shows no pending migrations.
- [ ] `prisma/schema.prisma` matches the live database state.

### Git
- [ ] Main branch is clean (no uncommitted changes).
- [ ] All sprint commits are on `main`.
- [ ] Release notes document written (for minor/major releases).

---

## Sprint Tagging Procedure

After all checklist items are verified:

```bash
# Create annotated tag
git tag -a v<version>-<sprint>-<descriptor> -m "<Sprint Name>: <brief description of what was delivered>"

# Example:
git tag -a v0.5.0-sprint12-container-engine -m "Sprint 12: Container Receiving Engine — container receipt, bag entry, inventory initialization"
```

Annotated tags (with `-a` flag) store metadata including the tagger, date, and message. They are required — lightweight tags are not acceptable for sprint markers.

---

## Minor/Major Release Procedure

For phase releases and major releases:

1. **Verify all sprints in the release are Complete** (FEOS-01, Article IV).
2. **Update `package.json` version:**
   ```json
   { "version": "0.5.0" }
   ```
3. **Write release notes** in `docs/releases/v<version>-release-notes.md`:
   - What was delivered.
   - What changed.
   - Known limitations.
   - Upgrade instructions (if applicable).
4. **Commit the version bump and release notes:**
   ```bash
   git commit -m "release: v<version>"
   ```
5. **Create annotated release tag:**
   ```bash
   git tag -a v<version> -m "Release v<version>"
   ```

---

## Post-Release Validation

After a release tag is created:

1. Verify the tag is correct: `git tag -v v<version>`.
2. Verify build at the tagged commit: `git checkout v<version> && npm run build`.
3. Verify tests at the tagged commit: `npm run test`.
4. Return to main: `git checkout main`.
5. Document any issues found in post-release validation.

---

## Rollback Procedure

If a release is found to be defective after tagging:

1. **Do not delete the tag.** The tag is a historical record.
2. Create a hotfix commit on `main` that fixes the defect.
3. Create a new patch release: `v<major>.<minor>.<patch+1>`.
4. Tag the hotfix: `git tag -a v<version>-hotfix -m "Hotfix: <description>"`.

Never squash, amend, or rewrite `main` history to hide a defective release.

---

## Release History (at FEOS 1.0)

| Tag | Commit | Date | Milestone |
|-----|--------|------|-----------|
| `foundation-v1` | Phase 1 | 2026 | NestJS platform |
| `v0.1.0-auth-foundation` | Phase 2 | 2026 | JWT auth |
| `v0.3.0-business-foundation` | Phase 2 complete | 2026 | Master data modules |
| `v0.4.0-ai-engineering-platform` | Phase 3 | 2026 | AI EOS + schema hardening |
| `v0.4.0-sprint11-ready` | `bdc901c` | 2026 | Sprint 11 gate conditions met |

The next planned tag: `v0.5.0-sprint12-container-engine` (after Sprint 12 completion).
