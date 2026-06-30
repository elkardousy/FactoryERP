import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  OrderStatusEnum,
  ReleaseTypeEnum,
  StageStatusEnum,
} from '@prisma/client';

import { ProductionOrdersRepository } from '../repositories/production-orders.repository';
import { ProductionWipRepository } from '../repositories/production-wip.repository';
import { ProductionStagesRepository } from '../repositories/production-stages.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { AuditService } from '../../../core/audit/audit.service';
import { LoggerService } from '../../../core/logger/logger.service';

import { ProcessStageCompletionWipUseCase } from './process-stage-completion-wip/process-stage-completion-wip.use-case';
import { GetWipUseCase } from './get-wip/get-wip.use-case';
import { ListWipUseCase } from './list-wip/list-wip.use-case';
import { GetWipHistoryUseCase } from './get-wip-history/get-wip-history.use-case';
import { GetProductionProgressUseCase } from './get-production-progress/get-production-progress.use-case';

import type { ProductionStageCompletedEvent } from '../events/production.events';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_ORDER = {
  order_id: BigInt(1),
  order_number: 'PO-2026-0001',
  model_id: BigInt(2),
  line_id: BigInt(3),
  release_type: ReleaseTypeEnum.FULL,
  status: OrderStatusEnum.IN_PRODUCTION,
  target_dozens: null,
  notes: null,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  closed_by: null,
  closed_at: null,
  cmo_line_id: BigInt(7),
  production_order_parts: [
    {
      order_part_id: BigInt(10),
      order_id: BigInt(1),
      part_id: BigInt(5),
      status: 'RELEASED',
    },
  ],
};

const MOCK_STAGE = {
  stage_id: BigInt(1),
  stage_name: 'Cutting',
  stage_code: 'CUT',
  sequence_order: 1,
  is_active: true,
};

const MOCK_LOG_COMPLETE = {
  log_id: BigInt(100),
  order_id: BigInt(1),
  stage_id: BigInt(1),
  line_id: BigInt(3),
  status: StageStatusEnum.COMPLETE,
  input_dozens: 12,
  output_dozens: 10,
  scrap_dozens: 1,
  incomplete_dozens: 1,
  started_by: BigInt(99),
  started_at: new Date('2026-06-30T10:00:00.000Z'),
  completed_by: BigInt(99),
  completed_at: new Date('2026-06-30T11:00:00.000Z'),
  production_stages: MOCK_STAGE,
};

const MOCK_WIP = {
  wip_id: BigInt(200),
  order_id: BigInt(1),
  line_id: BigInt(3),
  part_id: BigInt(5),
  dozens_in_wip: 10,
  version: BigInt(1),
  last_updated: new Date('2026-06-30T11:00:00.000Z'),
  production_orders: {
    order_number: 'PO-2026-0001',
    model_id: BigInt(2),
    status: OrderStatusEnum.IN_PRODUCTION,
  },
  model_parts: {
    part_code: 'A',
    part_description: 'Main fabric',
  },
  production_lines: {
    line_code: 'L01',
    line_name: 'Line 1',
  },
};

const MOCK_STAGE_COMPLETED_EVENT: ProductionStageCompletedEvent = {
  event: 'production.stage.completed',
  orderId: '1',
  stageId: '1',
  logId: '100',
  inputDozens: 12,
  outputDozens: 10,
  scrapDozens: 1,
  incompleteDozens: 1,
  isLastStage: false,
  actorId: '99',
  occurredAt: new Date('2026-06-30T11:00:00.000Z'),
};

const MOCK_WIP_TXN = {
  txn_id: BigInt(300),
  txn_reference: 'WIP-1-S1',
  txn_type: 'WIP_CONSUMPTION',
  model_id: BigInt(2),
  part_id: BigInt(5),
  color_id: null,
  size_id: null,
  from_location_type: 'PRODUCTION_ORDER',
  from_location_id: BigInt(1),
  to_location_type: 'PRODUCTION_ORDER',
  to_location_id: BigInt(1),
  dozens_qty: 10,
  executed_by: BigInt(99),
  executed_at: new Date('2026-06-30T11:00:00.000Z'),
  notes: 'Stage 1 WIP update',
};

const MOCK_PAGINATION_META = { page: 1, limit: 20, total: 1, totalPages: 1 };

// ─── Module Builder ───────────────────────────────────────────────────────────

function buildModule(
  overrides: {
    ordersRepo?: Record<string, unknown>;
    wipRepo?: Record<string, unknown>;
    stagesRepo?: Record<string, unknown>;
    publisher?: Record<string, unknown>;
  } = {},
) {
  const ordersRepo: jest.Mocked<Partial<ProductionOrdersRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_ORDER),
    ...overrides.ordersRepo,
  };

  const wipRepo: jest.Mocked<Partial<ProductionWipRepository>> = {
    findByWipId: jest.fn().mockResolvedValue(MOCK_WIP),
    findByOrder: jest.fn().mockResolvedValue([MOCK_WIP]),
    findMany: jest.fn().mockResolvedValue({
      items: [MOCK_WIP],
      meta: MOCK_PAGINATION_META,
    }),
    findWipTransactionsByOrder: jest.fn().mockResolvedValue({
      items: [MOCK_WIP_TXN],
      meta: MOCK_PAGINATION_META,
    }),
    upsertAndRecordTransaction: jest.fn().mockResolvedValue(MOCK_WIP),
    ...overrides.wipRepo,
  };

  const stagesRepo: jest.Mocked<Partial<ProductionStagesRepository>> = {
    findLogsByOrder: jest.fn().mockResolvedValue([MOCK_LOG_COMPLETE]),
    ...overrides.stagesRepo,
  };

  const publisher: jest.Mocked<Partial<ProductionEventPublisher>> = {
    emitWipUpdated: jest.fn(),
    ...overrides.publisher,
  };

  return Test.createTestingModule({
    providers: [
      ProcessStageCompletionWipUseCase,
      GetWipUseCase,
      ListWipUseCase,
      GetWipHistoryUseCase,
      GetProductionProgressUseCase,
      { provide: ProductionOrdersRepository, useValue: ordersRepo },
      { provide: ProductionWipRepository, useValue: wipRepo },
      { provide: ProductionStagesRepository, useValue: stagesRepo },
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

// ─── ProcessStageCompletionWipUseCase ─────────────────────────────────────────

describe('ProcessStageCompletionWipUseCase', () => {
  it('upserts WIP and emits event for each order part', async () => {
    const module = await buildModule();
    const useCase = module.get(ProcessStageCompletionWipUseCase);
    const publisher = module.get(ProductionEventPublisher);

    await useCase.execute(MOCK_STAGE_COMPLETED_EVENT);

    const wipRepo = module.get(ProductionWipRepository);
    expect(wipRepo.upsertAndRecordTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: BigInt(1),
        partId: BigInt(5),
        dozensInWip: 10,
      }),
    );
    expect(publisher.emitWipUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: '1',
        partId: '5',
        dozensInWip: 10,
      }),
    );
  });

  it('skips WIP update gracefully when order not found', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(ProcessStageCompletionWipUseCase);
    const wipRepo = module.get(ProductionWipRepository);

    await useCase.execute(MOCK_STAGE_COMPLETED_EVENT);
    expect(wipRepo.upsertAndRecordTransaction).not.toHaveBeenCalled();
  });

  it('skips WIP update gracefully when order has no parts', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest.fn().mockResolvedValue({
          ...MOCK_ORDER,
          production_order_parts: [],
        }),
      },
    });
    const useCase = module.get(ProcessStageCompletionWipUseCase);
    const wipRepo = module.get(ProductionWipRepository);

    await useCase.execute(MOCK_STAGE_COMPLETED_EVENT);
    expect(wipRepo.upsertAndRecordTransaction).not.toHaveBeenCalled();
  });

  it('enforces BR-W02: clamps negative output to zero', async () => {
    const module = await buildModule();
    const useCase = module.get(ProcessStageCompletionWipUseCase);
    const wipRepo = module.get(ProductionWipRepository);

    await useCase.execute({ ...MOCK_STAGE_COMPLETED_EVENT, outputDozens: -5 });
    expect(wipRepo.upsertAndRecordTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ dozensInWip: 0 }),
    );
  });

  it('sets isLastStage=true on last stage completion event', async () => {
    const module = await buildModule();
    const useCase = module.get(ProcessStageCompletionWipUseCase);
    const publisher = module.get(ProductionEventPublisher);

    const lastStageEvent: ProductionStageCompletedEvent = {
      ...MOCK_STAGE_COMPLETED_EVENT,
      isLastStage: true,
    };
    await useCase.execute(lastStageEvent);
    expect(publisher.emitWipUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ isLastStage: true }),
    );
  });
});

// ─── GetWipUseCase ────────────────────────────────────────────────────────────

describe('GetWipUseCase', () => {
  it('returns WIP response DTO', async () => {
    const module = await buildModule();
    const useCase = module.get(GetWipUseCase);
    const result = await useCase.execute('200');
    expect(result.wip_id).toBe('200');
    expect(result.order_number).toBe('PO-2026-0001');
    expect(result.part_code).toBe('A');
  });

  it('throws NotFoundException when WIP entry not found', async () => {
    const module = await buildModule({
      wipRepo: { findByWipId: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(GetWipUseCase);
    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});

// ─── ListWipUseCase ───────────────────────────────────────────────────────────

describe('ListWipUseCase', () => {
  it('returns paginated WIP list', async () => {
    const module = await buildModule();
    const useCase = module.get(ListWipUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].wip_id).toBe('200');
    expect(result.meta.total).toBe(1);
  });

  it('returns empty items when no WIP entries match', async () => {
    const module = await buildModule({
      wipRepo: {
        findMany: jest.fn().mockResolvedValue({
          items: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
      },
    });
    const useCase = module.get(ListWipUseCase);
    const result = await useCase.execute({});
    expect(result.items).toEqual([]);
  });

  it('caps limit at 100', async () => {
    const module = await buildModule();
    const useCase = module.get(ListWipUseCase);
    const wipRepo = module.get(ProductionWipRepository);
    await useCase.execute({ limit: 999 });
    expect(wipRepo.findMany).toHaveBeenCalledWith(expect.anything(), 1, 100);
  });
});

// ─── GetWipHistoryUseCase ─────────────────────────────────────────────────────

describe('GetWipHistoryUseCase', () => {
  it('returns paginated WIP transaction history', async () => {
    const module = await buildModule();
    const useCase = module.get(GetWipHistoryUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].txn_reference).toBe('WIP-1-S1');
  });
});

// ─── GetProductionProgressUseCase ─────────────────────────────────────────────

describe('GetProductionProgressUseCase', () => {
  it('returns production progress with stage counts and WIP balances', async () => {
    const module = await buildModule();
    const useCase = module.get(GetProductionProgressUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.order_id).toBe('1');
    expect(result.order_number).toBe('PO-2026-0001');
    expect(result.total_stages).toBe(1);
    expect(result.completed_stages).toBe(1);
    expect(result.progress_percent).toBe(100);
    expect(result.wip_balances).toHaveLength(1);
    expect(result.wip_balances[0].part_code).toBe('A');
  });

  it('returns progress_percent 0 when no stages exist', async () => {
    const module = await buildModule({
      stagesRepo: { findLogsByOrder: jest.fn().mockResolvedValue([]) },
    });
    const useCase = module.get(GetProductionProgressUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.total_stages).toBe(0);
    expect(result.progress_percent).toBe(0);
    expect(result.current_stage).toBeNull();
  });

  it('throws NotFoundException when order not found', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(GetProductionProgressUseCase);
    await expect(useCase.execute({ order_id: '999' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
