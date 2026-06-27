import { TxnTypeEnum } from '@prisma/client';

export class GetTransactionsQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly txn_type?: TxnTypeEnum,
    public readonly model_id?: bigint,
    public readonly txn_reference?: string,
    public readonly from_date?: Date,
    public readonly to_date?: Date,
  ) {}
}
