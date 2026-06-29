export class ReturnBagFromOrderCommand {
  constructor(
    readonly bag_id: bigint,
    readonly to_warehouse_id: bigint,
    readonly movement_reason: string,
    readonly performed_by: bigint,
    readonly notes: string | null,
  ) {}
}
