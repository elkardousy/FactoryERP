# 10 — Git Governance

**Document:** FEOS-10  
**Category:** Version Control  
**Authority:** MANDATORY  
**Status:** ACTIVE  
**Version:** 1.0  
**Owner:** Chief Software Architect  
**Review Cycle:** Per phase completion  
**Related FEOS:** FEOS-02 (Project Governance), FEOS-04 (Implementation Governance), FEOS-16 (Release Playbook)  
**Related KEB:** KEB-12 (Git Baseline)

---

## Purpose

This document governs branching strategy, commit message conventions, tagging policy, release branches, hotfix procedures, and repository hygiene for FactoryERP.

## Scope

All git operations on the FactoryERP repository.

## Audience

All engineers and AI agents that commit, tag, push, or otherwise operate on the repository.

---

## Branch Strategy

FactoryERP uses a single-branch strategy. There is one long-lived branch:

| Branch | Purpose |
|--------|---------|
| `main` | Single long-lived branch. All work targets `main` directly. |

There are no `develop`, `staging`, or `feature/*` long-lived branches. Short-lived feature branches are permitted but not required given the current single-contributor model. When feature branches are used, they merge to `main` and are deleted after merge.

### Force Push Policy

Force pushing to `main` is prohibited. This protection is a core repository hygiene rule. If main branch history needs to be corrected:

1. Escalate to Chief Software Architect.
2. Document the rationale.
3. Get explicit approval before any destructive git operation.

### Branch Naming (When Used)

If feature branches are used:

- `feat/<description>` — new features
- `fix/<description>` — bug fixes
- `chore/<description>` — non-code changes (docs, config)
- `refactor/<description>` — code reorganization without behavior change

---

## Commit Conventions

All commits follow the Conventional Commits specification (https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

| Type | Usage |
|------|-------|
| `feat` | New feature or use case |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore` | Maintenance: dependency updates, build changes, config |
| `docs` | Documentation only |
| `test` | Test additions or fixes |
| `release` | Version release (used with tags) |
| `perf` | Performance improvement |

### Scope

The scope identifies the module or subsystem changed:

- `inventory` — Inventory module
- `auth` — Auth module
- `authorization` — Authorization module
- `schema` — Prisma schema or migrations
- `prisma` — Prisma configuration
- `core` — Core infrastructure
- `config` — Configuration
- `docs` — Documentation

### Subject Rules

1. Use imperative mood: "add", "fix", "remove" — not "added", "fixes", "removed".
2. Lowercase first letter.
3. No period at the end.
4. Maximum 72 characters.

### Commit Examples (from KEB-12 Git Baseline)

```
feat(inventory): Sprint 11.3 — Physical Bag Reservation Engine
feat(inventory): Sprint 11.2 — Inventory Transaction Engine
feat(inventory): Sprint 11.1 — Inventory Module Foundation
chore(prisma): document migration workflow and prohibit prisma db pull
feat(schema): resolve Phase 3 Sprint 0 gate conditions G-4, G-5, G-6, G-7
```

### What Goes in Commits

- Feature commits: all files for the sprint (use cases, services, repos, controllers, tests, DTOs).
- Documentation commits: ADRs, KEB documents, architecture docs.
- Chore commits: config changes, dependency updates.

### What Does NOT Go in Commits

- Secrets or environment variables.
- Generated files that are in `.gitignore` (e.g., `node_modules/`, `dist/`, `.env`).
- Broken builds — the build must pass before committing.
- Failing tests — all tests must pass before committing.

---

## Tagging Policy

Git tags mark significant milestones.

### Tag Format

```
v<major>.<minor>.<patch>-<label>
```

### Existing Tags (KEB-12)

| Tag | Commit | Milestone |
|-----|--------|-----------|
| `foundation-v1` | Phase 1 | NestJS foundation |
| `v0.1.0-auth-foundation` | Phase 2 | Auth + JWT |
| `v0.3.0-business-foundation` | Phase 2 complete | 7 master data modules |
| `v0.4.0-ai-engineering-platform` | Phase 3 | AI EOS + schema hardening |
| `v0.4.0-sprint11-ready` | `bdc901c` | Sprint 11 prerequisite gates passed |

### Tagging Rules

1. Tags are created at sprint completion (after all gates pass, after sprint report is committed).
2. Tags are annotated (`git tag -a <name> -m "<message>"`).
3. Tags are not deleted or moved after creation.
4. The tag message summarizes what the tag represents.
5. Sprint tags use the pattern `v<version>-sprint<N>-<descriptor>`.

### Annotated Tag Creation

```bash
git tag -a v0.5.0-sprint12-container-engine -m "Sprint 12: Container Receiving Engine"
```

---

## Release Procedure

A release is a significant version bump following multiple sprints. Releases:

1. Get a semantic version bump (`v0.5.0`, `v1.0.0`, etc.).
2. Have a corresponding release notes document in `docs/releases/`.
3. Tag the release commit.
4. Have all quality gates passing at the release commit.

See FEOS-16 for the full release playbook.

---

## Amending and Rewriting

### Amending Commits

Amending is permitted **only** on unpublished commits (commits that have not been pushed to the remote). If a commit has been pushed, create a new commit to correct it.

### Rebasing

Interactive rebase (`git rebase -i`) is permitted on local, unpublished branches. Rebasing pushed commits on `main` is prohibited.

### Squashing

Squashing multiple commits before merging a feature branch is permitted and preferred when the commit history contains work-in-progress commits. The final merged commit to `main` must follow commit message conventions.

---

## Repository Hygiene

### What Is in `.gitignore`

- `node_modules/`
- `dist/`
- `.env`
- `*.log`
- `coverage/`

None of these must be committed under any circumstance.

### Generated Files

Prisma generates `@prisma/client` into `node_modules`. The generated client is not committed. After a schema change or fresh clone, run:

```bash
DATABASE_URL="postgresql://elkardousy:250686@localhost:5432/factory_erp" npx prisma generate
```

### Clean Working Tree Rule

Sprints must end with a clean working tree — all changes committed. No uncommitted or stale changes should exist at sprint close.

---

## AI Agent Git Rules

AI agents (Claude Code) operating on this repository must follow additional git rules:

1. **Never commit without explicit instruction.** AI agents do not self-initiate commits.
2. **Never push without explicit instruction.** AI agents do not push to the remote.
3. **Never force push.** Under any circumstances.
4. **Never amend a published commit.**
5. **Never run `git reset --hard` without explicit architect instruction.**
6. **Never run `git checkout .` or `git restore .` without explicit architect instruction.**
7. **When staging files, prefer explicit file names** over `git add .` or `git add -A`.
8. **Commits authored by AI must include** `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` in the commit message.

---

## Compliance Rules

### Rule G-001 — Commit Message Format

**Classification:** MANDATORY  
**Statement:** All commits to `main` must follow the Conventional Commits format with a valid type, scope, and imperative subject.  
**Violation Impact:** Non-compliant commit history, difficult changelog generation.  
**Risk:** Lost change traceability.  
**Recovery:** Amend the message if not yet pushed. Note the violation if already in history.  
**Approval Required:** None — convention must be followed.

### Rule G-002 — No Force Push to Main

**Classification:** MANDATORY  
**Statement:** `git push --force` targeting `main` is prohibited. History on `main` is immutable once pushed.  
**Violation Impact:** Shared history corrupted, collaborators' local repos diverge.  
**Risk:** Lost commits, broken team state.  
**Recovery:** Restore from last known-good state. Escalate to architect.  
**Approval Required:** Chief Software Architect approval required for any destructive git operation on main.

### Rule G-003 — Clean Build Before Commit

**Classification:** MANDATORY  
**Statement:** `npm run build` must exit 0 before any feature commit is created. Commits with build failures are not accepted to main.  
**Violation Impact:** Broken main branch.  
**Risk:** All contributors blocked until fixed.  
**Recovery:** Fix the build. Create a new commit with the fix.  
**Approval Required:** None — build must pass.

### Rule G-004 — Tag at Sprint Completion

**Classification:** MANDATORY  
**Statement:** An annotated git tag must be created at sprint completion, after all gates pass and the sprint report is committed.  
**Violation Impact:** Milestone not marked, rollback point lost.  
**Risk:** Unable to identify stable checkpoints in history.  
**Recovery:** Create the missing tag at the correct commit.  
**Approval Required:** None.

### Rule G-005 — Secrets Not Committed

**Classification:** MANDATORY  
**Statement:** No `.env` file, password, token, or secret may appear in any committed file.  
**Violation Impact:** Credential exposure.  
**Risk:** Database and system compromise.  
**Recovery:** Remove from history using `git filter-repo`. Rotate exposed credentials.  
**Approval Required:** Chief Software Architect for history rewriting.
