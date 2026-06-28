import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import { ReservationResponseDto } from '../../dto/reservation-response.dto';
import type { GetReservationQuery } from './queries/get-reservation.query';

@Injectable()
export class GetReservationUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(query: GetReservationQuery): Promise<ReservationResponseDto> {
    return this.reservationService.get(query);
  }
}
