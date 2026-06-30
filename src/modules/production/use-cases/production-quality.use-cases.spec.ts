import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatusEnum, StageStatusEnum } from '@prisma/client';

import { ProductionOrdersRepository } from '../repositories/production-orders.repository';
import { ProductionStagesRepository } from '../repositories/production-stages.repository';
import { ProductionQualityRepository } from '../repositories/production-quality.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { AuditService } from '../../../core/audit/audit.service';
import { LoggerService } from '../../../core/logger/logger.service';

import { RecordQualityOutputUseCase } from './record-quality-output/record-quality-output.use-case';
import { GetQualityBoxUseCase } from './get-quality-box/get-quality-box.use-case';
import { ListQualityBoxesUseCase } from './list-quality-boxes/list-quality-boxes.use-case';
import { GetQualitySummaryUseCase } from './get-quality-summary/get-quality-summary.use-case';
import { GetQualityHistoryUseCase } from './get-quality-history/get-quality-history.use-case';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_ORDER = {
  order_id: BigInt(1),
  order_number: 'PO-2026-0001',
  model_id: BigInt(2),
  line_id: BigInt(3),
  status: OrderStatusEnum.IN_PRODUCTION,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  production_order_parts: [],
};

const MOCK_STAGE_COMPLETE = {
  log_id: BigInt(100),
  order_id: BigInt(1),
  stage_id: BigInt(1),
  status: StageStatusEnum.COMPLETE,
  input_dozens: 20,
  output_dozens: 18,
  scrap_dozens: 1,
  incomplete_dozens: 1,
  started_at: new Date('2026-06-30T10:00:00.000Z'),
  completed_at: new Date('2026-06-30T11:00:00.000Z'),
  production_stages: {
    stage_id: BigInt(1),
    stage_name: 'Final',
    stage_code: 'FIN',
    sequence_order: 3,
    is_active: true,
  },
};

const MOCK_BOX = {
  box_id: BigInt(200),
  order_id: BigInt(1),
  model_id: BigInt(2),
  color_id: BigInt(10),
  size_id: BigInt(20),
  dozens_available: 5,
  version: BigInt(1),
  last_updated: new Date('2026-06-30T12:00:00.000Z'),
  models: { model_code: 'M01', model_name: 'Model One' },
  colors: { color_code: 'RED', color_name: 'Red' },
  sizes: { size_code: 'M' },
};

const MOCK_QO_TXN = {
  txn_id: BigInt(300),
  txn_reference: 'QO-1-C10-S20',
  txn_type: 'QUALITY_OUTPUT',
  model_id: BigInt(2),
  color_id: BigInt(10),
  size_id: BigInt(20),
  from_location_type: 'PRODUCTION_ORDER',
  from_location_id: BigInt(1),
  to_location_type: 'PRODUCTION_ORDER',
  to_location_id: BigInt(1),
  dozens_qty: 5,
  executed_by: BigInt(99),
  executed_at: new Date('2026-06-30T12:00:00.000Z'),
  notes: null,
};

const MOCK_ACTOR = { sub: BigInt(99), role: 'ADMIN', email: 'actor@test.com' };

const MOCK_PAGINATION_META = { page: 1, limit: 20, total: 1, totalPages: 1 };

// ─── Module Builder ───────────────────────────────────────────────────────────

function buildModule(
  overrides: {
    ordersRepo?: Record<string, unknown>;
    stagesRepo?: Record<string, unknown>;
    qualityRepo?: Record<string, unknown>;
    publisher?: Record<string, unknown>;
  } = {},
) {
  const ordersRepo: jest.Mocked<Partial<ProductionOrdersRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_ORDER),
    ...overrides.ordersRepo,
  };

  const stagesRepo: jest.Mocked<Partial<ProductionStagesRepository>> = {
    findLogsByOrder: jest.fn().mockResolvedValue([MOCK_STAGE_COMPLETE]),
    ...overrides.stagesRepo,
  };

  const qualityRepo: jest.Mocked<Partial<ProductionQualityRepository>> = {
    findBoxById: jest.fn().mockResolvedValue(MOCK_BOX),
    findBoxesByOrder: jest.fn().mockResolvedValue([MOCK_BOX]),
    findMany: jest.fn().mockResolvedValue([MOCK_BOX]),
    getTotalAvailableForOrder: jest.fn().mockResolvedValue(0),
    upsertAndRecordTransaction: jest.fn().mockResolvedValue(MOCK_BOX),
    findQoTransactionsByOrder: jest.fn().mockResolvedValue({
      items: [MOCK_QO_TXN],
      meta: MOCK_PAGINATION_META,
    }),
    ...overrides.qualityRepo,
  };

  const publisher: jest.Mocked<Partial<ProductionEventPublisher>> = {
    emitQualityRecorded: jest.fn(),
    emitQualitySummaryUpdated: jest.fn(),
    ...overrides.publisher,
  };

  return Test.createTestingModule({
    providers: [
      RecordQualityOutputUseCase,
      GetQualityBoxUseCase,
      ListQualityBoxesUseCase,
      GetQualitySummaryUseCase,
      GetQualityHistoryUseCase,
      { provide: ProductionOrdersRepository, useValue: ordersRepo },
      { provide: ProductionStagesRepository, useValue: stagesRepo },
      { provide: ProductionQualityRepository, useValue: qualityRepo },
      { provide: ProductionEventPublisher, useValue: publisher },
      {
        provide: AuditService,
        useValue: { log: jest.fn().mockResolvedValue(undefined) },
      },
      {
        provide: LoggerService,
        useValue: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
      },
    ],
  }).compile();
}

// ─── RecordQualityOutputUseCase ───────────────────────────────────────────────

describe('RecordQualityOutputUseCase', () => {
  const dto = {
    order_id: '1',
    color_id: '10',
    size_id: '20',
    dozens_passed: 5,
    notes: null,
  };

  it('records QO and emits events', async () => {
    const module = await buildModule();
    const useCase = module.get(RecordQualityOutputUseCase);
    const publisher = module.get(ProductionEventPublisher);

    const result = await useCase.execute(dto, MOCK_ACTOR as never);

    expect(result.box_id).toBe('200');
    expect(result.dozens_available).toBe('5');
    expect(publisher.emitQualityRecorded).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: '1', dozensRecorded: 5 }),
    );
    expect(publisher.emitQualitySummaryUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: '1' }),
    );
  });

  it('throws NotFoundException when order not found', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(RecordQualityOutputUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when order is CLOSED', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest
          .fn()
          .mockResolvedValue({ ...MOCK_ORDER, status: OrderStatusEnum.CLOSED }),
      },
    });
    const useCase = module.get(RecordQualityOutputUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when no stage logs exist', async () => {
    const module = await buildModule({
      stagesRepo: { findLogsByOrder: jest.fn().mockResolvedValue([]) },
    });
    const useCase = module.get(RecordQualityOutputUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when final stage not COMPLETE', async () => {
    const module = await buildModule({
      stagesRepo: {
        findLogsByOrder: jest
          .fn()
          .mockResolvedValue([
            { ...MOCK_STAGE_COMPLETE, status: StageStatusEnum.IN_PROGRESS },
          ]),
      },
    });
    const useCase = module.get(RecordQualityOutputUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('enforces BR-Q03: throws BadRequestException when QO would exceed stage output', async () => {
    const module = await buildModule({
      qualityRepo: {
        ...{
          findBoxById: jest.fn().mockResolvedValue(MOCK_BOX),
          findBoxesByOrder: jest.fn().mockResolvedValue([MOCK_BOX]),
          findMany: jest.fn().mockResolvedValue([MOCK_BOX]),
          upsertAndRecordTransaction: jest.fn().mockResolvedValue(MOCK_BOX),
          findQoTransactionsByOrder: jest
            .fn()
            .mockResolvedValue({ items: [], meta: MOCK_PAGINATION_META }),
        },
        // Stage output_dozens is 18, current total already 15, new 5 = 20 > 18
        getTotalAvailableForOrder: jest.fn().mockResolvedValue(15),
      },
    });
    const useCase = module.get(RecordQualityOutputUseCase);
    await expect(
      useCase.execute({ ...dto, dozens_passed: 5 }, MOCK_ACTOR as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows QO when order is PRODUCTION_COMPLETE', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest.fn().mockResolvedValue({
          ...MOCK_ORDER,
          status: OrderStatusEnum.PRODUCTION_COMPLETE,
        }),
      },
    });
    const useCase = module.get(RecordQualityOutputUseCase);
    const result = await useCase.execute(dto, MOCK_ACTOR as never);
    expect(result.box_id).toBe('200');
  });
});

// ─── GetQualityBoxUseCase ─────────────────────────────────────────────────────

describe('GetQualityBoxUseCase', () => {
  it('returns quality box response DTO', async () => {
    const module = await buildModule();
    const useCase = module.get(GetQualityBoxUseCase);
    const result = await useCase.execute('200');
    expect(result.box_id).toBe('200');
    expect(result.color_code).toBe('RED');
    expect(result.size_code).toBe('M');
  });

  it('throws NotFoundException when box not found', async () => {
    const module = await buildModule({
      qualityRepo: { findBoxById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(GetQualityBoxUseCase);
    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});

// ─── ListQualityBoxesUseCase ──────────────────────────────────────────────────

describe('ListQualityBoxesUseCase', () => {
  it('returns list of quality boxes', async () => {
    const module = await buildModule();
    const useCase = module.get(ListQualityBoxesUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result).toHaveLength(1);
    expect(result[0].box_id).toBe('200');
  });

  it('returns empty list when no boxes match', async () => {
    const module = await buildModule({
      qualityRepo: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const useCase = module.get(ListQualityBoxesUseCase);
    const result = await useCase.execute({});
    expect(result).toEqual([]);
  });
});

// ─── GetQualitySummaryUseCase ─────────────────────────────────────────────────

describe('GetQualitySummaryUseCase', () => {
  it('returns quality summary with totals', async () => {
    const module = await buildModule();
    const useCase = module.get(GetQualitySummaryUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.order_id).toBe('1');
    expect(result.box_count).toBe(1);
    expect(result.by_color_size).toHaveLength(1);
    expect(result.by_color_size[0].color_code).toBe('RED');
  });

  it('throws NotFoundException when order not found', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(GetQualitySummaryUseCase);
    await expect(useCase.execute({ order_id: '999' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns empty summary when no boxes exist', async () => {
    const module = await buildModule({
      qualityRepo: { findBoxesByOrder: jest.fn().mockResolvedValue([]) },
    });
    const useCase = module.get(GetQualitySummaryUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.box_count).toBe(0);
    expect(result.total_dozens_available).toBe('0');
    expect(result.by_color_size).toEqual([]);
  });
});

// ─── GetQualityHistoryUseCase ─────────────────────────────────────────────────

describe('GetQualityHistoryUseCase', () => {
  it('returns paginated QO history', async () => {
    const module = await buildModule();
    const useCase = module.get(GetQualityHistoryUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].txn_reference).toBe('QO-1-C10-S20');
    expect(result.meta.total).toBe(1);
  });

  it('caps limit at 100', async () => {
    const module = await buildModule();
    const useCase = module.get(GetQualityHistoryUseCase);
    const qualityRepo = module.get(ProductionQualityRepository);
    await useCase.execute({ order_id: '1', limit: 999 });
    expect(qualityRepo.findQoTransactionsByOrder).toHaveBeenCalledWith(
      BigInt(1),
      1,
      100,
    );
  });
});
