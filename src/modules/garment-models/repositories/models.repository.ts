import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { models } from '@prisma/client';

interface CreateModelData {
  customer_id: bigint;
  model_code: string;
  model_name?: string;
}
type UpdateModelData = Partial<Omit<CreateModelData, 'customer_id'>>;

interface ModelFilter {
  customer_id?: bigint;
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class ModelsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateModelData): Promise<models> {
    return this.db.models.create({ data });
  }

  async update(modelId: bigint, data: UpdateModelData): Promise<models> {
    return this.db.models.update({
      where: { model_id: modelId },
      data: { ...data, updated_at: new Date() },
    });
  }

  async findById(modelId: bigint) {
    return this.db.models.findUnique({
      where: { model_id: modelId },
      include: {
        customers: {
          select: {
            customer_id: true,
            customer_code: true,
            customer_name: true,
          },
        },
        model_parts: { orderBy: { sort_order: 'asc' } },
        model_colors: {
          include: {
            colors: {
              select: { color_id: true, color_code: true, color_name: true },
            },
          },
        },
        model_sizes: {
          include: {
            sizes: {
              select: { size_id: true, size_code: true, sort_order: true },
            },
          },
        },
      },
    });
  }

  async findByCustomerAndCode(
    customerId: bigint,
    modelCode: string,
  ): Promise<models | null> {
    return this.db.models.findUnique({
      where: {
        customer_id_model_code: {
          customer_id: customerId,
          model_code: modelCode,
        },
      },
    });
  }

  async findAllWithPagination(
    filter: ModelFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<models>> {
    const where = {
      ...(filter.is_active !== undefined && { is_active: filter.is_active }),
      ...(filter.customer_id && { customer_id: filter.customer_id }),
      ...(filter.search && {
        OR: [
          {
            model_code: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            model_name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.models.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ customer_id: 'asc' }, { model_code: 'asc' }],
      }),
      this.db.models.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async softDelete(modelId: bigint): Promise<models> {
    return this.db.models.update({
      where: { model_id: modelId },
      data: { is_active: false, updated_at: new Date() },
    });
  }

  async restore(modelId: bigint): Promise<models> {
    return this.db.models.update({
      where: { model_id: modelId },
      data: { is_active: true, updated_at: new Date() },
    });
  }
}
