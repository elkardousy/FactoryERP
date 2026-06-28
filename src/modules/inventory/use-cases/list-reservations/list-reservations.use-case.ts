import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import { ReservationResponseDto } from '../../dto/reservation-response.dto';
import type { GetReservationsQuery } from './queries/get-reservations.query';

@Injectable()
export class ListReservationsUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(
    query: GetReservationsQuery,
  ): Promise<PaginatedResult<ReservationResponseDto>> {
    return this.reservationService.list(query);
  }
}
