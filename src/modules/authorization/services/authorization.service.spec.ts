import { AuthorizationService } from './authorization.service';
import { PermissionResolverService } from './permission-resolver.service';
import type { ResolvedPermissions } from '../contracts/resolved-permissions.interface';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';

const USER: JwtPayload = {
  sub: BigInt(1),
  username: 'alice',
  roleId: BigInt(5),
  sessionId: BigInt(10),
};

function makeResolved(
  overrides: Partial<ResolvedPermissions> = {},
): ResolvedPermissions {
  return {
    userId: USER.sub,
    roleId: USER.roleId,
    roleCode: 'SUPERVISOR',
    isSystemRole: false,
    permissionCodes: ['INVENTORY.VIEW', 'ORDERS.CREATE'],
    screenPermissions: [
      {
        screenId: BigInt(1),
        screenCode: 'orders',
        permissionType: 'VIEW',
        isGranted: true,
      },
      {
        screenId: BigInt(2),
        screenCode: 'orders',
        permissionType: 'CREATE',
        isGranted: false,
      },
    ],
    approvalPermissions: [
      {
        approvalPermissionId: BigInt(1),
        workflowTemplateId: BigInt(9),
        workflowTemplateCode: 'SUPP_APPROVAL',
        isDelegate: false,
        validFrom: new Date(Date.now() - 1000),
        validTo: null,
      },
    ],
    resolvedAt: new Date(),
    ...overrides,
  };
}

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let resolver: jest.Mocked<PermissionResolverService>;

  beforeEach(() => {
    resolver = {
      resolve: jest.fn(),
      invalidateUser: jest.fn(),
    } as unknown as jest.Mocked<PermissionResolverService>;
    service = new AuthorizationService(resolver);
  });

  describe('isSystemRole', () => {
    it('returns true when role is a system role', async () => {
      resolver.resolve.mockResolvedValue(makeResolved({ isSystemRole: true }));
      expect(await service.isSystemRole(USER)).toBe(true);
    });

    it('returns false for a normal role', async () => {
      resolver.resolve.mockResolvedValue(makeResolved({ isSystemRole: false }));
      expect(await service.isSystemRole(USER)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('returns true when user has one of the requested role codes', async () => {
      resolver.resolve.mockResolvedValue(
        makeResolved({ roleCode: 'SUPERVISOR' }),
      );
      expect(await service.hasRole(USER, 'ADMIN', 'SUPERVISOR')).toBe(true);
    });

    it('returns false when user role does not match', async () => {
      resolver.resolve.mockResolvedValue(makeResolved({ roleCode: 'WORKER' }));
      expect(await service.hasRole(USER, 'ADMIN', 'SUPERVISOR')).toBe(false);
    });
  });

  describe('canAccessScreen', () => {
    it('returns true for system roles regardless of screen permissions', async () => {
      resolver.resolve.mockResolvedValue(
        makeResolved({ isSystemRole: true, screenPermissions: [] }),
      );
      expect(await service.canAccessScreen(USER, 'orders', 'VIEW')).toBe(true);
    });

    it('returns true when is_granted is true for the screen + permission', async () => {
      resolver.resolve.mockResolvedValue(makeResolved());
      expect(await service.canAccessScreen(USER, 'orders', 'VIEW')).toBe(true);
    });

    it('returns false when is_granted is false for the screen + permission', async () => {
      resolver.resolve.mockResolvedValue(makeResolved());
      expect(await service.canAccessScreen(USER, 'orders', 'CREATE')).toBe(
        false,
      );
    });

    it('returns false when no screen permission entry exists', async () => {
      resolver.resolve.mockResolvedValue(makeResolved());
      expect(await service.canAccessScreen(USER, 'products', 'VIEW')).toBe(
        false,
      );
    });
  });

  describe('canApproveWorkflow', () => {
    it('returns true for system roles regardless of approval permissions', async () => {
      resolver.resolve.mockResolvedValue(
        makeResolved({ isSystemRole: true, approvalPermissions: [] }),
      );
      expect(await service.canApproveWorkflow(USER, 'SUPP_APPROVAL')).toBe(
        true,
      );
    });

    it('returns true when an active approval permission exists for the template code', async () => {
      resolver.resolve.mockResolvedValue(makeResolved());
      expect(await service.canApproveWorkflow(USER, 'SUPP_APPROVAL')).toBe(
        true,
      );
    });

    it('returns false when the approval permission has expired (validTo in the past)', async () => {
      resolver.resolve.mockResolvedValue(
        makeResolved({
          approvalPermissions: [
            {
              approvalPermissionId: BigInt(1),
              workflowTemplateId: BigInt(9),
              workflowTemplateCode: 'SUPP_APPROVAL',
              isDelegate: false,
              validFrom: new Date(Date.now() - 10_000),
              validTo: new Date(Date.now() - 1_000),
            },
          ],
        }),
      );
      expect(await service.canApproveWorkflow(USER, 'SUPP_APPROVAL')).toBe(
        false,
      );
    });

    it('returns false when the approval permission has not yet started (validFrom in the future)', async () => {
      resolver.resolve.mockResolvedValue(
        makeResolved({
          approvalPermissions: [
            {
              approvalPermissionId: BigInt(1),
              workflowTemplateId: BigInt(9),
              workflowTemplateCode: 'SUPP_APPROVAL',
              isDelegate: false,
              validFrom: new Date(Date.now() + 60_000),
              validTo: null,
            },
          ],
        }),
      );
      expect(await service.canApproveWorkflow(USER, 'SUPP_APPROVAL')).toBe(
        false,
      );
    });

    it('returns false for an unknown template code', async () => {
      resolver.resolve.mockResolvedValue(makeResolved());
      expect(await service.canApproveWorkflow(USER, 'UNKNOWN_WORKFLOW')).toBe(
        false,
      );
    });
  });

  describe('hasPermission', () => {
    it('returns true for system roles regardless of permission codes', async () => {
      resolver.resolve.mockResolvedValue(
        makeResolved({ isSystemRole: true, permissionCodes: [] }),
      );
      expect(await service.hasPermission(USER, 'ANYTHING')).toBe(true);
    });

    it('returns true when permission code is in the list', async () => {
      resolver.resolve.mockResolvedValue(makeResolved());
      expect(await service.hasPermission(USER, 'INVENTORY.VIEW')).toBe(true);
    });

    it('returns false when permission code is not in the list', async () => {
      resolver.resolve.mockResolvedValue(makeResolved());
      expect(await service.hasPermission(USER, 'ADMIN.PANEL')).toBe(false);
    });
  });

  describe('invalidateUserPermissions', () => {
    it('delegates to resolver.invalidateUser', async () => {
      await service.invalidateUserPermissions(BigInt(1));
      expect(resolver.invalidateUser).toHaveBeenCalledWith(BigInt(1));
    });
  });
});
