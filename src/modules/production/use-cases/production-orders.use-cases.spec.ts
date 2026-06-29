import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatusEnum, ReleaseTypeEnum } from '@prisma/client';

import { ProductionOrdersRepository } from '../repositories/production-orders.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { DocumentNumberingService } from '../../../core/document-numbering/document-numbering.service';
import { AuditService } from '../../../core/audit/audit.service';
import { LoggerService } from '../../../core/logger/logger.service';

import { CreateProductionOrderUseCase } from './create-production-order/create-production-order.use-case';
import { UpdateProductionOrderUseCase } from './update-production-order/update-production-order.use-case';
import { PlanProductionOrderUseCase } from './plan-production-order/plan-production-order.use-case';
import { StartProductionOrderUseCase } from './start-production-order/start-production-order.use-case';
import { CompleteProductionOrderUseCase } from './complete-production-order/complete-production-order.use-case';
import { CloseProductionOrderUseCase } from './close-production-order/close-production-order.use-case';
import { GetProductionOrderUseCase } from './get-production-order/get-production-order.use-case';
import { ListProductionOrdersUseCase } from './list-production-orders/list-production-orders.use-case';

import type { CreateProductionOrderDto } from '../dto/production-order.dto';
import type { JwtPayload } from '../../auth/use-cases/login';

const MOCK_ACTOR: JwtPayload = {
  sub: BigInt(99),
  username: 'testuser',
  roleId: BigInt(1),
  sessionId: BigInt(1),
};

const MOCK_PAGINATION_META = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const MOCK_PART = {
  order_part_id: BigInt(10),
  order_id: BigInt(1),
  part_id: BigInt(5),
  status: 'PENDING' as any,
  released_at: null,
};

const MOCK_ORDER = {
  order_id: BigInt(1),
  order_number: 'PO-2026-0001',
  model_id: BigInt(2),
  line_id: BigInt(3),
  release_type: ReleaseTypeEnum.FULL,
  status: OrderStatusEnum.DRAFT,
  target_dozens: null,
  notes: null,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  closed_by: null,
  closed_at: null,
  cmo_line_id: BigInt(7),
  production_order_parts: [MOCK_PART],
};

function buildModule(repoOverrides: Record<string, any> = {}) {
  const ordersRepo: jest.Mocked<Partial<ProductionOrdersRepository>> = {
    create: jest.fn().mockResolvedValue(MOCK_ORDER),
    createParts: jest.fn().mockResolvedValue([MOCK_PART]),
    findById: jest.fn().mockResolvedValue(MOCK_ORDER),
    update: jest.fn().mockResolvedValue(MOCK_ORDER),
    updateStatus: jest.fn().mockResolvedValue(MOCK_ORDER),
    findMany: jest
      .fn()
      .mockResolvedValue({ items: [MOCK_ORDER], meta: MOCK_PAGINATION_META }),
    countParts: jest.fn().mockResolvedValue(1),
    countPartsByStatus: jest.fn().mockResolvedValue(1),
    countNonReleasedParts: jest.fn().mockResolvedValue(0),
    countNonCompleteStages: jest.fn().mockResolvedValue(0),
    countStageLogs: jest.fn().mockResolvedValue(3),
    isPackingPosted: jest.fn().mockResolvedValue(true),
    initializeStageLogsInTx: jest.fn().mockResolvedValue(undefined),
    validatePartsExistForModel: jest.fn().mockResolvedValue(true),
    executeInTransaction: jest.fn().mockResolvedValue(undefined),
    ...repoOverrides,
  };

  const publisher: jest.Mocked<Partial<ProductionEventPublisher>> = {
    emitOrderCreated: jest.fn(),
    emitOrderStatusChanged: jest.fn(),
    emitOrderUpdated: jest.fn(),
  };

  const docNumbering: jest.Mocked<Partial<DocumentNumberingService>> = {
    generate: jest.fn().mockResolvedValue('PO-2026-0001'),
  };

  const auditService: jest.Mocked<Partial<AuditService>> = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  return Test.createTestingModule({
    providers: [
      CreateProductionOrderUseCase,
      UpdateProductionOrderUseCase,
      PlanProductionOrderUseCase,
      StartProductionOrderUseCase,
      CompleteProductionOrderUseCase,
      CloseProductionOrderUseCase,
      GetProductionOrderUseCase,
      ListProductionOrdersUseCase,
      { provide: ProductionOrdersRepository, useValue: ordersRepo },
      { provide: ProductionEventPublisher, useValue: publisher },
      { provide: DocumentNumberingService, useValue: docNumbering },
      { provide: AuditService, useValue: auditService },
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

// ─── CreateProductionOrderUseCase ────────────────────────────────────────────

describe('CreateProductionOrderUseCase', () => {
  const CREATE_DTO: CreateProductionOrderDto = {
    model_id: '2',
    line_id: '3',
    release_type: ReleaseTypeEnum.FULL,
    cmo_line_id: '7',
    target_dozens: 10,
    part_ids: ['5'],
  };

  it('creates order and parts, returns DTO', async () => {
    const module = await buildModule();
    const useCase = module.get(CreateProductionOrderUseCase);
    const result = await useCase.execute(CREATE_DTO, MOCK_ACTOR);
    expect(result.order_number).toBe('PO-2026-0001');
    expect(result.status).toBe(OrderStatusEnum.DRAFT);
    expect(result.parts).toHaveLength(1);
  });

  it('throws BadRequest when FULL release has no cmo_line_id', async () => {
    const module = await buildModule();
    const useCase = module.get(CreateProductionOrderUseCase);
    await expect(
      useCase.execute({ ...CREATE_DTO, cmo_line_id: undefined }, MOCK_ACTOR),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when part_ids do not belong to model', async () => {
    const module = await buildModule({
      validatePartsExistForModel: jest.fn().mockResolvedValue(false),
    });
    const useCase = module.get(CreateProductionOrderUseCase);
    await expect(useCase.execute(CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('emits ProductionOrderCreatedEvent', async () => {
    const module = await buildModule();
    const useCase = module.get(CreateProductionOrderUseCase);
    const publisher = module.get(ProductionEventPublisher);
    await useCase.execute(CREATE_DTO, MOCK_ACTOR);
    expect(publisher.emitOrderCreated).toHaveBeenCalledTimes(1);
  });
});

// ─── UpdateProductionOrderUseCase ────────────────────────────────────────────

describe('UpdateProductionOrderUseCase', () => {
  it('updates notes and returns DTO', async () => {
    const module = await buildModule();
    const useCase = module.get(UpdateProductionOrderUseCase);
    const result = await useCase.execute('1', { notes: 'updated' }, MOCK_ACTOR);
    expect(result.order_id).toBe('1');
  });

  it('throws NotFoundException when order not found', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(null),
    });
    const useCase = module.get(UpdateProductionOrderUseCase);
    await expect(
      useCase.execute('999', { notes: 'x' }, MOCK_ACTOR),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequest when order is not in DRAFT', async () => {
    const module = await buildModule({
      findById: jest
        .fn()
        .mockResolvedValue({ ...MOCK_ORDER, status: OrderStatusEnum.PLANNED }),
    });
    const useCase = module.get(UpdateProductionOrderUseCase);
    await expect(
      useCase.execute('1', { notes: 'x' }, MOCK_ACTOR),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── PlanProductionOrderUseCase ──────────────────────────────────────────────

describe('PlanProductionOrderUseCase', () => {
  it('transitions DRAFT → PLANNED', async () => {
    const module = await buildModule({
      findById: jest
        .fn()
        .mockResolvedValueOnce(MOCK_ORDER)
        .mockResolvedValueOnce({
          ...MOCK_ORDER,
          status: OrderStatusEnum.PLANNED,
        }),
    });
    const useCase = module.get(PlanProductionOrderUseCase);
    const result = await useCase.execute('1', MOCK_ACTOR);
    expect(result.status).toBe(OrderStatusEnum.PLANNED);
  });

  it('throws BadRequest when not in DRAFT', async () => {
    const module = await buildModule({
      findById: jest
        .fn()
        .mockResolvedValue({ ...MOCK_ORDER, status: OrderStatusEnum.PLANNED }),
    });
    const useCase = module.get(PlanProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequest when order has no parts', async () => {
    const module = await buildModule({
      countParts: jest.fn().mockResolvedValue(0),
    });
    const useCase = module.get(PlanProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('emits ProductionOrderStatusChangedEvent', async () => {
    const module = await buildModule({
      findById: jest
        .fn()
        .mockResolvedValueOnce(MOCK_ORDER)
        .mockResolvedValueOnce({
          ...MOCK_ORDER,
          status: OrderStatusEnum.PLANNED,
        }),
    });
    const useCase = module.get(PlanProductionOrderUseCase);
    const publisher = module.get(ProductionEventPublisher);
    await useCase.execute('1', MOCK_ACTOR);
    expect(publisher.emitOrderStatusChanged).toHaveBeenCalledTimes(1);
  });
});

// ─── StartProductionOrderUseCase ─────────────────────────────────────────────

describe('StartProductionOrderUseCase', () => {
  const PLANNED_ORDER = { ...MOCK_ORDER, status: OrderStatusEnum.PLANNED };

  it('transitions PLANNED → IN_PRODUCTION', async () => {
    const module = await buildModule({
      findById: jest
        .fn()
        .mockResolvedValueOnce(PLANNED_ORDER)
        .mockResolvedValueOnce({
          ...PLANNED_ORDER,
          status: OrderStatusEnum.IN_PRODUCTION,
        }),
    });
    const useCase = module.get(StartProductionOrderUseCase);
    const result = await useCase.execute('1', MOCK_ACTOR);
    expect(result.status).toBe(OrderStatusEnum.IN_PRODUCTION);
  });

  it('throws BadRequest when not in PLANNED', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(MOCK_ORDER), // DRAFT
    });
    const useCase = module.get(StartProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequest when parts are not fully released', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(PLANNED_ORDER),
      countNonReleasedParts: jest.fn().mockResolvedValue(2),
    });
    const useCase = module.get(StartProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── CompleteProductionOrderUseCase ──────────────────────────────────────────

describe('CompleteProductionOrderUseCase', () => {
  const IN_PROD_ORDER = {
    ...MOCK_ORDER,
    status: OrderStatusEnum.IN_PRODUCTION,
  };

  it('transitions IN_PRODUCTION → PRODUCTION_COMPLETE', async () => {
    const module = await buildModule({
      findById: jest
        .fn()
        .mockResolvedValueOnce(IN_PROD_ORDER)
        .mockResolvedValueOnce({
          ...IN_PROD_ORDER,
          status: OrderStatusEnum.PRODUCTION_COMPLETE,
        }),
    });
    const useCase = module.get(CompleteProductionOrderUseCase);
    const result = await useCase.execute('1', MOCK_ACTOR);
    expect(result.status).toBe(OrderStatusEnum.PRODUCTION_COMPLETE);
  });

  it('throws BadRequest when not in IN_PRODUCTION', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(PLANNED_ORDER),
    });
    const useCase = module.get(CompleteProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequest when no stage logs exist', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(IN_PROD_ORDER),
      countStageLogs: jest.fn().mockResolvedValue(0),
    });
    const useCase = module.get(CompleteProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequest when stages are not all COMPLETE', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(IN_PROD_ORDER),
      countNonCompleteStages: jest.fn().mockResolvedValue(2),
    });
    const useCase = module.get(CompleteProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });
});

const PLANNED_ORDER = { ...MOCK_ORDER, status: OrderStatusEnum.PLANNED };

// ─── CloseProductionOrderUseCase ─────────────────────────────────────────────

describe('CloseProductionOrderUseCase', () => {
  const COMPLETE_ORDER = {
    ...MOCK_ORDER,
    status: OrderStatusEnum.PRODUCTION_COMPLETE,
  };

  it('transitions PRODUCTION_COMPLETE → CLOSED', async () => {
    const module = await buildModule({
      findById: jest
        .fn()
        .mockResolvedValueOnce(COMPLETE_ORDER)
        .mockResolvedValueOnce({
          ...COMPLETE_ORDER,
          status: OrderStatusEnum.CLOSED,
        }),
    });
    const useCase = module.get(CloseProductionOrderUseCase);
    const result = await useCase.execute('1', MOCK_ACTOR);
    expect(result.status).toBe(OrderStatusEnum.CLOSED);
  });

  it('throws BadRequest when not in PRODUCTION_COMPLETE', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(MOCK_ORDER), // DRAFT
    });
    const useCase = module.get(CloseProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequest when packing is not posted', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(COMPLETE_ORDER),
      isPackingPosted: jest.fn().mockResolvedValue(false),
    });
    const useCase = module.get(CloseProductionOrderUseCase);
    await expect(useCase.execute('1', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── GetProductionOrderUseCase ───────────────────────────────────────────────

describe('GetProductionOrderUseCase', () => {
  it('returns order DTO when found', async () => {
    const module = await buildModule();
    const useCase = module.get(GetProductionOrderUseCase);
    const result = await useCase.execute('1');
    expect(result.order_id).toBe('1');
    expect(result.parts).toHaveLength(1);
  });

  it('throws NotFoundException when not found', async () => {
    const module = await buildModule({
      findById: jest.fn().mockResolvedValue(null),
    });
    const useCase = module.get(GetProductionOrderUseCase);
    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});

// ─── ListProductionOrdersUseCase ─────────────────────────────────────────────

describe('ListProductionOrdersUseCase', () => {
  it('returns paginated summary list', async () => {
    const module = await buildModule();
    const useCase = module.get(ListProductionOrdersUseCase);
    const result = await useCase.execute({}, 1, 20);
    expect(result.items).toHaveLength(1);
    expect(result.meta.page).toBe(1);
    expect(result.items[0].order_id).toBe('1');
  });

  it('passes status filter to repository', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValue({ items: [], meta: MOCK_PAGINATION_META });
    const module = await buildModule({ findMany });
    const useCase = module.get(ListProductionOrdersUseCase);
    await useCase.execute({ status: OrderStatusEnum.PLANNED }, 1, 20);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatusEnum.PLANNED }),
      1,
      20,
    );
  });
});
