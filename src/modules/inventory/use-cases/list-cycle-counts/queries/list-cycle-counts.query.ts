import type { AccountabilityClosureEnum } from '@prisma/client';

export class ListCycleCountsQuery {
  constructor(
    public readonly warehouse_id: bigint | null,
    public readonly model_id: bigint | null,
    public readonly closure_status: AccountabilityClosureEnum | null,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
