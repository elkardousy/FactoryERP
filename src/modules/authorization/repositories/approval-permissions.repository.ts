import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

@Injectable()
export class ApprovalPermissionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findActiveByRoleId(roleId: bigint, now: Date) {
    return this.db.approval_permissions.findMany({
      where: {
        role_id: roleId,
        valid_from: { lte: now },
        OR: [{ valid_to: null }, { valid_to: { gte: now } }],
      },
      include: { workflow_templates: { select: { template_code: true } } },
    });
  }

  async findActiveByRoleAndTemplate(
    roleId: bigint,
    workflowTemplateId: bigint,
    now: Date,
  ) {
    return this.db.approval_permissions.findFirst({
      where: {
        role_id: roleId,
        workflow_template_id: workflowTemplateId,
        valid_from: { lte: now },
        OR: [{ valid_to: null }, { valid_to: { gte: now } }],
      },
    });
  }
}
