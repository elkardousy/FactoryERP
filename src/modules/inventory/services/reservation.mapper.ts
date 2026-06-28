import { Injectable } from '@nestjs/common';
import type { physical_bag_reservations } from '@prisma/client';
import { ReservationResponseDto } from '../dto/reservation-response.dto';
import { ReservationHistoryDto } from '../dto/reservation-history.dto';

@Injectable()
export class ReservationMapper {
  toResponse(r: physical_bag_reservations): ReservationResponseDto {
    const dto = new ReservationResponseDto();
    dto.reservation_id = r.reservation_id.toString();
    dto.bag_id = r.bag_id.toString();
    dto.order_id = r.order_id.toString();
    dto.reserved_dozens = r.reserved_dozens.toString();
    dto.reserved_by = r.reserved_by.toString();
    dto.reserved_at = r.reserved_at.toISOString();
    dto.released_at = r.released_at ? r.released_at.toISOString() : null;
    dto.status = r.status;
    return dto;
  }

  toResponseList(items: physical_bag_reservations[]): ReservationResponseDto[] {
    return items.map((r) => this.toResponse(r));
  }

  toHistory(r: physical_bag_reservations): ReservationHistoryDto {
    const dto = new ReservationHistoryDto();
    dto.reservation_id = r.reservation_id.toString();
    dto.bag_id = r.bag_id.toString();
    dto.order_id = r.order_id.toString();
    dto.reserved_dozens = r.reserved_dozens.toString();
    dto.reserved_by = r.reserved_by.toString();
    dto.reserved_at = r.reserved_at.toISOString();
    dto.released_at = r.released_at ? r.released_at.toISOString() : null;
    dto.status = r.status;
    return dto;
  }

  toHistoryList(items: physical_bag_reservations[]): ReservationHistoryDto[] {
    return items.map((r) => this.toHistory(r));
  }
}
