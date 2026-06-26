# ERP Readiness Review Prompt

**Purpose:** Periodic assessment of the ERP's readiness for production operation. Not a sprint gate — run at major milestones (e.g., after Inventory Engine, after Production, before v1.0.0).

---

## Review Process

### Step 1 — Domain Coverage Assessment

| ERP Domain | Status | Notes |
|-----------|--------|-------|
| Master Data (customers, suppliers, models, etc.) | ✅ Complete | v0.3.0 |
| Inventory Management | ❓ In progress / planned | |
| Customer Orders (CMO) | ❓ In progress / planned | |
| Production Orders | ❓ In progress / planned | |
| Purchasing | ❓ In progress / planned | |
| Quality Control | ❓ In progress / planned | |
| Shipping | ❓ In progress / planned | |
| Workflow Engine | ❓ In progress / planned | |
| Reporting | ❓ In progress / planned | |
| Dashboard | ❓ In progress / planned | |

### Step 2 — Operational Readiness

- [ ] Can a factory manager create a customer, create a CMO, create a production order, and track its progress to completion?
- [ ] Can a warehouse manager receive materials, update inventory, and fulfill a reservation?
- [ ] Can an operator record production progress and defects at their stage?
- [ ] Can an accountant generate period reports?
- [ ] Can an admin manage users, roles, and system configuration?

### Step 3 — Data Integrity

- [ ] FK constraints prevent orphaned records
- [ ] Soft-delete correctly filters inactive records from all list endpoints
- [ ] Inventory transactions are atomic — no partial updates
- [ ] Production order stage machine prevents invalid transitions
- [ ] CMO status machine prevents invalid transitions

### Step 4 — Integration Points

- [ ] Auth → All modules: JWT validation works end-to-end
- [ ] Customers → CMOs: Customer must be active for new CMO
- [ ] CMOs → Production: Production order created from CMO line item
- [ ] Inventory → Production: Reservation consumed at production completion
- [ ] Purchasing → Inventory: Receiving creates physical bags

### Step 5 — Performance Readiness

- [ ] All list endpoints paginated
- [ ] No N+1 queries in frequently-called paths
- [ ] Indexes cover all production query patterns

### Step 6 — Security Readiness

- [ ] All endpoints authorized
- [ ] Session revocation works
- [ ] Sensitive data not in logs
- [ ] No known high/critical vulnerabilities

---

## ERP Readiness Score

| Category | Weight | Score (0-10) |
|----------|--------|-------------|
| Domain coverage | 30% | — |
| Operational completeness | 25% | — |
| Data integrity | 20% | — |
| Integration correctness | 15% | — |
| Security | 10% | — |
| **Total** | **100%** | **(weighted average)** |

**Threshold for v1.0.0 release:** Weighted score ≥ 8.5 / 10

---

## Output Report

```
ERP Readiness Review — {Date} — Milestone {Version}

DOMAIN COVERAGE: {N}/10 domains complete
OPERATIONAL COMPLETENESS: {N}/5 user journeys supported
DATA INTEGRITY: [PASS / CONDITIONAL / FAIL]
INTEGRATION POINTS: {N}/{M} verified
PERFORMANCE: [PASS / CONDITIONAL / FAIL]
SECURITY: [PASS / CONDITIONAL / FAIL]

ERP READINESS SCORE: {X.X} / 10

RECOMMENDATION: [READY / NOT READY] for {target milestone}
```

---

## Final Recommendation

- **Score ≥ 8.5**: Ready for production release (`v1.0.0`)
- **Score 7.0–8.4**: Proceed to next sprint with documented gaps
- **Score < 7.0**: Significant gaps; re-evaluate sprint priorities
