import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { AuthorizationService } from '../services/authorization.service';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../../../core/constants/auth.constants';
import { ROLES_KEY } from '../constants/authorization.constants';

const USER: JwtPayload = {
  sub: BigInt(1),
  username: 'alice',
  roleId: BigInt(5),
  sessionId: BigInt(10),
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let authzService: jest.Mocked<AuthorizationService>;
  let reflector: Reflector;

  beforeEach(() => {
    authzService = {
      hasRole: jest.fn(),
      isSystemRole: jest.fn(),
    } as unknown as jest.Mocked<AuthorizationService>;
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new RolesGuard(reflector, authzService);
  });

  it('allows non-HTTP contexts through', async () => {
    const context = {
      getType: () => 'rpc',
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('allows @Public() routes through without checking roles', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      },
    );
    const context = {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: USER }) }),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(true);
    expect(authzService.hasRole).not.toHaveBeenCalled();
  });

  it('denies routes with no @Roles() for non-system users', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        return undefined;
      },
    );
    authzService.isSystemRole.mockResolvedValue(false);
    const context = {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: USER }) }),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(false);
    expect(authzService.hasRole).not.toHaveBeenCalled();
    expect(authzService.isSystemRole).toHaveBeenCalledWith(USER);
  });

  it('allows routes with no @Roles() for system users', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        return undefined;
      },
    );
    authzService.isSystemRole.mockResolvedValue(true);
    const context = {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: USER }) }),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(true);
    expect(authzService.hasRole).not.toHaveBeenCalled();
    expect(authzService.isSystemRole).toHaveBeenCalledWith(USER);
  });

  it('delegates to AuthorizationService.hasRole when @Roles() is present', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['ADMIN', 'SUPERVISOR'];
        return undefined;
      },
    );
    authzService.hasRole.mockResolvedValue(true);
    const context = {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: USER }) }),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(true);
    expect(authzService.hasRole).toHaveBeenCalledWith(
      USER,
      'ADMIN',
      'SUPERVISOR',
    );
  });

  it('returns false when user is missing and roles are required', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['ADMIN'];
        return undefined;
      },
    );
    const context = {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: undefined }) }),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBe(false);
    expect(authzService.hasRole).not.toHaveBeenCalled();
  });
});
