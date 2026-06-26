import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { departments } from '@prisma/client';

interface CreateDepartmentData {
  dept_code: string;
  dept_name: string;
  description?: string;
  parent_department_id?: bigint;
}

type UpdateDepartmentData = Partial<CreateDepartmentData>;

interface DepartmentFilter {
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class DepartmentsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateDepartmentData): Promise<departments> {
    return this.db.departments.create({ data });
  }

  async update(
    departmentId: bigint,
    data: UpdateDepartmentData,
  ): Promise<departments> {
    return this.db.departments.update({
      where: { department_id: departmentId },
      data,
    });
  }

  async findById(departmentId: bigint) {
    return this.db.departments.findUnique({
      where: { department_id: departmentId },
      include: {
        departments_parent: {
          select: { department_id: true, dept_code: true, dept_name: true },
        },
        departments_children: {
          where: { is_active: true },
          select: { department_id: true, dept_code: true, dept_name: true },
        },
      },
    });
  }

  async findByCode(deptCode: string): Promise<departments | null> {
    return this.db.departments.findUnique({ where: { dept_code: deptCode } });
  }

  async findAllWithPagination(
    filter: DepartmentFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<departments>> {
    const where = {
      ...(filter.is_active !== undefined && { is_active: filter.is_active }),
      ...(filter.search && {
        OR: [
          {
            dept_code: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            dept_name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.departments.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dept_code: 'asc' },
      }),
      this.db.departments.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async softDelete(departmentId: bigint): Promise<departments> {
    return this.db.departments.update({
      where: { department_id: departmentId },
      data: { is_active: false },
    });
  }

  async restore(departmentId: bigint): Promise<departments> {
    return this.db.departments.update({
      where: { department_id: departmentId },
      data: { is_active: true },
    });
  }
}
