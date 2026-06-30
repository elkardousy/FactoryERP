import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type {
  release_groups,
  release_group_lines,
  customer_manufacturing_order_lines,
} from '@prisma/client';

export type GroupWithLines = release_groups & {
  release_group_lines: release_group_lines[];
};

@Injectable()
export class MaterialReleaseRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findGroupById(groupId: bigint): Promise<GroupWithLines | null> {
    return this.db.release_groups.findUnique({
      where: { release_group_id: groupId },
      include: { release_group_lines: { orderBy: { release_line_id: 'asc' } } },
    });
  }

  async findGroupsByOrder(orderId: bigint): Promise<release_groups[]> {
    return this.db.release_groups.findMany({
      where: { order_id: orderId },
      orderBy: { group_number: 'asc' },
    });
  }

  async countLinesByGroup(groupId: bigint): Promise<number> {
    return this.db.release_group_lines.count({
      where: { release_group_id: groupId },
    });
  }

  async findCmoLine(
    cmoLineId: bigint,
  ): Promise<customer_manufacturing_order_lines | null> {
    return this.db.customer_manufacturing_order_lines.findUnique({
      where: { cmo_line_id: cmoLineId },
    });
  }

  async incrementCmoReleasedDozens(
    cmoLineId: bigint,
    delta: number,
    currentVersion: bigint,
  ): Promise<boolean> {
    const result = await this.db.customer_manufacturing_order_lines.updateMany({
      where: { cmo_line_id: cmoLineId, version: currentVersion },
      data: {
        released_dozens: { increment: delta },
        version: { increment: 1 },
      },
    });
    return result.count === 1;
  }
}
