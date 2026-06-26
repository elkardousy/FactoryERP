import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { customers } from '@prisma/client';

interface CreateCustomerData {
  customer_code: string;
  customer_name: string;
}
type UpdateCustomerData = Partial<CreateCustomerData>;

interface CustomerFilter {
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class CustomersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateCustomerData): Promise<customers> {
    return this.db.customers.create({ data });
  }

  async update(
    customerId: bigint,
    data: UpdateCustomerData,
  ): Promise<customers> {
    return this.db.customers.update({
      where: { customer_id: customerId },
      data: { ...data, updated_at: new Date() },
    });
  }

  async findById(customerId: bigint): Promise<customers | null> {
    return this.db.customers.findUnique({ where: { customer_id: customerId } });
  }

  async findByCode(customerCode: string): Promise<customers | null> {
    return this.db.customers.findUnique({
      where: { customer_code: customerCode },
    });
  }

  async findAllWithPagination(
    filter: CustomerFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<customers>> {
    const where = {
      ...(filter.is_active !== undefined && { is_active: filter.is_active }),
      ...(filter.search && {
        OR: [
          {
            customer_code: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            customer_name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.customers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { customer_code: 'asc' },
      }),
      this.db.customers.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async softDelete(customerId: bigint): Promise<customers> {
    return this.db.customers.update({
      where: { customer_id: customerId },
      data: { is_active: false, updated_at: new Date() },
    });
  }

  async restore(customerId: bigint): Promise<customers> {
    return this.db.customers.update({
      where: { customer_id: customerId },
      data: { is_active: true, updated_at: new Date() },
    });
  }
}
