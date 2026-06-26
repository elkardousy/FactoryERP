import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

@Injectable()
export class RolesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByIdWithPermissions(roleId: bigint) {
    return this.db.roles.findUnique({
      where: { role_id: roleId },
      include: {
        role_permissions: {
          include: { permissions: true },
        },
      },
    });
  }

  async findByCode(roleCode: string) {
    return this.db.roles.findUnique({ where: { role_code: roleCode } });
  }
}
