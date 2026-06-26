import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import { IS_PUBLIC_KEY } from '../../../core/constants/auth.constants';
import { ROLES_KEY } from '../constants/authorization.constants';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class RolesGuard implements CanActivate {
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

    const roles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const user = context.switchToHttp().getRequest<Request>().user as
      | JwtPayload
      | undefined;
    if (!user) return false;

    if (!roles || roles.length === 0) {
      // No @Roles() annotation: only system-role users can proceed
      return this.authzService.isSystemRole(user);
    }

    return this.authzService.hasRole(user, ...roles);
  }
}
