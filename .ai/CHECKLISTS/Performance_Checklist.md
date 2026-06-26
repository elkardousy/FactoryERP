# Performance Checklist

Run before Performance Review and before any release with new database query patterns.

---

## N+1 Query Prevention

- [ ] No loops that execute Prisma queries inside: `for`, `forEach`, `map`, `reduce`
- [ ] Related entities loaded via `include` in a single query
- [ ] Deeply nested `include` (depth > 3) reviewed and justified

```typescript
// WRONG — N+1:
const orders = await this.db.production_orders.findMany();
for (const o of orders) { o.items = await this.db.cmo_line_items.findMany(...); }

// CORRECT:
const orders = await this.db.production_orders.findMany({ include: { line_items: true } });
```

## Pagination

- [ ] All `findMany()` calls have `take` and `skip` from `PaginationDto`
- [ ] Default limit ≤ 100; absolute maximum enforced in DTO validation (`@Max(100)`)
- [ ] No endpoint returns an unbounded result set

## Index Coverage

For every new table, verify indexes exist for:
- [ ] All FK columns used in WHERE clauses
- [ ] `is_active` column (if used in list filters)
- [ ] `status` column (if used in list filters)
- [ ] Date columns used for range queries
- [ ] Composite columns used together in WHERE clauses

## Reporting / Aggregation Queries

- [ ] Aggregations done in PostgreSQL (`groupBy`, `$queryRaw`) — not in JavaScript
- [ ] `$queryRaw` uses parameterized template literals
- [ ] Report date ranges have a maximum enforced (e.g., max 1 year range)
- [ ] Report endpoints are not called from dashboard endpoints

## Response Size

- [ ] List endpoints: max 100 items
- [ ] Report endpoints: max 10,000 rows (or paginated)
- [ ] Dashboard endpoints: max 50 items
- [ ] No response includes more than 3 levels of nested objects unnecessarily

## Database Connection

- [ ] Prisma connection pool size is appropriate for the deployment environment
- [ ] No long-running queries block the connection pool
- [ ] Transactions are kept as short as possible
