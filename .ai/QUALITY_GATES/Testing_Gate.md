# Testing Gate

The Testing Gate must pass before any sprint can be considered complete and before any release.

**Gate result: PASS, CONDITIONAL, or FAIL.**

---

## Gate Command

```bash
npm run test
```

---

## PASS Criteria

- [ ] `npm run test` exits with code 0
- [ ] Zero test failures
- [ ] Test count ≥ previous sprint's test count (no tests deleted without justification)
- [ ] Coverage report (when run with `npm run test:cov`) shows no regression in covered lines

## CONDITIONAL Criteria

- 1–3 failing tests with documented root cause (e.g., test environment requires live DB)
- Test count decreased by ≤ 3 with documented reason (e.g., merged duplicate tests)

Must be resolved before release. Cannot stay CONDITIONAL across two sprints.

## FAIL Criteria (any one item fails the gate)

- > 3 failing tests
- Test count decreased by > 3 without justification
- Build-breaking test infrastructure error (e.g., Jest config broken)

---

## Minimum Test Requirements per Sprint

For every new use case implemented:
- [ ] At least one unit test file exists: `{action}.use-case.spec.ts`
- [ ] Tests cover: happy path, entity-not-found path, validation error path
- [ ] No `jest.fn()` assertions that test nothing (e.g., `expect(jest.fn()).toBeCalled()` without setup)

---

## Test File Location Convention

```
src/modules/{module}/use-cases/{action}/{action}.use-case.spec.ts
src/modules/{module}/services/{service}.service.spec.ts
src/core/{component}/{component}.spec.ts
```

---

## Running a Specific Test

```bash
npm run test -- --testPathPattern={path-or-name}
# Examples:
npm run test -- --testPathPattern=auth
npm run test -- --testPathPattern=login.use-case
npm run test -- --testPathPattern=src/modules/cmo
```

---

## Common Failure Patterns

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '{path}'` | Wrong path in spec import | Fix relative import path |
| `Jest worker encountered 4+ failures` | Test isolation issue | Add `jest.clearAllMocks()` in `beforeEach` |
| `Received value must be a mock` | `expect(realFn).toBeCalled()` | Use `jest.fn()` or `jest.spyOn()` |
| `Timeout — async operation not resolved` | Missing `await` or `done()` | Add `await` to async calls |
| `Cannot read property of undefined` | Mock not returning expected shape | Set `mockResolvedValue({ id: 1n, ... })` with full shape |
