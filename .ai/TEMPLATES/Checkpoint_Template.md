# PROJECT_CHECKPOINT.md

> Sprint-level checkpoint snapshot. Read `docs/PROJECT_MEMORY.md` for the full operational context.

---

## Checkpoint: Sprint {N} — {Sprint Name}

**Date:** {YYYY-MM-DD}
**Git branch:** main
**Git tag:** v{X.Y.Z}-{slug}
**Status:** ACCEPTED

---

## What Was Completed in This Checkpoint

### Code

- {Module}: {N} use cases, {N} repositories, {N} controllers
- Total: {N} test suites, {N} tests — all passing
- Lint: 0 errors. Build: clean.

### Infrastructure

- {Infrastructure additions if any}

### Documentation

- {Documentation produced this sprint}

---

## What Is NOT Done (Next Sprint Dependencies)

1. {Item 1 — specific, not vague}
2. {Item 2}

---

## Open Technical Debt

| ID | Priority | Description |
|----|----------|-------------|
| TD-{N} | High | {Description} |

---

## Verification Commands

```bash
npm run lint          # Must exit 0
npm run build         # Must succeed
npm run test          # Must show {N} suites / {N} tests passing
npx prisma validate   # Must show schema is valid
```

---

## Next Checkpoint Target

**Sprint {N+1} — {Next Sprint Name}**

Expected deliverables:
- {Deliverable 1}
- {Deliverable 2}

Expected tag: `v{X.Y.Z+1}-{next-slug}`
