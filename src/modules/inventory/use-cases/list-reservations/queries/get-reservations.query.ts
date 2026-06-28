import { ReservationStatusEnum } from '@prisma/client';

export class GetReservationsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly status?: ReservationStatusEnum,
    public readonly bag_id?: bigint,
    public readonly order_id?: bigint,
  ) {}
}
