export class GetBalanceSnapshotQuery {
  constructor(
    readonly warehouseId: bigint,
    readonly modelId: bigint,
    readonly partId: bigint,
  ) {}
}
