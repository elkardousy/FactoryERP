import { MemoryPermissionCache } from './memory-permission-cache';
import type { ResolvedPermissions } from '../contracts/resolved-permissions.interface';

const USER_ID = BigInt(1);
const ROLE_ID = BigInt(2);

function makeResolved(
  overrides: Partial<ResolvedPermissions> = {},
): ResolvedPermissions {
  return {
    userId: USER_ID,
    roleId: ROLE_ID,
    roleCode: 'ADMIN',
    isSystemRole: false,
    permissionCodes: [],
    screenPermissions: [],
    approvalPermissions: [],
    resolvedAt: new Date(),
    ...overrides,
  };
}

describe('MemoryPermissionCache', () => {
  let cache: MemoryPermissionCache;

  beforeEach(() => {
    cache = new MemoryPermissionCache();
  });

  it('returns undefined for a missing entry', async () => {
    expect(await cache.get(USER_ID, ROLE_ID)).toBeUndefined();
  });

  it('stores and retrieves an entry', async () => {
    const permissions = makeResolved();
    await cache.set(USER_ID, ROLE_ID, permissions);
    expect(await cache.get(USER_ID, ROLE_ID)).toBe(permissions);
  });

  it('isolates entries by userId + roleId key', async () => {
    const a = makeResolved({ userId: BigInt(1), roleId: BigInt(10) });
    const b = makeResolved({ userId: BigInt(2), roleId: BigInt(10) });
    await cache.set(BigInt(1), BigInt(10), a);
    await cache.set(BigInt(2), BigInt(10), b);

    expect(await cache.get(BigInt(1), BigInt(10))).toBe(a);
    expect(await cache.get(BigInt(2), BigInt(10))).toBe(b);
  });

  it('invalidate() removes all entries for the given userId', async () => {
    const p1 = makeResolved({ userId: BigInt(1), roleId: BigInt(10) });
    const p2 = makeResolved({ userId: BigInt(1), roleId: BigInt(20) });
    const p3 = makeResolved({ userId: BigInt(2), roleId: BigInt(10) });

    await cache.set(BigInt(1), BigInt(10), p1);
    await cache.set(BigInt(1), BigInt(20), p2);
    await cache.set(BigInt(2), BigInt(10), p3);

    await cache.invalidate(BigInt(1));

    expect(await cache.get(BigInt(1), BigInt(10))).toBeUndefined();
    expect(await cache.get(BigInt(1), BigInt(20))).toBeUndefined();
    expect(await cache.get(BigInt(2), BigInt(10))).toBe(p3);
  });

  it('invalidateAll() clears every entry', async () => {
    await cache.set(BigInt(1), BigInt(10), makeResolved());
    await cache.set(BigInt(2), BigInt(20), makeResolved());
    await cache.invalidateAll();

    expect(await cache.get(BigInt(1), BigInt(10))).toBeUndefined();
    expect(await cache.get(BigInt(2), BigInt(20))).toBeUndefined();
  });
});
