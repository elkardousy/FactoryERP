export class AddCycleCountActionCommand {
  constructor(
    public readonly investigation_id: bigint,
    public readonly action_note: string,
    public readonly performed_by: bigint,
  ) {}
}
