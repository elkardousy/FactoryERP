import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatusEnum, PackingOrderStatusEnum } from '@prisma/client';

import { ProductionOrdersRepository } from '../repositories/production-orders.repository';
import { ProductionPackingRepository } from '../repositories/production-packing.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { DocumentNumberingService } from '../../../core/document-numbering/document-numbering.service';
import { AuditService } from '../../../core/audit/audit.service';
import { LoggerService } from '../../../core/logger/logger.service';

import { CreatePackingOrderUseCase } from './create-packing-order/create-packing-order.use-case';
import { AddAssemblyUseCase } from './add-assembly/add-assembly.use-case';
import { VerifyPackingUseCase } from './verify-packing/verify-packing.use-case';
import { PostPackingOrderUseCase } from './post-packing-order/post-packing-order.use-case';
import { GetPackingOrderUseCase } from './get-packing-order/get-packing-order.use-case';
import { ListPackingOrdersUseCase } from './list-packing-orders/list-packing-orders.use-case';
import { GetPackingHistoryUseCase } from './get-packing-history/get-packing-history.use-case';
import { GetPackingSummaryUseCase } from './get-packing-summary/get-packing-summary.use-case';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_PRODUCTION_ORDER = {
  order_id: BigInt(1),
  order_number: 'PO-2026-0001',
  model_id: BigInt(10),
  line_id: BigInt(2),
  status: OrderStatusEnum.PRODUCTION_COMPLETE,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  production_order_parts: [],
};

const MOCK_PATTERN = {
  pattern_id: BigInt(5),
  model_id: BigInt(10),
  pattern_name: 'Standard Pattern',
  is_active: true,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  packing_pattern_lines: [],
};

const MOCK_PACKING_ORDER = {
  packing_order_id: BigInt(20),
  packing_order_no: 'PKG-2026-0001',
  production_order_id: BigInt(1),
  pattern_id: BigInt(5),
  target_dozens: 100,
  assembled_dozens: 0,
  verified_dozens: null,
  status: PackingOrderStatusEnum.DRAFT,
  notes: null,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  started_by: null,
  started_at: null,
  verified_by: null,
  verified_at: null,
  posted_by: null,
  posted_at: null,
  packing_verifications: [] as never[],
};

const MOCK_IN_PROCESS_ORDER = {
  ...MOCK_PACKING_ORDER,
  status: PackingOrderStatusEnum.IN_PROCESS,
  started_by: BigInt(99),
  started_at: new Date('2026-06-30T10:00:00.000Z'),
};

const MOCK_VERIFICATION = {
  verification_id: BigInt(30),
  packing_order_id: BigInt(20),
  system_dozens: 100,
  physical_count_dozens: 100,
  variance_dozens: null,
  variance_accepted: true,
  variance_notes: null,
  verified_by: BigInt(99),
  verified_at: new Date('2026-06-30T11:00:00.000Z'),
};

const MOCK_VERIFIED_ORDER = {
  ...MOCK_PACKING_ORDER,
  status: PackingOrderStatusEnum.VERIFIED,
  assembled_dozens: 100,
  verified_by: BigInt(99),
  verified_at: new Date('2026-06-30T11:00:00.000Z'),
  packing_verifications: [MOCK_VERIFICATION],
};

const MOCK_POSTED_ORDER = {
  ...MOCK_VERIFIED_ORDER,
  status: PackingOrderStatusEnum.POSTED,
  posted_by: BigInt(99),
  posted_at: new Date('2026-06-30T12:00:00.000Z'),
};

const MOCK_ASSEMBLY_RESULT = {
  assemblyId: BigInt(50),
  assemblySequence: 1,
  dozensAssembled: 10,
  updatedAssembledDozens: 10,
};

const MOCK_ACTOR = {
  sub: BigInt(99),
  role: 'ADMIN',
  email: 'actor@test.com',
};

// ─── Module Builder ───────────────────────────────────────────────────────────

function buildModule(
  overrides: {
    ordersRepo?: Record<string, unknown>;
    packingRepo?: Record<string, unknown>;
    publisher?: Record<string, unknown>;
    docNumbering?: Record<string, unknown>;
  } = {},
) {
  const ordersRepo: jest.Mocked<Partial<ProductionOrdersRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_PRODUCTION_ORDER),
    ...overrides.ordersRepo,
  };

  const packingRepo: jest.Mocked<Partial<ProductionPackingRepository>> = {
    findPackingOrderById: jest.fn().mockResolvedValue(MOCK_PACKING_ORDER),
    findPackingOrderByProductionOrderId: jest.fn().mockResolvedValue(null),
    findPackingOrders: jest.fn().mockResolvedValue([MOCK_PACKING_ORDER]),
    findPackingOrdersPage: jest
      .fn()
      .mockResolvedValue({ items: [MOCK_PACKING_ORDER], total: 1 }),
    findActivePatternForModel: jest.fn().mockResolvedValue(MOCK_PATTERN),
    sumAvailableDozensByOrder: jest.fn().mockResolvedValue(100),
    createPackingOrder: jest.fn().mockResolvedValue(MOCK_PACKING_ORDER),
    addAssembly: jest.fn().mockResolvedValue(MOCK_ASSEMBLY_RESULT),
    verifyPackingOrder: jest.fn().mockResolvedValue(MOCK_VERIFIED_ORDER),
    postPackingOrder: jest.fn().mockResolvedValue(MOCK_POSTED_ORDER),
    ...overrides.packingRepo,
  };

  const publisher: jest.Mocked<Partial<ProductionEventPublisher>> = {
    emitPackingOrderCreated: jest.fn(),
    emitPackingAssemblyAdded: jest.fn(),
    emitPackingVerified: jest.fn(),
    emitPackingPosted: jest.fn(),
    ...overrides.publisher,
  };

  const docNumbering: jest.Mocked<Partial<DocumentNumberingService>> = {
    generate: jest.fn().mockResolvedValue('PKG-2026-0001'),
    ...overrides.docNumbering,
  };

  return Test.createTestingModule({
    providers: [
      CreatePackingOrderUseCase,
      AddAssemblyUseCase,
      VerifyPackingUseCase,
      PostPackingOrderUseCase,
      GetPackingOrderUseCase,
      ListPackingOrdersUseCase,
      GetPackingHistoryUseCase,
      GetPackingSummaryUseCase,
      { provide: ProductionOrdersRepository, useValue: ordersRepo },
      { provide: ProductionPackingRepository, useValue: packingRepo },
      { provide: ProductionEventPublisher, useValue: publisher },
      { provide: DocumentNumberingService, useValue: docNumbering },
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

// ─── CreatePackingOrderUseCase ────────────────────────────────────────────────

describe('CreatePackingOrderUseCase', () => {
  const dto = { production_order_id: '1' };

  it('creates a packing order in DRAFT status', async () => {
    const module = await buildModule();
    const useCase = module.get(CreatePackingOrderUseCase);
    const publisher = module.get(ProductionEventPublisher);

    const result = await useCase.execute(dto, MOCK_ACTOR as never);

    expect(result.packing_order_id).toBe('20');
    expect(result.packing_order_no).toBe('PKG-2026-0001');
    expect(result.status).toBe(PackingOrderStatusEnum.DRAFT);
    expect(publisher.emitPackingOrderCreated).toHaveBeenCalledWith(
      expect.objectContaining({ productionOrderId: '1', patternId: '5' }),
    );
  });

  it('throws NotFoundException when production order not found', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(CreatePackingOrderUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when production order is not PRODUCTION_COMPLETE', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest.fn().mockResolvedValue({
          ...MOCK_PRODUCTION_ORDER,
          status: OrderStatusEnum.IN_PRODUCTION,
        }),
      },
    });
    const useCase = module.get(CreatePackingOrderUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws ConflictException when packing order already exists for the production order', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderByProductionOrderId: jest
          .fn()
          .mockResolvedValue(MOCK_PACKING_ORDER),
        findActivePatternForModel: jest.fn().mockResolvedValue(MOCK_PATTERN),
        sumAvailableDozensByOrder: jest.fn().mockResolvedValue(100),
        createPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(CreatePackingOrderUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws BadRequestException when no active packing pattern found (BR-P01)', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderByProductionOrderId: jest.fn().mockResolvedValue(null),
        findActivePatternForModel: jest.fn().mockResolvedValue(null),
        sumAvailableDozensByOrder: jest.fn().mockResolvedValue(100),
        createPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(CreatePackingOrderUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when no QO available (BR-Q04)', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderByProductionOrderId: jest.fn().mockResolvedValue(null),
        findActivePatternForModel: jest.fn().mockResolvedValue(MOCK_PATTERN),
        sumAvailableDozensByOrder: jest.fn().mockResolvedValue(0),
        createPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(CreatePackingOrderUseCase);
    await expect(useCase.execute(dto, MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── AddAssemblyUseCase ───────────────────────────────────────────────────────

describe('AddAssemblyUseCase', () => {
  const assemblyDto = {
    lines: [
      {
        quality_box_id: '7',
        color_id: '3',
        size_id: '4',
        pattern_line_id: '5',
        pieces_consumed: 120,
      },
    ],
  };

  it('adds an assembly and returns updated packing order', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest
          .fn()
          .mockResolvedValueOnce(MOCK_IN_PROCESS_ORDER) // initial load
          .mockResolvedValueOnce({
            ...MOCK_IN_PROCESS_ORDER,
            assembled_dozens: 10,
          }), // after update
        addAssembly: jest.fn().mockResolvedValue(MOCK_ASSEMBLY_RESULT),
      },
    });
    const useCase = module.get(AddAssemblyUseCase);
    const publisher = module.get(ProductionEventPublisher);

    const result = await useCase.execute(
      '20',
      assemblyDto,
      MOCK_ACTOR as never,
    );

    expect(result.packing_order_id).toBe('20');
    expect(publisher.emitPackingAssemblyAdded).toHaveBeenCalledWith(
      expect.objectContaining({ packingOrderId: '20', assemblySequence: 1 }),
    );
  });

  it('throws NotFoundException when packing order not found', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(null),
        addAssembly: jest.fn(),
      },
    });
    const useCase = module.get(AddAssemblyUseCase);
    await expect(
      useCase.execute('20', assemblyDto, MOCK_ACTOR as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when packing order is POSTED', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(MOCK_POSTED_ORDER),
        addAssembly: jest.fn(),
      },
    });
    const useCase = module.get(AddAssemblyUseCase);
    await expect(
      useCase.execute('20', assemblyDto, MOCK_ACTOR as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when no lines provided', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest
          .fn()
          .mockResolvedValue(MOCK_IN_PROCESS_ORDER),
        addAssembly: jest.fn(),
      },
    });
    const useCase = module.get(AddAssemblyUseCase);
    await expect(
      useCase.execute('20', { lines: [] }, MOCK_ACTOR as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('propagates BadRequestException from repository (insufficient QO)', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest
          .fn()
          .mockResolvedValue(MOCK_IN_PROCESS_ORDER),
        addAssembly: jest
          .fn()
          .mockRejectedValue(
            new BadRequestException(
              'Insufficient dozens in quality output box',
            ),
          ),
      },
    });
    const useCase = module.get(AddAssemblyUseCase);
    await expect(
      useCase.execute('20', assemblyDto, MOCK_ACTOR as never),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── VerifyPackingUseCase ─────────────────────────────────────────────────────

describe('VerifyPackingUseCase', () => {
  const verifyDto = { physical_count_dozens: 98 };

  it('verifies packing order and transitions to VERIFIED', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest
          .fn()
          .mockResolvedValue(MOCK_IN_PROCESS_ORDER),
        verifyPackingOrder: jest.fn().mockResolvedValue(MOCK_VERIFIED_ORDER),
      },
    });
    const useCase = module.get(VerifyPackingUseCase);
    const publisher = module.get(ProductionEventPublisher);

    const result = await useCase.execute('20', verifyDto, MOCK_ACTOR as never);

    expect(result.status).toBe(PackingOrderStatusEnum.VERIFIED);
    expect(result.verification).not.toBeNull();
    expect(result.verification!.variance_accepted).toBe(true);
    expect(publisher.emitPackingVerified).toHaveBeenCalledWith(
      expect.objectContaining({ packingOrderId: '20', varianceAccepted: true }),
    );
  });

  it('throws NotFoundException when packing order not found', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(null),
        verifyPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(VerifyPackingUseCase);
    await expect(
      useCase.execute('20', verifyDto, MOCK_ACTOR as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when packing order is already VERIFIED', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(MOCK_VERIFIED_ORDER),
        verifyPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(VerifyPackingUseCase);
    await expect(
      useCase.execute('20', verifyDto, MOCK_ACTOR as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when packing order is POSTED', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(MOCK_POSTED_ORDER),
        verifyPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(VerifyPackingUseCase);
    await expect(
      useCase.execute('20', verifyDto, MOCK_ACTOR as never),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── PostPackingOrderUseCase ──────────────────────────────────────────────────

describe('PostPackingOrderUseCase', () => {
  it('posts a verified packing order and creates PACKING transaction', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(MOCK_VERIFIED_ORDER),
        postPackingOrder: jest.fn().mockResolvedValue(MOCK_POSTED_ORDER),
      },
    });
    const useCase = module.get(PostPackingOrderUseCase);
    const publisher = module.get(ProductionEventPublisher);

    const result = await useCase.execute('20', MOCK_ACTOR as never);

    expect(result.status).toBe(PackingOrderStatusEnum.POSTED);
    expect(result.posted_by).toBe('99');
    expect(publisher.emitPackingPosted).toHaveBeenCalledWith(
      expect.objectContaining({ packingOrderId: '20' }),
    );
  });

  it('throws NotFoundException when packing order not found', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(null),
        postPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(PostPackingOrderUseCase);
    await expect(useCase.execute('20', MOCK_ACTOR as never)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when packing order is not VERIFIED', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest
          .fn()
          .mockResolvedValue(MOCK_IN_PROCESS_ORDER),
        postPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(PostPackingOrderUseCase);
    await expect(useCase.execute('20', MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when variance_accepted is false (BR-P05)', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue({
          ...MOCK_VERIFIED_ORDER,
          packing_verifications: [
            { ...MOCK_VERIFICATION, variance_accepted: false },
          ],
        }),
        postPackingOrder: jest.fn(),
      },
    });
    const useCase = module.get(PostPackingOrderUseCase);
    await expect(useCase.execute('20', MOCK_ACTOR as never)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── GetPackingOrderUseCase ───────────────────────────────────────────────────

describe('GetPackingOrderUseCase', () => {
  it('returns a packing order with verification', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(MOCK_VERIFIED_ORDER),
      },
    });
    const useCase = module.get(GetPackingOrderUseCase);
    const result = await useCase.execute('20');
    expect(result.packing_order_id).toBe('20');
    expect(result.status).toBe(PackingOrderStatusEnum.VERIFIED);
    expect(result.verification).not.toBeNull();
  });

  it('throws NotFoundException when not found', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderById: jest.fn().mockResolvedValue(null),
      },
    });
    const useCase = module.get(GetPackingOrderUseCase);
    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});

// ─── ListPackingOrdersUseCase ─────────────────────────────────────────────────

describe('ListPackingOrdersUseCase', () => {
  it('returns filtered list of packing orders', async () => {
    const module = await buildModule();
    const useCase = module.get(ListPackingOrdersUseCase);
    const result = await useCase.execute({ production_order_id: '1' });
    expect(result).toHaveLength(1);
    expect(result[0].production_order_id).toBe('1');
  });

  it('returns empty list when no packing orders match', async () => {
    const module = await buildModule({
      packingRepo: { findPackingOrders: jest.fn().mockResolvedValue([]) },
    });
    const useCase = module.get(ListPackingOrdersUseCase);
    const result = await useCase.execute({});
    expect(result).toHaveLength(0);
  });
});

// ─── GetPackingHistoryUseCase ─────────────────────────────────────────────────

describe('GetPackingHistoryUseCase', () => {
  it('returns paginated packing order history', async () => {
    const module = await buildModule();
    const useCase = module.get(GetPackingHistoryUseCase);
    const result = await useCase.execute({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.meta.page).toBe(1);
    expect(result.meta.total).toBe(1);
  });

  it('caps limit at 100', async () => {
    const orders = Array.from({ length: 50 }, (_, i) => ({
      ...MOCK_PACKING_ORDER,
      packing_order_id: BigInt(i + 1),
    }));
    const module = await buildModule({
      packingRepo: {
        findPackingOrdersPage: jest
          .fn()
          .mockResolvedValue({ items: orders, total: 500 }),
      },
    });
    const useCase = module.get(GetPackingHistoryUseCase);
    const result = await useCase.execute({ page: 1, limit: 999 });
    expect(result.meta.limit).toBe(100);
  });
});

// ─── GetPackingSummaryUseCase ─────────────────────────────────────────────────

describe('GetPackingSummaryUseCase', () => {
  it('returns packing summary for a production order', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderByProductionOrderId: jest
          .fn()
          .mockResolvedValue(MOCK_VERIFIED_ORDER),
        findPackingOrderById: jest.fn().mockResolvedValue(MOCK_VERIFIED_ORDER),
      },
    });
    const useCase = module.get(GetPackingSummaryUseCase);
    const result = await useCase.execute({ production_order_id: '1' });
    expect(result.packing_order_id).toBe('20');
    expect(result.status).toBe(PackingOrderStatusEnum.VERIFIED);
    expect(result.verification).not.toBeNull();
    expect(result.verification!.variance_accepted).toBe(true);
  });

  it('throws NotFoundException when no packing order exists for production order', async () => {
    const module = await buildModule({
      packingRepo: {
        findPackingOrderByProductionOrderId: jest.fn().mockResolvedValue(null),
        findPackingOrderById: jest.fn(),
      },
    });
    const useCase = module.get(GetPackingSummaryUseCase);
    await expect(
      useCase.execute({ production_order_id: '999' }),
    ).rejects.toThrow(NotFoundException);
  });
});
