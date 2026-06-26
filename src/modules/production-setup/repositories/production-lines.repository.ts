import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { production_lines } from '@prisma/client';

interface CreateLineData {
  line_code: string;
  line_name: string;
}
type UpdateLineData = Partial<CreateLineData>;

interface LineFilter {
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class ProductionLinesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateLineData): Promise<production_lines> {
    return this.db.production_lines.create({ data });
  }

  async update(
    lineId: bigint,
    data: UpdateLineData,
  ): Promise<production_lines> {
    return this.db.production_lines.update({
      where: { line_id: lineId },
      data,
    });
  }

  async findById(lineId: bigint): Promise<production_lines | null> {
    return this.db.production_lines.findUnique({ where: { line_id: lineId } });
  }

  async findByCode(lineCode: string): Promise<production_lines | null> {
    return this.db.production_lines.findUnique({
      where: { line_code: lineCode },
    });
  }

  async findAllWithPagination(
    filter: LineFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<production_lines>> {
    const where = {
      ...(filter.is_active !== undefined && { is_active: filter.is_active }),
      ...(filter.search && {
        OR: [
          {
            line_code: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            line_name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.production_lines.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { line_code: 'asc' },
      }),
      this.db.production_lines.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async softDelete(lineId: bigint): Promise<production_lines> {
    return this.db.production_lines.update({
      where: { line_id: lineId },
      data: { is_active: false },
    });
  }

  async restore(lineId: bigint): Promise<production_lines> {
    return this.db.production_lines.update({
      where: { line_id: lineId },
      data: { is_active: true },
    });
  }
}
