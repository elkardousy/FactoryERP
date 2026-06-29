import type { AdjustmentReasonEnum } from '../../../dto/apply-adjustment.dto';

export class ApplyInventoryAdjustmentCommand {
  constructor(
    public readonly warehouse_id: bigint,
    public readonly model_id: bigint,
    public readonly part_id: bigint,
    public readonly reason: AdjustmentReasonEnum,
    public readonly dozens_delta: number,
    public readonly txn_reference: string,
    public readonly executed_by: bigint,
    public readonly notes: string | null,
  ) {}
}
