export class GetTransactionsByWarehouseQuery {
  constructor(
    public readonly warehouse_id: bigint,
    public readonly page: number,
    public readonly limit: number,
    public readonly from_date?: Date,
    public readonly to_date?: Date,
  ) {}
}
