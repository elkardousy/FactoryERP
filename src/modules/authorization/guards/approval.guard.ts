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
import { APPROVAL_KEY } from '../constants/authorization.constants';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class ApprovalGuard implements CanActivate {
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

    const templateCode = this.reflector.getAllAndOverride<string | undefined>(
      APPROVAL_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!templateCode) return true;

    const user = context.switchToHttp().getRequest<Request>().user as
      | JwtPayload
      | undefined;
    if (!user) return false;

    const allowed = await this.authzService.canApproveWorkflow(
      user,
      templateCode,
    );
    if (!allowed) {
      throw new ForbiddenException(
        `You do not have approval permission for workflow '${templateCode}'.`,
      );
    }
    return true;
  }
}
