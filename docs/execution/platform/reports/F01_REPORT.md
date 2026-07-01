# F01 — Node Version Pinning
# Phase 4.5 — Cross-Platform Development Environment

| Field | Value |
|---|---|
| **Feature** | F01 — Node Version Pinning |
| **Status** | COMPLETE |
| **Commit** | fd04f2a |
| **Date** | 2026-07-01 |
| **Specification** | 05_BOOTSTRAP_AND_TOOLCHAIN_SPECIFICATION.md §3 |

---

## Summary

F01 pins the Node.js runtime version at the repository level, eliminating cross-platform blocker CPB-001 (Node version drift identified in the repository audit). Two artifacts were created/modified:

1. `.nvmrc` — new file at repository root; content: `24.16.0` (no `v` prefix)
2. `package.json` — `engines` field added: `node >=24.0.0 <25.0.0`, `npm >=11.0.0`

---

## Files Created

| File | Change |
|---|---|
| `.nvmrc` | CREATED — content: `24.16.0` |

## Files Modified

| File | Change |
|---|---|
| `package.json` | Added `engines` field after `license` field |

## Files NOT Modified

All source files, Prisma schema, tests, FEOS, Knowledge Baseline, and all other configuration files are unchanged.

---

## Implementation Details

### `.nvmrc`

```
24.16.0
```

- No `v` prefix (compatible with nvm, nvm-windows, Volta, and `actions/setup-node` `node-version-file`)
- Single line, no trailing newline beyond what the Write tool produces
- Governs: `nvm use` auto-switch, CI `node-version-file` lookup

### `package.json` `engines` field

```json
"engines": {
  "node": ">=24.0.0 <25.0.0",
  "npm": ">=11.0.0"
}
```

- Positioned after `"license"` and before `"scripts"` (conventional location)
- Range `>=24.0.0 <25.0.0` enforces Node 24 LTS; blocks Node 25+ (semver)
- `npm >=11.0.0` enforces npm 11 which ships with Node 24
- Enforced by `npm install --engines-strict` and `npm ci --engines-strict` in CI

---

## Engineering Decisions

No engineering decisions required. Implementation exactly matches the specification (doc 05 §3.1 and §3.2). No conflicts with FEOS, KEB, or repository state.

---

## Quality Gates

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | PASS |
| Lint | `npm run lint` | PASS (0 errors) |
| Tests | `npm run test` | PASS — 482/482 |
| Prisma Validate | `DATABASE_URL="..." npx prisma validate` | PASS |

---

## Cross-Platform Blocker Resolution

| Blocker | Status |
|---|---|
| CPB-001: No `.nvmrc` — Node version undefined | RESOLVED |

---

## Repository Health

| Metric | Value |
|---|---|
| Commit | fd04f2a |
| Build | PASS |
| Lint | PASS (0 errors) |
| Tests | 482/482 PASS |
| Prisma | PASS |
| Source files modified | 0 |
| Schema files modified | 0 |
| Test files modified | 0 |
