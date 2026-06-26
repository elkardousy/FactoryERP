import { PermissionResolverService } from './permission-resolver.service';
import type { IPermissionCache } from '../interfaces/permission-cache.interface';
import type { ResolvedPermissions } from '../contracts/resolved-permissions.interface';

const USER_ID = BigInt(1);
const ROLE_ID = BigInt(5);

const DB_ROLE = {
  role_id: ROLE_ID,
  role_code: 'SUPERVISOR',
  is_system_role: false,
  role_permissions: [
    {
      role_id: ROLE_ID,
      permission_id: BigInt(10),
      permissions: {
        permission_id: BigInt(10),
        permission_code: 'ORDERS.VIEW',
        description: null,
      },
    },
  ],
};

const DB_SCREEN_PERMISSIONS = [
  {
    screen_permission_id: BigInt(1),
    role_id: ROLE_ID,
    screen_id: BigInt(7),
    permission_type: 'VIEW' as const,
    is_granted: true,
    granted_by: BigInt(99),
    granted_at: new Date(),
    screens: { screen_code: 'production.orders' },
  },
];

const DB_APPROVAL_PERMISSIONS = [
  {
    approval_permission_id: BigInt(3),
    workflow_template_id: BigInt(9),
    role_id: ROLE_ID,
    is_delegate: false,
    valid_from: new Date(Date.now() - 1000),
    valid_to: null,
    granted_by: BigInt(99),
    workflow_templates: { template_code: 'SUPP_APPROVAL' },
  },
];

describe('PermissionResolverService', () => {
  let service: PermissionResolverService;
  let cache: jest.Mocked<IPermissionCache>;
  let rolesRepo: { findByIdWithPermissions: jest.Mock };
  let screenRepo: { findByRoleId: jest.Mock };
  let approvalRepo: { findActiveByRoleId: jest.Mock };

  beforeEach(() => {
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidateAll: jest.fn().mockResolvedValue(undefined),
    };
    rolesRepo = {
      findByIdWithPermissions: jest.fn().mockResolvedValue(DB_ROLE),
    };
    screenRepo = {
      findByRoleId: jest.fn().mockResolvedValue(DB_SCREEN_PERMISSIONS),
    };
    approvalRepo = {
      findActiveByRoleId: jest.fn().mockResolvedValue(DB_APPROVAL_PERMISSIONS),
    };

    service = new PermissionResolverService(
      cache,
      rolesRepo as any,
      screenRepo as any,
      approvalRepo as any,
    );
  });

  it('returns cached value on a cache hit without hitting the DB', async () => {
    const cached: ResolvedPermissions = {
      userId: USER_ID,
      roleId: ROLE_ID,
      roleCode: 'SUPERVISOR',
      isSystemRole: false,
      permissionCodes: [],
      screenPermissions: [],
      approvalPermissions: [],
      resolvedAt: new Date(),
    };
    cache.get.mockResolvedValue(cached);
    const result = await service.resolve(USER_ID, ROLE_ID);
    expect(result).toBe(cached);
    expect(rolesRepo.findByIdWithPermissions).not.toHaveBeenCalled();
  });

  it('fetches from DB on a cache miss and stores in cache', async () => {
    const result = await service.resolve(USER_ID, ROLE_ID);
    expect(result.roleCode).toBe('SUPERVISOR');
    expect(result.isSystemRole).toBe(false);
    expect(result.permissionCodes).toEqual(['ORDERS.VIEW']);
    expect(cache.set).toHaveBeenCalledWith(USER_ID, ROLE_ID, result);
  });

  it('maps screen permissions correctly', async () => {
    const result = await service.resolve(USER_ID, ROLE_ID);
    expect(result.screenPermissions).toHaveLength(1);
    expect(result.screenPermissions[0]).toMatchObject({
      screenCode: 'production.orders',
      permissionType: 'VIEW',
      isGranted: true,
    });
  });

  it('maps approval permissions correctly', async () => {
    const result = await service.resolve(USER_ID, ROLE_ID);
    expect(result.approvalPermissions).toHaveLength(1);
    expect(result.approvalPermissions[0]).toMatchObject({
      workflowTemplateCode: 'SUPP_APPROVAL',
      isDelegate: false,
      validTo: null,
    });
  });

  it('throws when the role does not exist in the DB', async () => {
    rolesRepo.findByIdWithPermissions.mockResolvedValue(null);
    await expect(service.resolve(USER_ID, ROLE_ID)).rejects.toThrow(
      /Role .* not found/,
    );
  });

  it('invalidateUser delegates to cache.invalidate', async () => {
    await service.invalidateUser(USER_ID);
    expect(cache.invalidate).toHaveBeenCalledWith(USER_ID);
  });
});
