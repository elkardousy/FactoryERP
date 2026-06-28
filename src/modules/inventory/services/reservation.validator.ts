import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ReservationStatusEnum } from '@prisma/client';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from '../repositories/physical-bag-reservations.repository';
import { InventoryValidationRepository } from '../repositories/inventory-validation.repository';
import type { CreateReservationCommand } from '../use-cases/create-reservation/commands/create-reservation.command';
import type { physical_bag_reservations } from '@prisma/client';

@Injectable()
export class ReservationValidator {
  constructor(
    private readonly bagsRepo: PhysicalBagsRepository,
    private readonly reservationsRepo: PhysicalBagReservationsRepository,
    private readonly validationRepo: InventoryValidationRepository,
  ) {}

  async validateCreate(cmd: CreateReservationCommand): Promise<void> {
    if (cmd.reserved_dozens <= 0) {
      throw new BadRequestException(
        'reserved_dozens must be greater than zero',
      );
    }

    const bag = await this.bagsRepo.findById(cmd.bag_id);
    if (!bag) {
      throw new NotFoundException(`Bag ${cmd.bag_id} not found`);
    }

    const orderExists = await this.validationRepo.orderExists(cmd.order_id);
    if (!orderExists) {
      throw new NotFoundException(`Production order ${cmd.order_id} not found`);
    }

    const existing = await this.reservationsRepo.findByBagAndOrder(
      cmd.bag_id,
      cmd.order_id,
    );
    if (existing) {
      throw new ConflictException(
        `A reservation already exists for bag ${cmd.bag_id} and order ${cmd.order_id}`,
      );
    }

    const totalReserved = await this.reservationsRepo.sumActiveReservedDozens(
      cmd.bag_id,
    );
    const available = Number(bag.current_dozens) - totalReserved;
    if (cmd.reserved_dozens > available) {
      throw new UnprocessableEntityException(
        `Insufficient available quantity. Available: ${available.toFixed(3)}, Requested: ${cmd.reserved_dozens}`,
      );
    }
  }

  assertActive(
    reservation: physical_bag_reservations,
    operation: string,
  ): void {
    if (reservation.status !== ReservationStatusEnum.ACTIVE) {
      throw new UnprocessableEntityException(
        `Cannot ${operation} reservation ${reservation.reservation_id}: status is ${reservation.status}`,
      );
    }
  }
}
