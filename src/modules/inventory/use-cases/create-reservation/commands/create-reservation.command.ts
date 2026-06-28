export class CreateReservationCommand {
  constructor(
    public readonly bag_id: bigint,
    public readonly order_id: bigint,
    public readonly reserved_dozens: number,
    public readonly reserved_by: bigint,
  ) {}
}
