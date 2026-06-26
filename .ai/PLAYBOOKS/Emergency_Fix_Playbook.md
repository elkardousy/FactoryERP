# Emergency Fix Playbook

Procedure for production-blocking bugs, security incidents, or data integrity issues.

**When to use:** Data corruption, authentication bypass, production service down, critical security vulnerability.

For non-critical bugs → use `.ai/PLAYBOOKS/Bugfix_Playbook.md`.

---

## Severity Declaration

Before starting, declare the incident:

```
Incident Type: [Data Corruption | Security Breach | Service Down | Data Loss]
Affected Component: {module/service/endpoint}
Impact: {what users/operations cannot function}
Discovery Time: {timestamp}
```

---

## Phase 1 — Contain (< 15 minutes)

**Do this FIRST, before any code changes.**

| Incident Type | Containment Action |
|---------------|-------------------|
| Security bypass | Disable the vulnerable endpoint (return 503 or remove route) |
| Data corruption | Identify the corrupted records; do NOT run further writes |
| Service down | Identify the crash source; do not restart in a loop |
| Data loss | Stop the process causing deletion; identify scope |

For a security incident: also rotate any exposed secrets immediately.

---

## Phase 2 — Diagnose (< 30 minutes)

```bash
# Reproduce the issue in isolation:
npm run test -- --testPathPattern={affected-module}

# Find relevant code:
grep -r "{symptom_keyword}" src/ --include="*.ts" -l
```

State the root cause explicitly before writing a single line of fix code.

---

## Phase 3 — Fix

Apply the minimum change that resolves the root cause.

**Emergency fix rules:**
- Do NOT refactor surrounding code
- Do NOT fix unrelated issues in the same commit
- Do NOT add features
- If the fix requires a schema change: it must be a targeted column/index change only — no structural table changes during an incident

Build must pass before moving on:
```bash
npm run build
```

---

## Phase 4 — Test

```bash
npm run test
```

- Write a regression test for the specific bug if time allows (do not skip the rest of the playbook waiting for tests)
- All existing tests must pass

---

## Phase 5 — Deploy (Emergency Path)

```bash
npm run lint
npm run build
npm run test
```

All three must exit 0.

```bash
git add {specific files only — not git add -A during incidents}
git commit -m "fix({scope}): EMERGENCY — {short description}

Incident: {incident type}
Root cause: {root cause}
Fix: {what was changed}"

git push origin main
git tag -a hotfix-{date}-{slug} -m "Emergency fix: {description}"
git push origin hotfix-{date}-{slug}
```

---

## Phase 6 — Post-Incident (within 24 hours)

- [ ] Write regression test if not done in Phase 4
- [ ] Update `docs/PROJECT_MEMORY.md` Risks section (remove or reduce severity of fixed risk)
- [ ] Create ADR if the incident exposed an architectural gap (e.g., missing input validation, missing session revocation)
- [ ] Run full review suite: Architecture Review + Security Review
- [ ] Document timeline and root cause in `docs/incidents/` (create directory if needed)

---

## Escalation

If the fix requires changes beyond what one developer can assess safely:
- Revert to last known good state: `git revert HEAD` or restore from backup
- Do not deploy a partial fix to production
- A bad rollback is better than a bad fix
