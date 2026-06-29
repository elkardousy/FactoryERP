import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TxnTypeEnum } from '@prisma/client';
import { InventoryAdjustmentService } from '../services/inventory-adjustment.service';
import { AdjustmentReasonEnum } from '../dto/apply-adjustment.dto';
import { ApplyInventoryAdjustmentCommand } from './apply-inventory-adjustment/commands/apply-inventory-adjustment.command';

const makeTxn = (overrides: Partial<any> = {}) => ({
  txn_id: BigInt(1),
  txn_reference: 'ADJ-001',
  txn_type: TxnTypeEnum.ADJUSTMENT,
  model_id: BigInt(1),
  part_id: BigInt(2),
  from_location_type: null,
  from_location_id: null,
  to_location_type: 'WAREHOUSE',
  to_location_id: BigInt(3),
  dozens_qty: 5,
  executed_by: BigInt(10),
  executed_at: new Date('2026-01-01T00:00:00Z'),
  notes: '[POSITIVE_CORRECTION]',
  ...overrides,
});

describe('InventoryAdjustmentService', () => {
  let service: InventoryAdjustmentService;
  let bagsRepo: jest.Mocked<any>;
  let txnRepo: jest.Mocked<any>;
  let validationRepo: jest.Mocked<any>;
  let mapper: jest.Mocked<any>;
  let logger: jest.Mocked<any>;

  beforeEach(() => {
    bagsRepo = {
      executeInTransaction: jest
        .fn()
        .mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb({})),
      upsertOnHandInTx: jest.fn().mockResolvedValue(undefined),
    };
    txnRepo = {
      createInTx: jest.fn().mockResolvedValue(makeTxn()),
    };
    validationRepo = {
      modelExistsAndActive: jest.fn().mockResolvedValue(true),
      partExistsForModel: jest.fn().mockResolvedValue(true),
      warehouseExistsAndActive: jest.fn().mockResolvedValue(true),
    };
    mapper = {
      toResponse: jest.fn().mockReturnValue({ txn_id: '1' }),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new InventoryAdjustmentService(
      bagsRepo,
      txnRepo,
      validationRepo,
      mapper,
      logger,
    );
  });

  const makeCmd = (
    reason: AdjustmentReasonEnum,
    delta: number,
  ): ApplyInventoryAdjustmentCommand =>
    new ApplyInventoryAdjustmentCommand(
      BigInt(3),
      BigInt(1),
      BigInt(2),
      reason,
      delta,
      'ADJ-001',
      BigInt(10),
      null,
    );

  it('applies POSITIVE_CORRECTION with positive delta', async () => {
    const result = await service.applyAdjustment(
      makeCmd(AdjustmentReasonEnum.POSITIVE_CORRECTION, 10),
    );
    expect(bagsRepo.upsertOnHandInTx).toHaveBeenCalledWith(
      {},
      BigInt(3),
      BigInt(1),
      BigInt(2),
      10,
    );
    expect(txnRepo.createInTx).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('applies NEGATIVE_CORRECTION with negative delta', async () => {
    const result = await service.applyAdjustment(
      makeCmd(AdjustmentReasonEnum.NEGATIVE_CORRECTION, -5),
    );
    expect(bagsRepo.upsertOnHandInTx).toHaveBeenCalledWith(
      {},
      BigInt(3),
      BigInt(1),
      BigInt(2),
      -5,
    );
    expect(result.success).toBe(true);
  });

  it('applies DAMAGE with negative delta', async () => {
    const result = await service.applyAdjustment(
      makeCmd(AdjustmentReasonEnum.DAMAGE, -3),
    );
    expect(bagsRepo.upsertOnHandInTx).toHaveBeenCalledWith(
      {},
      BigInt(3),
      BigInt(1),
      BigInt(2),
      -3,
    );
    expect(result.success).toBe(true);
  });

  it('throws BadRequestException when DAMAGE has positive delta', async () => {
    await expect(
      service.applyAdjustment(makeCmd(AdjustmentReasonEnum.DAMAGE, 5)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('applies LOSS with negative delta', async () => {
    const result = await service.applyAdjustment(
      makeCmd(AdjustmentReasonEnum.LOSS, -2),
    );
    expect(result.success).toBe(true);
  });

  it('throws BadRequestException when LOSS has positive delta', async () => {
    await expect(
      service.applyAdjustment(makeCmd(AdjustmentReasonEnum.LOSS, 4)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when delta is zero', async () => {
    await expect(
      service.applyAdjustment(makeCmd(AdjustmentReasonEnum.AUDIT_VARIANCE, 0)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when model not found', async () => {
    (validationRepo.modelExistsAndActive as jest.Mock).mockResolvedValue(false);
    await expect(
      service.applyAdjustment(makeCmd(AdjustmentReasonEnum.AUDIT_VARIANCE, 5)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies AUDIT_VARIANCE with positive delta', async () => {
    const result = await service.applyAdjustment(
      makeCmd(AdjustmentReasonEnum.AUDIT_VARIANCE, 7),
    );
    expect(result.success).toBe(true);
  });

  it('applies AUDIT_VARIANCE with negative delta', async () => {
    const result = await service.applyAdjustment(
      makeCmd(AdjustmentReasonEnum.AUDIT_VARIANCE, -7),
    );
    expect(result.success).toBe(true);
  });
});
