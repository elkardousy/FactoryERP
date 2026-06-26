import { Injectable } from '@nestjs/common';
import type { IPermissionCache } from '../interfaces/permission-cache.interface';
import type { ResolvedPermissions } from '../contracts/resolved-permissions.interface';

const TTL_MS = 5 * 60 * 1_000; // 5 minutes

interface CacheEntry {
  permissions: ResolvedPermissions;
  expiresAt: number;
}

@Injectable()
export class MemoryPermissionCache implements IPermissionCache {
  private readonly store = new Map<string, CacheEntry>();

  private cacheKey(userId: bigint, roleId: bigint): string {
    return `${userId}:${roleId}`;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async get(
    userId: bigint,
    roleId: bigint,
  ): Promise<ResolvedPermissions | undefined> {
    const key = this.cacheKey(userId, roleId);
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.permissions;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async set(
    userId: bigint,
    roleId: bigint,
    permissions: ResolvedPermissions,
  ): Promise<void> {
    this.store.set(this.cacheKey(userId, roleId), {
      permissions,
      expiresAt: Date.now() + TTL_MS,
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async invalidate(userId: bigint): Promise<void> {
    const prefix = `${userId}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async invalidateAll(): Promise<void> {
    this.store.clear();
  }
}
