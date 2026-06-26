import { Inject, Injectable } from '@nestjs/common';
import { PERMISSION_CACHE } from '../constants/authorization.constants';
import type { IPermissionCache } from '../interfaces/permission-cache.interface';
import type {
  ApprovalPermissionEntry,
  ResolvedPermissions,
  ScreenPermissionEntry,
} from '../contracts/resolved-permissions.interface';
import { RolesRepository } from '../repositories/roles.repository';
import { ScreenPermissionsRepository } from '../repositories/screen-permissions.repository';
import { ApprovalPermissionsRepository } from '../repositories/approval-permissions.repository';

@Injectable()
export class PermissionResolverService {
  constructor(
    @Inject(PERMISSION_CACHE) private readonly cache: IPermissionCache,
    private readonly rolesRepo: RolesRepository,
    private readonly screenPermissionsRepo: ScreenPermissionsRepository,
    private readonly approvalPermissionsRepo: ApprovalPermissionsRepository,
  ) {}

  async resolve(userId: bigint, roleId: bigint): Promise<ResolvedPermissions> {
    const cached = await this.cache.get(userId, roleId);
    if (cached) return cached;

    const now = new Date();

    const [role, screenPermissions, approvalPermissions] = await Promise.all([
      this.rolesRepo.findByIdWithPermissions(roleId),
      this.screenPermissionsRepo.findByRoleId(roleId),
      this.approvalPermissionsRepo.findActiveByRoleId(roleId, now),
    ]);

    if (!role) {
      throw new Error(
        `Role ${roleId} not found — possible data integrity issue.`,
      );
    }

    const permissionCodes: string[] = role.role_permissions.map(
      (rp) => rp.permissions.permission_code,
    );

    const resolvedScreenPermissions: ScreenPermissionEntry[] =
      screenPermissions.map((sp) => ({
        screenId: sp.screen_id,
        screenCode: sp.screens.screen_code,
        permissionType: sp.permission_type,
        isGranted: sp.is_granted,
      }));

    const resolvedApprovalPermissions: ApprovalPermissionEntry[] =
      approvalPermissions.map((ap) => ({
        approvalPermissionId: ap.approval_permission_id,
        workflowTemplateId: ap.workflow_template_id,
        workflowTemplateCode: ap.workflow_templates.template_code,
        isDelegate: ap.is_delegate,
        validFrom: ap.valid_from,
        validTo: ap.valid_to,
      }));

    const resolved: ResolvedPermissions = {
      userId,
      roleId,
      roleCode: role.role_code,
      isSystemRole: role.is_system_role,
      permissionCodes,
      screenPermissions: resolvedScreenPermissions,
      approvalPermissions: resolvedApprovalPermissions,
      resolvedAt: now,
    };

    await this.cache.set(userId, roleId, resolved);
    return resolved;
  }

  async invalidateUser(userId: bigint): Promise<void> {
    await this.cache.invalidate(userId);
  }
}
