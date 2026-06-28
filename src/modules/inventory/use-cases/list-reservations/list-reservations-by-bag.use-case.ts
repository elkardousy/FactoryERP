import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import { ReservationHistoryDto } from '../../dto/reservation-history.dto';
import type { GetReservationsByBagQuery } from './queries/get-reservations-by-bag.query';

@Injectable()
export class ListReservationsByBagUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(
    query: GetReservationsByBagQuery,
  ): Promise<PaginatedResult<ReservationHistoryDto>> {
    return this.reservationService.listByBag(query);
  }
}
