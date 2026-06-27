export class GetTransactionsByBagQuery {
  constructor(
    public readonly bag_id: bigint,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
