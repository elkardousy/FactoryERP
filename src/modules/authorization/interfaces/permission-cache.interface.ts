import type { ResolvedPermissions } from '../contracts/resolved-permissions.interface';

export interface IPermissionCache {
  get(userId: bigint, roleId: bigint): Promise<ResolvedPermissions | undefined>;
  set(
    userId: bigint,
    roleId: bigint,
    permissions: ResolvedPermissions,
  ): Promise<void>;
  invalidate(userId: bigint): Promise<void>;
  invalidateAll(): Promise<void>;
}
