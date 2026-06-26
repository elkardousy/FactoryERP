import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { suppliers } from '@prisma/client';

interface CreateSupplierData {
  supplier_code: string;
  supplier_name: string;
  contact_info?: Record<string, unknown>;
}

type UpdateSupplierData = Partial<CreateSupplierData>;

interface SupplierFilter {
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class SuppliersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateSupplierData): Promise<suppliers> {
    return this.db.suppliers.create({
      data: {
        supplier_code: data.supplier_code,
        supplier_name: data.supplier_name,
        contact_info: data.contact_info as Prisma.InputJsonValue,
      },
    });
  }

  async update(
    supplierId: bigint,
    data: UpdateSupplierData,
  ): Promise<suppliers> {
    return this.db.suppliers.update({
      where: { supplier_id: supplierId },
      data: {
        supplier_code: data.supplier_code,
        supplier_name: data.supplier_name,
        contact_info: data.contact_info as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
    });
  }

  async findById(supplierId: bigint): Promise<suppliers | null> {
    return this.db.suppliers.findUnique({ where: { supplier_id: supplierId } });
  }

  async findByCode(supplierCode: string): Promise<suppliers | null> {
    return this.db.suppliers.findUnique({
      where: { supplier_code: supplierCode },
    });
  }

  async findAllWithPagination(
    filter: SupplierFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<suppliers>> {
    const where = {
      ...(filter.is_active !== undefined && { is_active: filter.is_active }),
      ...(filter.search && {
        OR: [
          {
            supplier_code: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            supplier_name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.suppliers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { supplier_code: 'asc' },
      }),
      this.db.suppliers.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async softDelete(supplierId: bigint): Promise<suppliers> {
    return this.db.suppliers.update({
      where: { supplier_id: supplierId },
      data: { is_active: false, updated_at: new Date() },
    });
  }

  async restore(supplierId: bigint): Promise<suppliers> {
    return this.db.suppliers.update({
      where: { supplier_id: supplierId },
      data: { is_active: true, updated_at: new Date() },
    });
  }
}
