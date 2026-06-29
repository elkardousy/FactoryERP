export class OpenCycleCountCommand {
  constructor(
    public readonly investigation_number: string,
    public readonly warehouse_id: bigint,
    public readonly model_id: bigint,
    public readonly part_id: bigint,
    public readonly actual_dozens: number,
    public readonly notes: string | null,
    public readonly performed_by: bigint,
  ) {}
}
