# Performance Review Prompt

**Purpose:** Verify that new endpoints and queries meet performance expectations for manufacturing operations. Identify N+1 queries, missing indexes, and unbounded result sets.

**When required:** New database query patterns, reporting endpoints, dashboard endpoints, or any endpoint expected to be called frequently.

---

## Review Process

### Step 1 — Query Analysis

For every new repository method, review the Prisma query:

**N+1 detection:**
```typescript
// WRONG — N+1: loads orders then loads line items for each
const orders = await this.db.production_orders.findMany();
for (const order of orders) {
  order.lineItems = await this.db.cmo_line_items.findMany({ where: { order_id: order.id } });
}

// CORRECT — single query with include:
const orders = await this.db.production_orders.findMany({
  include: { line_items: true }
});
```

- [ ] No N+1 patterns in repository methods
- [ ] Related entities are loaded via `include`, not in a loop
- [ ] Deeply nested `include` chains (depth > 3) are flagged for review

### Step 2 — Pagination Enforcement

- [ ] All list endpoints use `PaginationDto` (page, limit)
- [ ] `limit` is capped at a maximum value (100 is standard; 1000 for exports)
- [ ] No unbounded `findMany()` calls without `take` and `skip`
- [ ] Cursor-based pagination considered for high-volume time-series queries

### Step 3 — Index Coverage

For each new model added or queried, verify indexes exist for:
- Foreign key columns used in WHERE clauses
- Status/is_active columns used in WHERE clauses
- Date columns used for range filtering
- Composite lookup patterns (e.g., `[customer_id, status]`)

```prisma
// Example — ensure indexes are declared:
model production_orders {
  order_id    BigInt   @id @default(autoincrement())
  customer_id BigInt
  status      String
  created_at  DateTime
  @@index([customer_id, status])
  @@index([created_at])
}
```

### Step 4 — Reporting Query Review

For reporting endpoints specifically:
- [ ] Aggregations use `groupBy` or `$queryRaw` — not in-memory aggregation over large result sets
- [ ] Date range inputs are validated (start ≤ end; maximum range enforced if applicable)
- [ ] Reports are not called from dashboard endpoints directly — dashboard uses pre-aggregated data

### Step 5 — Response Size

- [ ] List endpoints cap `limit` to ≤ 100 items
- [ ] Report endpoints cap result to ≤ 10,000 rows (or paginate)
- [ ] Dashboard endpoints return ≤ 50 items (strict summary view)
- [ ] Response serialization does not include deeply nested objects unnecessarily

---

## Scoring

| Score | Meaning |
|-------|---------|
| PASS | No blocking performance issues found |
| CONDITIONAL PASS | Non-critical issues documented; no N+1 in critical paths |
| FAIL | N+1 in a frequently-called endpoint; unbounded query in any endpoint |

---

## Output Report

```
Performance Review — Sprint {N} — {Date}

N+1 ANALYSIS: [PASS / FAIL]
  Findings: {list or "none"}

PAGINATION: [PASS / FAIL]
  Unbounded queries: {list or "none"}

INDEX COVERAGE: [PASS / CONDITIONAL]
  Missing indexes: {list or "none"}

REPORTING QUERIES: [PASS / CONDITIONAL]
  Issues: {list or "none"}

RESPONSE SIZE: [PASS / FAIL]
  Oversized responses: {list or "none"}

OVERALL: [PASS / CONDITIONAL / FAIL]
```

---

## Final Recommendation

- **PASS**: Proceed to Acceptance Review
- **CONDITIONAL PASS**: Document findings in PROJECT_MEMORY.md as medium-priority debt; proceed
- **FAIL**: Fix N+1 queries and unbounded queries before proceeding
