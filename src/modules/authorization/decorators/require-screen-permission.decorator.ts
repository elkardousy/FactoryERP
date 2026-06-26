import { SetMetadata } from '@nestjs/common';
import type { PermissionTypeEnum } from '@prisma/client';
import { SCREEN_PERMISSION_KEY } from '../constants/authorization.constants';

export interface ScreenPermissionMeta {
  screenCode: string;
  permissionType: PermissionTypeEnum;
}

export const RequireScreenPermission = (
  screenCode: string,
  permissionType: PermissionTypeEnum,
) =>
  SetMetadata<string, ScreenPermissionMeta>(SCREEN_PERMISSION_KEY, {
    screenCode,
    permissionType,
  });
