export class TransferBagToWarehouseCommand {
  constructor(
    readonly bag_id: bigint,
    readonly to_warehouse_id: bigint,
    readonly dozens_moved: number | null,
    readonly movement_reason: string,
    readonly performed_by: bigint,
    readonly notes: string | null,
  ) {}
}
