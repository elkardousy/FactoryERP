import { buildPaginationMeta } from './paginated-result.interface';

describe('buildPaginationMeta', () => {
  it('computes totalPages as ceil of total/limit', () => {
    expect(buildPaginationMeta(1, 10, 25).totalPages).toBe(3);
  });

  it('returns totalPages 1 when total is 0', () => {
    expect(buildPaginationMeta(1, 10, 0).totalPages).toBe(1);
  });

  it('hasNext is true when not on last page', () => {
    const meta = buildPaginationMeta(1, 10, 25);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(false);
  });

  it('hasPrev is true on page 2+', () => {
    const meta = buildPaginationMeta(2, 10, 25);
    expect(meta.hasPrev).toBe(true);
  });

  it('hasNext is false on last page', () => {
    const meta = buildPaginationMeta(3, 10, 25);
    expect(meta.hasNext).toBe(false);
  });

  it('reflects correct page, limit, total values', () => {
    const meta = buildPaginationMeta(2, 20, 50);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(20);
    expect(meta.total).toBe(50);
  });
});
