import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import type { CancelReservationCommand } from './commands/cancel-reservation.command';
import type { ReservationResult } from '../../contracts/reservation-result.interface';

@Injectable()
export class CancelReservationUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(cmd: CancelReservationCommand): Promise<ReservationResult> {
    return this.reservationService.cancel(cmd);
  }
}
