import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ScreenPermissionGuard } from './screen-permission.guard';
import { AuthorizationService } from '../services/authorization.service';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../../../core/constants/auth.constants';
import { SCREEN_PERMISSION_KEY } from '../constants/authorization.constants';
import type { ScreenPermissionMeta } from '../decorators/require-screen-permission.decorator';

const USER: JwtPayload = {
  sub: BigInt(1),
  username: 'alice',
  roleId: BigInt(5),
  sessionId: BigInt(10),
};

const META: ScreenPermissionMeta = {
  screenCode: 'orders',
  permissionType: 'VIEW',
};

function makeReflector(
  isPublic: boolean,
  meta: ScreenPermissionMeta | undefined,
): Reflector {
  const r = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  (r.getAllAndOverride as jest.Mock).mockImplementation((key: string) => {
    if (key === IS_PUBLIC_KEY) return isPublic;
    if (key === SCREEN_PERMISSION_KEY) return meta;
    return undefined;
  });
  return r;
}

function makeCtx(
  user: JwtPayload | undefined,
  reflector: Reflector,
): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    reflector,
    getAllAndOverride: (reflector as any).getAllAndOverride,
  } as unknown as ExecutionContext;
}

describe('ScreenPermissionGuard', () => {
  let authzService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    authzService = {
      canAccessScreen: jest.fn(),
    } as unknown as jest.Mocked<AuthorizationService>;
  });

  it('allows non-HTTP contexts through', async () => {
    const guard = new ScreenPermissionGuard(
      { getAllAndOverride: jest.fn() } as any,
      authzService,
    );
    const ctx = { getType: () => 'rpc' } as unknown as ExecutionContext;
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('allows @Public() routes without checking permissions', async () => {
    const reflector = makeReflector(true, META);
    const guard = new ScreenPermissionGuard(reflector, authzService);
    expect(await guard.canActivate(makeCtx(USER, reflector))).toBe(true);
    expect(authzService.canAccessScreen).not.toHaveBeenCalled();
  });

  it('allows routes without @RequireScreenPermission() metadata', async () => {
    const reflector = makeReflector(false, undefined);
    const guard = new ScreenPermissionGuard(reflector, authzService);
    expect(await guard.canActivate(makeCtx(USER, reflector))).toBe(true);
    expect(authzService.canAccessScreen).not.toHaveBeenCalled();
  });

  it('returns true when canAccessScreen returns true', async () => {
    const reflector = makeReflector(false, META);
    const guard = new ScreenPermissionGuard(reflector, authzService);
    authzService.canAccessScreen.mockResolvedValue(true);
    expect(await guard.canActivate(makeCtx(USER, reflector))).toBe(true);
    expect(authzService.canAccessScreen).toHaveBeenCalledWith(
      USER,
      'orders',
      'VIEW',
    );
  });

  it('throws ForbiddenException when canAccessScreen returns false', async () => {
    const reflector = makeReflector(false, META);
    const guard = new ScreenPermissionGuard(reflector, authzService);
    authzService.canAccessScreen.mockResolvedValue(false);
    await expect(
      guard.canActivate(makeCtx(USER, reflector)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns false when no user is on the request', async () => {
    const reflector = makeReflector(false, META);
    const guard = new ScreenPermissionGuard(reflector, authzService);
    expect(await guard.canActivate(makeCtx(undefined, reflector))).toBe(false);
    expect(authzService.canAccessScreen).not.toHaveBeenCalled();
  });
});
