export class TransferInventoryCommand {
  constructor(
    public readonly txn_reference: string,
    public readonly model_id: bigint,
    public readonly part_id: bigint | null,
    public readonly from_warehouse_id: bigint,
    public readonly to_warehouse_id: bigint,
    public readonly dozens_qty: number,
    public readonly executed_by: bigint,
    public readonly notes: string | null,
  ) {}
}
