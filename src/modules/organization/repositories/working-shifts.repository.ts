import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { working_shifts } from '@prisma/client';

interface CreateWorkingShiftData {
  shift_code: string;
  shift_name: string;
  start_time: Date;
  end_time: Date;
}

type UpdateWorkingShiftData = Partial<CreateWorkingShiftData>;

interface WorkingShiftFilter {
  search?: string;
  is_active?: boolean;
}

@Injectable()
export class WorkingShiftsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateWorkingShiftData): Promise<working_shifts> {
    return this.db.working_shifts.create({ data });
  }

  async update(
    shiftId: bigint,
    data: UpdateWorkingShiftData,
  ): Promise<working_shifts> {
    return this.db.working_shifts.update({
      where: { shift_id: shiftId },
      data,
    });
  }

  async findById(shiftId: bigint): Promise<working_shifts | null> {
    return this.db.working_shifts.findUnique({ where: { shift_id: shiftId } });
  }

  async findByCode(shiftCode: string): Promise<working_shifts | null> {
    return this.db.working_shifts.findUnique({
      where: { shift_code: shiftCode },
    });
  }

  async findAllWithPagination(
    filter: WorkingShiftFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<working_shifts>> {
    const where = {
      ...(filter.is_active !== undefined && { is_active: filter.is_active }),
      ...(filter.search && {
        OR: [
          {
            shift_code: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
          {
            shift_name: {
              contains: filter.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.working_shifts.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { shift_code: 'asc' },
      }),
      this.db.working_shifts.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async softDelete(shiftId: bigint): Promise<working_shifts> {
    return this.db.working_shifts.update({
      where: { shift_id: shiftId },
      data: { is_active: false },
    });
  }

  async restore(shiftId: bigint): Promise<working_shifts> {
    return this.db.working_shifts.update({
      where: { shift_id: shiftId },
      data: { is_active: true },
    });
  }
}
