import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import type { CreateReservationCommand } from './commands/create-reservation.command';
import type { ReservationResult } from '../../contracts/reservation-result.interface';

@Injectable()
export class CreateReservationUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(cmd: CreateReservationCommand): Promise<ReservationResult> {
    return this.reservationService.reserve(cmd);
  }
}
