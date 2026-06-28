import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import type { ReleaseReservationCommand } from './commands/release-reservation.command';
import type { ReservationResult } from '../../contracts/reservation-result.interface';

@Injectable()
export class ReleaseReservationUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(cmd: ReleaseReservationCommand): Promise<ReservationResult> {
    return this.reservationService.release(cmd);
  }
}
