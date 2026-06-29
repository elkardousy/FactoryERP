export class AssignBagToOrderCommand {
  constructor(
    readonly bag_id: bigint,
    readonly to_order_id: bigint,
    readonly dozens_moved: number | null,
    readonly movement_reason: string,
    readonly performed_by: bigint,
    readonly notes: string | null,
  ) {}
}
