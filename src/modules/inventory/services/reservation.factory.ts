import { Injectable } from '@nestjs/common';
import type { CreateReservationData } from '../repositories/physical-bag-reservations.repository';
import type { CreateReservationCommand } from '../use-cases/create-reservation/commands/create-reservation.command';

@Injectable()
export class ReservationFactory {
  fromCreate(cmd: CreateReservationCommand): CreateReservationData {
    return {
      bag_id: cmd.bag_id,
      order_id: cmd.order_id,
      reserved_dozens: cmd.reserved_dozens,
      reserved_by: cmd.reserved_by,
    };
  }
}
