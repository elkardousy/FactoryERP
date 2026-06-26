import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { colors } from '@prisma/client';

interface CreateColorData {
  color_code: string;
  color_name: string;
  hex_value?: string;
}
type UpdateColorData = Partial<CreateColorData>;

@Injectable()
export class ColorsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateColorData): Promise<colors> {
    return this.db.colors.create({ data });
  }

  async update(colorId: bigint, data: UpdateColorData): Promise<colors> {
    return this.db.colors.update({ where: { color_id: colorId }, data });
  }

  async findById(colorId: bigint): Promise<colors | null> {
    return this.db.colors.findUnique({ where: { color_id: colorId } });
  }

  async findByCode(colorCode: string): Promise<colors | null> {
    return this.db.colors.findUnique({ where: { color_code: colorCode } });
  }

  async findAllWithPagination(
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<colors>> {
    const where = search
      ? {
          OR: [
            { color_code: { contains: search, mode: 'insensitive' as const } },
            { color_name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await this.db.$transaction([
      this.db.colors.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { color_code: 'asc' },
      }),
      this.db.colors.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async delete(colorId: bigint): Promise<colors> {
    return this.db.colors.delete({ where: { color_id: colorId } });
  }
}
