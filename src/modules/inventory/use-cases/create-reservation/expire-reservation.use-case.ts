import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import type { ExpireReservationCommand } from './commands/expire-reservation.command';
import type { ReservationResult } from '../../contracts/reservation-result.interface';

@Injectable()
export class ExpireReservationUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(cmd: ExpireReservationCommand): Promise<ReservationResult> {
    return this.reservationService.expire(cmd);
  }
}
