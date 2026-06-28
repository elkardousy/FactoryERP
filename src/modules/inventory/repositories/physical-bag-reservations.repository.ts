import { Injectable } from '@nestjs/common';
import { ReservationStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/interfaces/paginated-result.interface';
import type { physical_bag_reservations } from '@prisma/client';

export interface ReservationFilter {
  status?: ReservationStatusEnum;
  bag_id?: bigint;
  order_id?: bigint;
}

export interface CreateReservationData {
  bag_id: bigint;
  order_id: bigint;
  reserved_dozens: number;
  reserved_by: bigint;
}

@Injectable()
export class PhysicalBagReservationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(
    reservationId: bigint,
  ): Promise<physical_bag_reservations | null> {
    return this.db.physical_bag_reservations.findUnique({
      where: { reservation_id: reservationId },
    });
  }

  async findByBagAndOrder(
    bagId: bigint,
    orderId: bigint,
  ): Promise<physical_bag_reservations | null> {
    return this.db.physical_bag_reservations.findUnique({
      where: { bag_id_order_id: { bag_id: bagId, order_id: orderId } },
    });
  }

  async findActiveByBagId(bagId: bigint): Promise<physical_bag_reservations[]> {
    return this.db.physical_bag_reservations.findMany({
      where: { bag_id: bagId, status: ReservationStatusEnum.ACTIVE },
    });
  }

  async findActiveByOrderId(
    orderId: bigint,
  ): Promise<physical_bag_reservations[]> {
    return this.db.physical_bag_reservations.findMany({
      where: { order_id: orderId, status: ReservationStatusEnum.ACTIVE },
    });
  }

  async create(
    data: CreateReservationData,
  ): Promise<physical_bag_reservations> {
    return this.db.physical_bag_reservations.create({ data });
  }

  async updateStatus(
    reservationId: bigint,
    status: ReservationStatusEnum,
    releasedAt?: Date,
  ): Promise<physical_bag_reservations> {
    return this.db.physical_bag_reservations.update({
      where: { reservation_id: reservationId },
      data: {
        status,
        ...(releasedAt !== undefined && { released_at: releasedAt }),
      },
    });
  }

  async findAllWithPagination(
    filter: ReservationFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<physical_bag_reservations>> {
    const where = {
      ...(filter.status && { status: filter.status }),
      ...(filter.bag_id && { bag_id: filter.bag_id }),
      ...(filter.order_id && { order_id: filter.order_id }),
    };

    const [items, total] = await this.db.$transaction([
      this.db.physical_bag_reservations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reserved_at: 'desc' },
      }),
      this.db.physical_bag_reservations.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findAllByBag(
    bagId: bigint,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<physical_bag_reservations>> {
    const where = { bag_id: bagId };

    const [items, total] = await this.db.$transaction([
      this.db.physical_bag_reservations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reserved_at: 'desc' },
      }),
      this.db.physical_bag_reservations.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findAllByOrder(
    orderId: bigint,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<physical_bag_reservations>> {
    const where = { order_id: orderId };

    const [items, total] = await this.db.$transaction([
      this.db.physical_bag_reservations.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reserved_at: 'desc' },
      }),
      this.db.physical_bag_reservations.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async sumActiveReservedDozens(bagId: bigint): Promise<number> {
    const result = await this.db.physical_bag_reservations.aggregate({
      _sum: { reserved_dozens: true },
      where: { bag_id: bagId, status: ReservationStatusEnum.ACTIVE },
    });
    return Number(result._sum.reserved_dozens ?? 0);
  }
}
