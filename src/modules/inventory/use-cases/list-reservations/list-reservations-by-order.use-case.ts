import { Injectable } from '@nestjs/common';
import { ReservationService } from '../../services/reservation.service';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import { ReservationHistoryDto } from '../../dto/reservation-history.dto';
import type { GetReservationsByOrderQuery } from './queries/get-reservations-by-order.query';

@Injectable()
export class ListReservationsByOrderUseCase {
  constructor(private readonly reservationService: ReservationService) {}

  async execute(
    query: GetReservationsByOrderQuery,
  ): Promise<PaginatedResult<ReservationHistoryDto>> {
    return this.reservationService.listByOrder(query);
  }
}
