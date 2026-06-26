# Documentation Gate

The Documentation Gate ensures that all newly implemented code is properly documented and that persistent project documents are up to date.

**Gate result: PASS, CONDITIONAL, or FAIL.**

---

## Gate Checks

### Check 1 — Swagger Coverage

```bash
# Find controllers without @ApiTags:
grep -rL "@ApiTags" src/modules/ --include="*.controller.ts"
# Expected: no output (empty)

# Find controllers without @ApiBearerAuth (for protected routes):
grep -rL "@ApiBearerAuth\|@Public" src/modules/ --include="*.controller.ts"
# Expected: no output (empty — every controller is either protected or explicitly public)
```

Any controller without `@ApiTags` → FAIL
Any protected controller without `@ApiBearerAuth` → FAIL

### Check 2 — DTO @ApiProperty Coverage

```bash
# Find DTO files without any @ApiProperty:
grep -rL "@ApiProperty\|@ApiPropertyOptional" src/ --include="*.dto.ts" \
  | grep -v "pagination\|date-range\|id-param"
# Review any results — all request/response DTOs must have Swagger decorators
```

DTO without `@ApiProperty` → CONDITIONAL (must add before release)

### Check 3 — PROJECT_MEMORY.md Currency

Manual check — verify these fields are current:
- [ ] "Current Phase" matches actual implementation state
- [ ] "Latest Git Tag" matches `git tag --sort=-creatordate | head -1`
- [ ] Test count matches `npm run test | grep "Tests:"` output
- [ ] Module count matches `ls src/modules/ | wc -l` output
- [ ] No resolved TD items still listed as active

Any field known to be stale → CONDITIONAL

### Check 4 — Checkpoint Currency

Manual check — verify:
- [ ] Sprint number and name reflect the sprint just completed
- [ ] "What is NOT done" does not omit known gaps

Any known gap silently omitted → FAIL

### Check 5 — ADR Completeness

```bash
# Count ADR files:
ls docs/architecture/adr/ | wc -l

# Count entries in ADR_INDEX.md:
grep "^| ADR-" docs/architecture/ADR_INDEX.md | wc -l
# Both counts must match
```

ADR file exists but not indexed → FAIL
ADR decision made but no file created → CONDITIONAL

---

## Scoring

| Result | Meaning |
|--------|---------|
| PASS | Checks 1, 4, 5 all clean; Checks 2, 3 current |
| CONDITIONAL | Checks 2, 3, or 5 have minor gaps with documented plan to close within the sprint |
| FAIL | Any Check 1, 4 violation; Check 5 ADR file/index mismatch |

FAIL or un-resolved CONDITIONAL blocks the release.
