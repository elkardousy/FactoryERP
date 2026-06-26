import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { production_stages } from '@prisma/client';

interface CreateStageData {
  stage_code: string;
  stage_name: string;
  sequence_order: number;
}
type UpdateStageData = Partial<CreateStageData>;

@Injectable()
export class ProductionStagesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateStageData): Promise<production_stages> {
    return this.db.production_stages.create({ data });
  }

  async update(
    stageId: bigint,
    data: UpdateStageData,
  ): Promise<production_stages> {
    return this.db.production_stages.update({
      where: { stage_id: stageId },
      data,
    });
  }

  async findById(stageId: bigint): Promise<production_stages | null> {
    return this.db.production_stages.findUnique({
      where: { stage_id: stageId },
    });
  }

  async findByCode(stageCode: string): Promise<production_stages | null> {
    return this.db.production_stages.findUnique({
      where: { stage_code: stageCode },
    });
  }

  async findBySequenceOrder(
    sequenceOrder: number,
  ): Promise<production_stages | null> {
    return this.db.production_stages.findUnique({
      where: { sequence_order: sequenceOrder },
    });
  }

  async findAllWithPagination(
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<production_stages>> {
    const where = search
      ? {
          OR: [
            { stage_code: { contains: search, mode: 'insensitive' as const } },
            { stage_name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await this.db.$transaction([
      this.db.production_stages.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sequence_order: 'asc' },
      }),
      this.db.production_stages.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async delete(stageId: bigint): Promise<production_stages> {
    return this.db.production_stages.delete({ where: { stage_id: stageId } });
  }
}
