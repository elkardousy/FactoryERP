export class ExpireReservationCommand {
  constructor(
    public readonly reservation_id: bigint,
    public readonly expired_by: bigint,
  ) {}
}
