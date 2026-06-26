import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { sizes } from '@prisma/client';

interface CreateSizeData {
  size_code: string;
  sort_order: number;
}
type UpdateSizeData = Partial<CreateSizeData>;

@Injectable()
export class SizesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateSizeData): Promise<sizes> {
    return this.db.sizes.create({ data });
  }

  async update(sizeId: bigint, data: UpdateSizeData): Promise<sizes> {
    return this.db.sizes.update({ where: { size_id: sizeId }, data });
  }

  async findById(sizeId: bigint): Promise<sizes | null> {
    return this.db.sizes.findUnique({ where: { size_id: sizeId } });
  }

  async findByCode(sizeCode: string): Promise<sizes | null> {
    return this.db.sizes.findUnique({ where: { size_code: sizeCode } });
  }

  async findAllWithPagination(
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<sizes>> {
    const where = search
      ? { size_code: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await this.db.$transaction([
      this.db.sizes.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sort_order: 'asc' },
      }),
      this.db.sizes.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async delete(sizeId: bigint): Promise<sizes> {
    return this.db.sizes.delete({ where: { size_id: sizeId } });
  }
}
