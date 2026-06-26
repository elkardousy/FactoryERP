# Documentation Review Prompt

**Purpose:** Verify that all documentation is complete, accurate, and synchronized with the codebase.

---

## Review Process

### Step 1 — PROJECT_MEMORY Accuracy

- [ ] Phase and milestone reflect actual implementation state
- [ ] Repository metrics are accurate (count modules, repos, use cases, tests)
- [ ] Technical debt list reflects current state — resolved items removed
- [ ] Risks are current — outdated risks removed or updated
- [ ] Next sprint description matches the relevant sprint prompt

### Step 2 — ADR Completeness

For each significant architectural decision made this sprint:
- [ ] Is there an ADR?
- [ ] Does the ADR status reflect current state (Proposed → Accepted)?
- [ ] Is the ADR in `docs/architecture/ADR_INDEX.md`?
- [ ] Does the implementation comply with the ADR?

### Step 3 — Swagger / OpenAPI

For each new controller endpoint:
- [ ] `@ApiOperation({ summary: '...' })` present
- [ ] `@ApiResponse()` declares success and error responses
- [ ] `@ApiProperty()` present on all DTO fields
- [ ] `@ApiBearerAuth('JWT')` on all authenticated controllers
- [ ] Response type includes string IDs (BigInt-safe)

### Step 4 — CLAUDE.md Currency

- [ ] New modules are reflected in CLAUDE.md module layout section
- [ ] No new commands need to be added

### Step 5 — README_ARCHITECTURE Currency

- [ ] Current phase accurately described
- [ ] Latest stable tag is current
- [ ] Module list reflects all implemented modules

---

## Output Report

```
Documentation Review — Sprint {N} — {Date}

PROJECT_MEMORY: [CURRENT / STALE]
  Stale items: {list or "none"}

ADR COMPLETENESS: [{N}/{M} decisions documented]
  Missing ADRs: {list or "none"}

SWAGGER COVERAGE: [COMPLETE / PARTIAL]
  Missing decorators: {list or "none"}

CLAUDE.md: [CURRENT / UPDATE NEEDED]

README_ARCHITECTURE: [CURRENT / UPDATE NEEDED]

OVERALL: [PASS / FAIL]
```

---

## Final Recommendation

- **PASS**: Documentation is complete and accurate
- **FAIL**: Update identified documents before release
