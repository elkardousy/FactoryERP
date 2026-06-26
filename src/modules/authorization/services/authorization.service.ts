import { Injectable } from '@nestjs/common';
import type { PermissionTypeEnum } from '@prisma/client';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import { PermissionResolverService } from './permission-resolver.service';

@Injectable()
export class AuthorizationService {
  constructor(private readonly resolver: PermissionResolverService) {}

  async resolveForUser(user: JwtPayload) {
    return this.resolver.resolve(user.sub, user.roleId);
  }

  async isSystemRole(user: JwtPayload): Promise<boolean> {
    const resolved = await this.resolveForUser(user);
    return resolved.isSystemRole;
  }

  async hasRole(user: JwtPayload, ...roleCodes: string[]): Promise<boolean> {
    const resolved = await this.resolveForUser(user);
    return roleCodes.includes(resolved.roleCode);
  }

  async canAccessScreen(
    user: JwtPayload,
    screenCode: string,
    permissionType: PermissionTypeEnum,
  ): Promise<boolean> {
    const resolved = await this.resolveForUser(user);
    if (resolved.isSystemRole) return true;

    const entry = resolved.screenPermissions.find(
      (sp) =>
        sp.screenCode === screenCode && sp.permissionType === permissionType,
    );
    return entry?.isGranted === true;
  }

  async canApproveWorkflow(
    user: JwtPayload,
    workflowTemplateCode: string,
  ): Promise<boolean> {
    const resolved = await this.resolveForUser(user);
    if (resolved.isSystemRole) return true;

    const now = new Date();
    return resolved.approvalPermissions.some(
      (ap) =>
        ap.workflowTemplateCode === workflowTemplateCode &&
        ap.validFrom <= now &&
        (ap.validTo === null || ap.validTo >= now),
    );
  }

  async hasPermission(
    user: JwtPayload,
    permissionCode: string,
  ): Promise<boolean> {
    const resolved = await this.resolveForUser(user);
    if (resolved.isSystemRole) return true;
    return resolved.permissionCodes.includes(permissionCode);
  }

  async invalidateUserPermissions(userId: bigint): Promise<void> {
    await this.resolver.invalidateUser(userId);
  }
}
