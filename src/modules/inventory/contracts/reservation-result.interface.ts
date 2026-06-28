import type { ReservationResponseDto } from '../dto/reservation-response.dto';

export interface ReservationResult {
  success: true;
  reservation: ReservationResponseDto;
}
