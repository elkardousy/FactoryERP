export class CancelReservationCommand {
  constructor(
    public readonly reservation_id: bigint,
    public readonly cancelled_by: bigint,
  ) {}
}
