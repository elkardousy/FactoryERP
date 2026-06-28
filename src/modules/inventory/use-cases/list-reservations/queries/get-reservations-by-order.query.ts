export class GetReservationsByOrderQuery {
  constructor(
    public readonly order_id: bigint,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
