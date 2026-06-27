import { Injectable } from '@nestjs/common';
import { ReservationStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type { physical_bag_reservations } from '@prisma/client';

@Injectable()
export class PhysicalBagReservationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(reservationId: bigint): Promise<physical_bag_reservations | null> {
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

  async findActiveByOrderId(orderId: bigint): Promise<physical_bag_reservations[]> {
    return this.db.physical_bag_reservations.findMany({
      where: { order_id: orderId, status: ReservationStatusEnum.ACTIVE },
    });
  }
}
