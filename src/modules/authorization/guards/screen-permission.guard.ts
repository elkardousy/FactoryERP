import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../../../core/constants/auth.constants';
import { SCREEN_PERMISSION_KEY } from '../constants/authorization.constants';
import type { ScreenPermissionMeta } from '../decorators/require-screen-permission.decorator';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class ScreenPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authzService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const meta = this.reflector.getAllAndOverride<
      ScreenPermissionMeta | undefined
    >(SCREEN_PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    if (!meta) return true;

    const user = context.switchToHttp().getRequest<Request>().user as
      | JwtPayload
      | undefined;
    if (!user) return false;

    const allowed = await this.authzService.canAccessScreen(
      user,
      meta.screenCode,
      meta.permissionType,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Access to '${meta.screenCode}' requires '${meta.permissionType}' permission.`,
      );
    }
    return true;
  }
}
