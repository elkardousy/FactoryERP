import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatusEnum, PartStatusEnum } from '@prisma/client';

import { ProductionOrdersRepository } from '../repositories/production-orders.repository';
import { ProductionReturnsRepository } from '../repositories/production-returns.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { AuditService } from '../../../core/audit/audit.service';
import { LoggerService } from '../../../core/logger/logger.service';

import { CreateReturnUseCase } from './create-return/create-return.use-case';
import { GetReturnUseCase } from './get-return/get-return.use-case';
import { ListReturnsUseCase } from './list-returns/list-returns.use-case';
import { GetReturnHistoryUseCase } from './get-return-history/get-return-history.use-case';
import { GetReturnSummaryUseCase } from './get-return-summary/get-return-summary.use-case';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_ORDER_PART = {
  order_part_id: BigInt(50),
  order_id: BigInt(1),
  part_id: BigInt(5),
  status: PartStatusEnum.RELEASED,
  released_at: new Date('2026-06-30T08:00:00.000Z'),
  released_by: BigInt(99),
};

const MOCK_ORDER = {
  order_id: BigInt(1),
  order_number: 'PO-2026-0001',
  model_id: BigInt(2),
  line_id: BigInt(3),
  status: OrderStatusEnum.IN_PRODUCTION,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  production_order_parts: [MOCK_ORDER_PART],
};

const MOCK_RETURN = {
  return_id: BigInt(10),
  order_id: BigInt(1),
  part_id: BigInt(5),
  destination_warehouse_id: BigInt(7),
  dozens_returned: 3,
  returned_by: BigInt(99),
  returned_at: new Date('2026-06-30T12:00:00.000Z'),
  model_parts: { part_code: 'P001', part_description: 'Main fabric' },
  warehouses: { warehouse_name: 'Raw Material Store' },
};

const MOCK_CREATE_RESULT = {
  returnTxn: {
    return_id: BigInt(10),
    order_id: BigInt(1),
    part_id: BigInt(5),
    destination_warehouse_id: BigInt(7),
    dozens_returned: 3,
    returned_by: BigInt(99),
    returned_at: new Date('2026-06-30T12:00:00.000Z'),
  },
  wipRemaining: 7,
  partStatusUpdated: false,
};

const MOCK_ACTOR = { sub: BigInt(99), role: 'ADMIN', email: 'actor@test.com' };

// ─── Module Builder ───────────────────────────────────────────────────────────

function buildModule(
  overrides: {
    ordersRepo?: Record<string, unknown>;
    returnsRepo?: Record<string, unknown>;
    publisher?: Record<string, unknown>;
  } = {},
) {
  const ordersRepo: jest.Mocked<Partial<ProductionOrdersRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_ORDER),
    ...overrides.ordersRepo,
  };

  const returnsRepo: jest.Mocked<Partial<ProductionReturnsRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_RETURN),
    findMany: jest.fn().mockResolvedValue([MOCK_RETURN]),
    findByOrder: jest.fn().mockResolvedValue([MOCK_RETURN]),
    createReturnAndRecord: jest.fn().mockResolvedValue(MOCK_CREATE_RESULT),
    ...overrides.returnsRepo,
  };

  const publisher: jest.Mocked<Partial<ProductionEventPublisher>> = {
    emitMaterialReturned: jest.fn(),
    emitReturnSummaryUpdated: jest.fn(),
    ...overrides.publisher,
  };

  return Test.createTestingModule({
    providers: [
      CreateReturnUseCase,
      GetReturnUseCase,
      ListReturnsUseCase,
      GetReturnHistoryUseCase,
      GetReturnSummaryUseCase,
      { provide: ProductionOrdersRepository, useValue: ordersRepo },
      { provide: ProductionReturnsRepository, useValue: returnsRepo },
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

// ─── CreateReturnUseCase ──────────────────────────────────────────────────────

describe('CreateReturnUseCase', () => {
  const dto = {
    order_id: '1',
    part_id: '5',
    destination_warehouse_id: '7',
    dozens_returned: 3,
  };

  it('creates return, decrements WIP, and emits events', async () => {
    const module = await buildModule();
    const useCase = module.get(CreateReturnUseCase);
    const publisher = module.get(ProductionEventPublisher);

    const result = await useCase.execute(dto, MOCK_ACTOR as never);

    expect(result.return_id).toBe('10');
    expect(result.dozens_returned).toBe('3');
    expect(result.part_code).toBe('P001');
    expect(result.warehouse_name).toBe('Raw Material Store');
    expect(publisher.emitMaterialReturned).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: '1', partId: '5', dozensReturned: 3 }),
    );
    expect(publisher.emitReturnSummaryUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: '1' }),
    );
  });

  it('throws NotFoundException when order not found', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(CreateReturnUseCase);
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
    const useCase = module.get(CreateReturnUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when part not found in order', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest.fn().mockResolvedValue({
          ...MOCK_ORDER,
          production_order_parts: [],
        }),
      },
    });
    const useCase = module.get(CreateReturnUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when part is PENDING (not RELEASED)', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest.fn().mockResolvedValue({
          ...MOCK_ORDER,
          production_order_parts: [
            { ...MOCK_ORDER_PART, status: PartStatusEnum.PENDING },
          ],
        }),
      },
    });
    const useCase = module.get(CreateReturnUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when WIP is insufficient', async () => {
    const module = await buildModule({
      returnsRepo: {
        createReturnAndRecord: jest
          .fn()
          .mockRejectedValue(
            new BadRequestException('Insufficient WIP to return'),
          ),
      },
    });
    const useCase = module.get(CreateReturnUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('marks part as RETURNED when WIP is zeroed', async () => {
    const module = await buildModule({
      returnsRepo: {
        createReturnAndRecord: jest.fn().mockResolvedValue({
          ...MOCK_CREATE_RESULT,
          wipRemaining: 0,
          partStatusUpdated: true,
        }),
        findById: jest.fn().mockResolvedValue(MOCK_RETURN),
      },
    });
    const useCase = module.get(CreateReturnUseCase);
    const publisher = module.get(ProductionEventPublisher);

    await useCase.execute(dto, MOCK_ACTOR as never);

    expect(publisher.emitMaterialReturned).toHaveBeenCalledWith(
      expect.objectContaining({ partStatusUpdated: true, wipRemaining: 0 }),
    );
  });

  it('allows return when order is PRODUCTION_COMPLETE', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest.fn().mockResolvedValue({
          ...MOCK_ORDER,
          status: OrderStatusEnum.PRODUCTION_COMPLETE,
        }),
      },
    });
    const useCase = module.get(CreateReturnUseCase);
    const result = await useCase.execute(dto, MOCK_ACTOR as never);
    expect(result.return_id).toBe('10');
  });
});

// ─── GetReturnUseCase ─────────────────────────────────────────────────────────

describe('GetReturnUseCase', () => {
  it('returns a single return with relations', async () => {
    const module = await buildModule();
    const useCase = module.get(GetReturnUseCase);
    const result = await useCase.execute('10');
    expect(result.return_id).toBe('10');
    expect(result.part_code).toBe('P001');
  });

  it('throws NotFoundException when return not found', async () => {
    const module = await buildModule({
      returnsRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(GetReturnUseCase);
    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});

// ─── ListReturnsUseCase ───────────────────────────────────────────────────────

describe('ListReturnsUseCase', () => {
  it('returns list of returns for an order', async () => {
    const module = await buildModule();
    const useCase = module.get(ListReturnsUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result).toHaveLength(1);
    expect(result[0].return_id).toBe('10');
  });

  it('returns empty list when no returns exist', async () => {
    const module = await buildModule({
      returnsRepo: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const useCase = module.get(ListReturnsUseCase);
    const result = await useCase.execute({});
    expect(result).toHaveLength(0);
  });
});

// ─── GetReturnHistoryUseCase ──────────────────────────────────────────────────

describe('GetReturnHistoryUseCase', () => {
  it('returns paginated return history for an order', async () => {
    const module = await buildModule();
    const useCase = module.get(GetReturnHistoryUseCase);
    const result = await useCase.execute({ order_id: '1', page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.meta.page).toBe(1);
    expect(result.meta.total).toBe(1);
  });

  it('caps limit at 100', async () => {
    const returns = Array.from({ length: 150 }, (_, i) => ({
      ...MOCK_RETURN,
      return_id: BigInt(i + 1),
    }));
    const module = await buildModule({
      returnsRepo: { findByOrder: jest.fn().mockResolvedValue(returns) },
    });
    const useCase = module.get(GetReturnHistoryUseCase);
    const result = await useCase.execute({
      order_id: '1',
      page: 1,
      limit: 200,
    });
    expect(result.items).toHaveLength(100);
    expect(result.meta.limit).toBe(100);
  });
});

// ─── GetReturnSummaryUseCase ──────────────────────────────────────────────────

describe('GetReturnSummaryUseCase', () => {
  it('aggregates return summary by part', async () => {
    const secondReturn = {
      ...MOCK_RETURN,
      return_id: BigInt(11),
      dozens_returned: 2,
    };
    const module = await buildModule({
      returnsRepo: {
        findByOrder: jest.fn().mockResolvedValue([MOCK_RETURN, secondReturn]),
      },
    });
    const useCase = module.get(GetReturnSummaryUseCase);
    const result = await useCase.execute({ order_id: '1' });
    expect(result.order_id).toBe('1');
    expect(result.transaction_count).toBe(2);
    expect(result.by_part).toHaveLength(1);
    expect(result.by_part[0].part_code).toBe('P001');
    expect(result.by_part[0].transaction_count).toBe(2);
    expect(Number(result.total_dozens_returned)).toBeCloseTo(5);
  });

  it('throws NotFoundException when order not found', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(GetReturnSummaryUseCase);
    await expect(useCase.execute({ order_id: '999' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
