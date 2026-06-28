export class ReleaseReservationCommand {
  constructor(
    public readonly reservation_id: bigint,
    public readonly released_by: bigint,
  ) {}
}
