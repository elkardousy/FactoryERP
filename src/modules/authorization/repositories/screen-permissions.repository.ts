import { Injectable } from '@nestjs/common';
import type { PermissionTypeEnum } from '@prisma/client';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

@Injectable()
export class ScreenPermissionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByRoleId(roleId: bigint) {
    return this.db.screen_permissions.findMany({
      where: { role_id: roleId },
      include: { screens: { select: { screen_code: true } } },
    });
  }

  async findByRoleAndScreen(
    roleId: bigint,
    screenCode: string,
    permissionType: PermissionTypeEnum,
  ) {
    return this.db.screen_permissions.findFirst({
      where: {
        role_id: roleId,
        screens: { screen_code: screenCode },
        permission_type: permissionType,
      },
    });
  }
}
