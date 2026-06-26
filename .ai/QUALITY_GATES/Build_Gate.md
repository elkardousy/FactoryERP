# Build Gate

The Build Gate must pass before any sprint can be considered complete and before any release.

**Gate result: PASS or FAIL — no CONDITIONAL.**

---

## Gate Command

```bash
npm run build
```

Expected output: exits 0 with no errors.

---

## PASS Criteria

- [ ] `npm run build` exits with code 0
- [ ] Zero TypeScript compilation errors
- [ ] Zero TypeScript warnings treated as errors (per `tsconfig.json`)
- [ ] Output directory `dist/` is populated

## FAIL Criteria (any one item fails the gate)

- `npm run build` exits non-zero
- Any `error TS{code}` in output
- Missing module imports that prevent compilation

---

## Common Failure Patterns and Fixes

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `TS2307: Cannot find module` | Missing import or barrel export | Add import; check barrel index.ts |
| `TS2322: Type X is not assignable to type Y` | Type mismatch (often BigInt/number) | Use explicit cast or fix the type |
| `TS2339: Property does not exist` | Wrong interface / DTO shape | Check the interface definition |
| `TS1205: Re-exporting type requires 'export type'` | `isolatedModules: true` violation | Change `export { Foo }` to `export type { Foo }` for interfaces |
| `TS2345: Argument of type 'string' is not assignable to 'BigInt'` | FK passed as string | Parse with `BigInt(value)` |
| `TS2531: Object is possibly null` | `strictNullChecks` — null not handled | Add null check or assert with `!` if guaranteed |

---

## Gate Owner

Every developer (human or AI) is responsible for ensuring the Build Gate passes before committing code.

The CI pipeline (when configured) will enforce this gate automatically. Until then, run manually before every commit and before every sprint completion.
