import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PackingOrderStatusEnum } from '@prisma/client';
import { ProductionFinishedGoodsRepository } from '../repositories/production-finished-goods.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { AuditService } from '../../../core/audit/audit.service';
import { CreateFinishedGoodsUseCase } from './create-finished-goods/create-finished-goods.use-case';
import { GetFinishedGoodsUseCase } from './get-finished-goods/get-finished-goods.use-case';
import { ListFinishedGoodsUseCase } from './list-finished-goods/list-finished-goods.use-case';
import { GetFinishedGoodsHistoryUseCase } from './get-finished-goods-history/get-finished-goods-history.use-case';
import { GetFinishedGoodsSummaryUseCase } from './get-finished-goods-summary/get-finished-goods-summary.use-case';
import { FinishedGoodsDashboardUseCase } from './finished-goods-dashboard/finished-goods-dashboard.use-case';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_PACKING_STATUS_POSTED = {
  packing_order_id: BigInt(20),
  status: PackingOrderStatusEnum.POSTED,
};
const MOCK_PACKING_STATUS_DRAFT = {
  packing_order_id: BigInt(20),
  status: PackingOrderStatusEnum.DRAFT,
};
const MOCK_PRODUCTION_ORDER = {
  order_id: BigInt(1),
  model_id: BigInt(10),
  cmo_line_id: null as bigint | null,
};
const MOCK_PACKING_WITH_PRODUCTION_PARTIAL = {
  packing_order_id: BigInt(20),
  production_order_id: BigInt(1),
  assembled_dozens: 5.0,
  status: PackingOrderStatusEnum.POSTED,
  production_orders: { ...MOCK_PRODUCTION_ORDER, cmo_line_id: null },
};
const MOCK_PACKING_WITH_PRODUCTION_FULL = {
  ...MOCK_PACKING_WITH_PRODUCTION_PARTIAL,
  production_orders: { ...MOCK_PRODUCTION_ORDER, cmo_line_id: BigInt(99) },
};
const MOCK_CUSTOMER = { customer_id: BigInt(7) };
const MOCK_WAREHOUSE = { warehouse_id: BigInt(3) };
const MOCK_FG_BAG = {
  fg_bag_id: BigInt(100),
  model_id: BigInt(10),
  customer_id: BigInt(7),
  warehouse_id: BigInt(3),
  dozens_qty: 5.0,
  cmo_line_id: null as bigint | null,
  session_id: null as bigint | null,
  created_at: new Date('2026-06-30T10:00:00Z'),
};

const MOCK_ACTOR = { sub: BigInt(1) } as any;

// ─── Module builder ───────────────────────────────────────────────────────────

async function buildModule() {
  const mockFGRepo = {
    findPackingOrderStatusById: jest.fn(),
    findPackingOrderWithProduction: jest.fn(),
    findCMOCustomerId: jest.fn(),
    findCustomerById: jest.fn(),
    findWarehouseById: jest.fn(),
    createFGBag: jest.fn(),
    findFGBagById: jest.fn(),
    findFGBags: jest.fn(),
    findFGBagsPage: jest.fn(),
    findFGBagsByModelId: jest.fn(),
    getDashboardAggregates: jest.fn(),
  };
  const mockPublisher = {
    emitFinishedGoodsCreated: jest.fn(),
    emitFinishedGoodsSummaryUpdated: jest.fn(),
  };
  const mockAudit = { log: jest.fn() };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateFinishedGoodsUseCase,
      GetFinishedGoodsUseCase,
      ListFinishedGoodsUseCase,
      GetFinishedGoodsHistoryUseCase,
      GetFinishedGoodsSummaryUseCase,
      FinishedGoodsDashboardUseCase,
      { provide: ProductionFinishedGoodsRepository, useValue: mockFGRepo },
      { provide: ProductionEventPublisher, useValue: mockPublisher },
      { provide: AuditService, useValue: mockAudit },
    ],
  }).compile();

  return {
    module,
    mockFGRepo,
    mockPublisher,
    mockAudit,
    createUC: module.get(CreateFinishedGoodsUseCase),
    getUC: module.get(GetFinishedGoodsUseCase),
    listUC: module.get(ListFinishedGoodsUseCase),
    historyUC: module.get(GetFinishedGoodsHistoryUseCase),
    summaryUC: module.get(GetFinishedGoodsSummaryUseCase),
    dashboardUC: module.get(FinishedGoodsDashboardUseCase),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateFinishedGoodsUseCase', () => {
  it('creates FG bag for PARTIAL order (caller provides customer_id)', async () => {
    const { createUC, mockFGRepo, mockPublisher, mockAudit } =
      await buildModule();
    mockFGRepo.findPackingOrderStatusById.mockResolvedValue(
      MOCK_PACKING_STATUS_POSTED,
    );
    mockFGRepo.findPackingOrderWithProduction.mockResolvedValue(
      MOCK_PACKING_WITH_PRODUCTION_PARTIAL,
    );
    mockFGRepo.findCustomerById.mockResolvedValue(MOCK_CUSTOMER);
    mockFGRepo.findWarehouseById.mockResolvedValue(MOCK_WAREHOUSE);
    mockFGRepo.createFGBag.mockResolvedValue(MOCK_FG_BAG);

    const result = await createUC.execute(
      { packing_order_id: '20', customer_id: '7', warehouse_id: '3' },
      MOCK_ACTOR,
    );

    expect(result.fg_bag_id).toBe('100');
    expect(result.dozens_qty).toBe(5.0);
    expect(mockPublisher.emitFinishedGoodsCreated).toHaveBeenCalledTimes(1);
    expect(mockPublisher.emitFinishedGoodsSummaryUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(mockAudit.log).toHaveBeenCalledTimes(1);
  });

  it('creates FG bag for FULL order using CMO customer_id', async () => {
    const { createUC, mockFGRepo } = await buildModule();
    const bagWithCMO = { ...MOCK_FG_BAG, cmo_line_id: BigInt(99) };
    mockFGRepo.findPackingOrderStatusById.mockResolvedValue(
      MOCK_PACKING_STATUS_POSTED,
    );
    mockFGRepo.findPackingOrderWithProduction.mockResolvedValue(
      MOCK_PACKING_WITH_PRODUCTION_FULL,
    );
    mockFGRepo.findCMOCustomerId.mockResolvedValue(BigInt(7));
    mockFGRepo.findWarehouseById.mockResolvedValue(MOCK_WAREHOUSE);
    mockFGRepo.createFGBag.mockResolvedValue(bagWithCMO);

    const result = await createUC.execute(
      { packing_order_id: '20', customer_id: '999', warehouse_id: '3' },
      MOCK_ACTOR,
    );

    // customer_id from CMO chain (BigInt(7)), not from dto (999)
    expect(result.fg_bag_id).toBe('100');
    expect(mockFGRepo.findCMOCustomerId).toHaveBeenCalledWith(BigInt(99));
    expect(mockFGRepo.findCustomerById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when packing order not found', async () => {
    const { createUC, mockFGRepo } = await buildModule();
    mockFGRepo.findPackingOrderStatusById.mockResolvedValue(null);

    await expect(
      createUC.execute(
        { packing_order_id: '999', customer_id: '7', warehouse_id: '3' },
        MOCK_ACTOR,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when packing order is not POSTED', async () => {
    const { createUC, mockFGRepo } = await buildModule();
    mockFGRepo.findPackingOrderStatusById.mockResolvedValue(
      MOCK_PACKING_STATUS_DRAFT,
    );

    await expect(
      createUC.execute(
        { packing_order_id: '20', customer_id: '7', warehouse_id: '3' },
        MOCK_ACTOR,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when customer not found (PARTIAL order)', async () => {
    const { createUC, mockFGRepo } = await buildModule();
    mockFGRepo.findPackingOrderStatusById.mockResolvedValue(
      MOCK_PACKING_STATUS_POSTED,
    );
    mockFGRepo.findPackingOrderWithProduction.mockResolvedValue(
      MOCK_PACKING_WITH_PRODUCTION_PARTIAL,
    );
    mockFGRepo.findCustomerById.mockResolvedValue(null);
    mockFGRepo.findWarehouseById.mockResolvedValue(MOCK_WAREHOUSE);

    await expect(
      createUC.execute(
        { packing_order_id: '20', customer_id: '999', warehouse_id: '3' },
        MOCK_ACTOR,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when warehouse not found', async () => {
    const { createUC, mockFGRepo } = await buildModule();
    mockFGRepo.findPackingOrderStatusById.mockResolvedValue(
      MOCK_PACKING_STATUS_POSTED,
    );
    mockFGRepo.findPackingOrderWithProduction.mockResolvedValue(
      MOCK_PACKING_WITH_PRODUCTION_PARTIAL,
    );
    mockFGRepo.findCustomerById.mockResolvedValue(MOCK_CUSTOMER);
    mockFGRepo.findWarehouseById.mockResolvedValue(null);

    await expect(
      createUC.execute(
        { packing_order_id: '20', customer_id: '7', warehouse_id: '999' },
        MOCK_ACTOR,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when PARTIAL order has no customer_id in dto', async () => {
    const { createUC, mockFGRepo } = await buildModule();
    mockFGRepo.findPackingOrderStatusById.mockResolvedValue(
      MOCK_PACKING_STATUS_POSTED,
    );
    mockFGRepo.findPackingOrderWithProduction.mockResolvedValue(
      MOCK_PACKING_WITH_PRODUCTION_PARTIAL,
    );

    await expect(
      createUC.execute(
        { packing_order_id: '20', customer_id: '', warehouse_id: '3' },
        MOCK_ACTOR,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('GetFinishedGoodsUseCase', () => {
  it('returns mapped FG bag by id', async () => {
    const { getUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBagById.mockResolvedValue(MOCK_FG_BAG);

    const result = await getUC.execute('100');
    expect(result.fg_bag_id).toBe('100');
    expect(result.model_id).toBe('10');
  });

  it('throws NotFoundException when bag not found', async () => {
    const { getUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBagById.mockResolvedValue(null);

    await expect(getUC.execute('999')).rejects.toThrow(NotFoundException);
  });
});

describe('ListFinishedGoodsUseCase', () => {
  it('returns filtered list of FG bags', async () => {
    const { listUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBags.mockResolvedValue([MOCK_FG_BAG]);

    const result = await listUC.execute({ model_id: '10' });
    expect(result).toHaveLength(1);
    expect(result[0].model_id).toBe('10');
    expect(mockFGRepo.findFGBags).toHaveBeenCalledWith(
      expect.objectContaining({ model_id: BigInt(10) }),
    );
  });

  it('returns empty array when no bags match', async () => {
    const { listUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBags.mockResolvedValue([]);

    const result = await listUC.execute({});
    expect(result).toHaveLength(0);
  });
});

describe('GetFinishedGoodsHistoryUseCase', () => {
  it('returns paginated FG history', async () => {
    const { historyUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBagsPage.mockResolvedValue({
      items: [MOCK_FG_BAG],
      total: 1,
    });

    const result = await historyUC.execute({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('caps limit at 100', async () => {
    const { historyUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBagsPage.mockResolvedValue({ items: [], total: 0 });

    await historyUC.execute({ page: 1, limit: 500 });
    expect(mockFGRepo.findFGBagsPage).toHaveBeenCalledWith(1, 100);
  });
});

describe('GetFinishedGoodsSummaryUseCase', () => {
  it('returns summary aggregated by model_id', async () => {
    const { summaryUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBagsByModelId.mockResolvedValue([
      MOCK_FG_BAG,
      MOCK_FG_BAG,
    ]);

    const result = await summaryUC.execute({ model_id: '10' });
    expect(result.model_id).toBe('10');
    expect(result.total_bags).toBe(2);
    expect(result.total_dozens).toBe(10.0);
    expect(result.bags).toHaveLength(2);
  });

  it('returns zero totals when no bags exist for model', async () => {
    const { summaryUC, mockFGRepo } = await buildModule();
    mockFGRepo.findFGBagsByModelId.mockResolvedValue([]);

    const result = await summaryUC.execute({ model_id: '99' });
    expect(result.total_bags).toBe(0);
    expect(result.total_dozens).toBe(0);
    expect(result.bags).toHaveLength(0);
  });
});

describe('FinishedGoodsDashboardUseCase', () => {
  it('returns dashboard aggregates', async () => {
    const { dashboardUC, mockFGRepo } = await buildModule();
    const dashboardData = {
      total_bags: 5,
      total_dozens: 25.0,
      by_model: [{ model_id: '10', bag_count: 5, total_dozens: 25.0 }],
      by_customer: [{ customer_id: '7', bag_count: 5, total_dozens: 25.0 }],
    };
    mockFGRepo.getDashboardAggregates.mockResolvedValue(dashboardData);

    const result = await dashboardUC.execute();
    expect(result.total_bags).toBe(5);
    expect(result.total_dozens).toBe(25.0);
    expect(result.by_model).toHaveLength(1);
    expect(result.by_customer).toHaveLength(1);
  });

  it('returns zero totals on empty FG register', async () => {
    const { dashboardUC, mockFGRepo } = await buildModule();
    mockFGRepo.getDashboardAggregates.mockResolvedValue({
      total_bags: 0,
      total_dozens: 0,
      by_model: [],
      by_customer: [],
    });

    const result = await dashboardUC.execute();
    expect(result.total_bags).toBe(0);
    expect(result.by_model).toHaveLength(0);
  });
});
