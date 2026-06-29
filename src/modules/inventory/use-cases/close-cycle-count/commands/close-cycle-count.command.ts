import type { RootCauseCategoryEnum } from '@prisma/client';

export class CloseCycleCountCommand {
  constructor(
    public readonly investigation_id: bigint,
    public readonly root_cause_category: RootCauseCategoryEnum,
    public readonly corrective_action: string | null,
    public readonly preventive_action: string | null,
    public readonly closed_by: bigint,
  ) {}
}
