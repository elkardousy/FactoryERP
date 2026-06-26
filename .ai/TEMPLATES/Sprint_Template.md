# Sprint {N} — {Sprint Name}

**Version target:** v{X.Y.Z}-{milestone-slug}
**Prerequisite:** {previous sprint or release}

---

## Objectives

{2-4 sentences describing what this sprint delivers and why it matters.}

---

## Scope

### New Domain Module: `src/modules/{domain}/`

**Schema entities:**
- `{table_name}` — {description}

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `{UseCase}UseCase` | {what it does} |

---

## Architecture Constraints

- {Constraint 1 — specific to this sprint}
- {Constraint 2}
- {Cross-module dependencies declared here}
- `@Roles` declaration: {who can access these endpoints}

---

## Files Expected to Change

```
prisma/schema.prisma
prisma/migrations/
src/modules/{domain}/
  {domain}.module.ts
  repositories/
  dto/
  use-cases/
  controllers/
src/app.module.ts
docs/PROJECT_MEMORY.md
docs/checkpoints/PROJECT_CHECKPOINT.md
docs/architecture/adr/ADR-{NNN}-{Title}.md
docs/architecture/ADR_INDEX.md
docs/releases/v{X.Y.Z}-{slug}.md
```

---

## Testing Requirements

- Every use case must have a unit test suite
- {Specific test scenarios for critical use cases}
- Minimum new tests: {N}
- All existing tests must continue passing

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0
- [ ] `npm run build` succeeds
- [ ] `npm run test` shows 0 failures (≥ {N} tests)
- [ ] {Business-specific criterion 1}
- [ ] {Business-specific criterion 2}
- [ ] All endpoints require appropriate `@Roles()`
- [ ] Audit events emitted for all write operations
- [ ] ADR-{NNN} written and accepted

---

## Quality Gates

All gates in `.ai/QUALITY_GATES/` must pass before sprint is marked complete.

See `.ai/CHECKLISTS/Sprint_Checklist.md`.

---

## Documentation Updates Required

1. `docs/PROJECT_MEMORY.md` — metrics, completed milestones
2. `docs/checkpoints/PROJECT_CHECKPOINT.md`
3. `docs/architecture/ARCHITECTURE_TIMELINE.md`
4. `docs/architecture/adr/ADR-{NNN}-{Title}.md`
5. `docs/architecture/ADR_INDEX.md`
6. `docs/releases/v{X.Y.Z}-{slug}.md`

---

## Exit Criteria

Sprint {N} is complete when:
- All acceptance criteria checked
- All quality gates pass
- Release `v{X.Y.Z}-{slug}` is tagged and published
- `docs/PROJECT_MEMORY.md` updated
