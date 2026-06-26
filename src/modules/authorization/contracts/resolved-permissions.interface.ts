import type { PermissionTypeEnum } from '@prisma/client';

export interface ScreenPermissionEntry {
  screenId: bigint;
  screenCode: string;
  permissionType: PermissionTypeEnum;
  isGranted: boolean;
}

export interface ApprovalPermissionEntry {
  approvalPermissionId: bigint;
  workflowTemplateId: bigint;
  workflowTemplateCode: string;
  isDelegate: boolean;
  validFrom: Date;
  validTo: Date | null;
}

export interface ResolvedPermissions {
  userId: bigint;
  roleId: bigint;
  roleCode: string;
  isSystemRole: boolean;
  permissionCodes: string[];
  screenPermissions: ScreenPermissionEntry[];
  approvalPermissions: ApprovalPermissionEntry[];
  resolvedAt: Date;
}
