import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { InventoryBalanceService } from '../services/inventory-balance.service';
import { InventoryBagsRepository } from '../repositories/inventory-bags.repository';
import { LoggerService } from '../../../core/logger/logger.service';

import { GetWarehouseBalanceSummaryUseCase } from './get-warehouse-balance-summary/get-warehouse-balance-summary.use-case';
import { GetModelBalanceSummaryUseCase } from './get-model-balance-summary/get-model-balance-summary.use-case';
import { GetBalanceSnapshotUseCase } from './get-balance-snapshot/get-balance-snapshot.use-case';

import { GetWarehouseBalanceSummaryQuery } from './get-warehouse-balance-summary/queries/get-warehouse-balance-summary.query';
import { GetModelBalanceSummaryQuery } from './get-model-balance-summary/queries/get-model-balance-summary.query';
import { GetBalanceSnapshotQuery } from './get-balance-snapshot/queries/get-balance-snapshot.query';

import { WarehouseBalanceSummaryDto } from '../dto/warehouse-balance-summary.dto';
import { ModelBalanceSummaryDto } from '../dto/model-balance-summary.dto';
import { BalanceSnapshotDto } from '../dto/balance-snapshot.dto';

const MOCK_LEDGER_ROW_A = {
  bag_id: BigInt(100),
  warehouse_id: BigInt(5),
  model_id: BigInt(2),
  part_id: BigInt(3),
  dozens_on_hand: { toString: () => '30.000' } as any,
  version: BigInt(1),
  last_updated: new Date('2026-06-15T08:00:00.000Z'),
};

const MOCK_LEDGER_ROW_B = {
  bag_id: BigInt(101),
  warehouse_id: BigInt(5),
  model_id: BigInt(2),
  part_id: BigInt(4),
  dozens_on_hand: { toString: () => '20.000' } as any,
  version: BigInt(2),
  last_updated: new Date('2026-06-16T09:00:00.000Z'),
};

const MOCK_LEDGER_ROW_W2 = {
  bag_id: BigInt(102),
  warehouse_id: BigInt(6),
  model_id: BigInt(2),
  part_id: BigInt(3),
  dozens_on_hand: { toString: () => '10.000' } as any,
  version: BigInt(1),
  last_updated: new Date('2026-06-14T07:00:00.000Z'),
};

function buildModule(overrides: Record<string, any> = {}) {
  const inventoryBagsRepo: jest.Mocked<Partial<InventoryBagsRepository>> = {
    findAllByWarehouse: jest
      .fn()
      .mockResolvedValue([MOCK_LEDGER_ROW_A, MOCK_LEDGER_ROW_B]),
    findAllByModel: jest
      .fn()
      .mockResolvedValue([
        MOCK_LEDGER_ROW_A,
        MOCK_LEDGER_ROW_B,
        MOCK_LEDGER_ROW_W2,
      ]),
    findByKey: jest.fn().mockResolvedValue(MOCK_LEDGER_ROW_A),
    ...overrides.inventoryBagsRepo,
  };

  const logger: jest.Mocked<Partial<LoggerService>> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return Test.createTestingModule({
    providers: [
      InventoryBalanceService,
      GetWarehouseBalanceSummaryUseCase,
      GetModelBalanceSummaryUseCase,
      GetBalanceSnapshotUseCase,
      { provide: InventoryBagsRepository, useValue: inventoryBagsRepo },
      { provide: LoggerService, useValue: logger },
    ],
  }).compile();
}

describe('Balance Use Cases', () => {
  describe('GetWarehouseBalanceSummaryUseCase', () => {
    let useCase: GetWarehouseBalanceSummaryUseCase;
    let inventoryBagsRepo: jest.Mocked<Partial<InventoryBagsRepository>>;

    beforeEach(async () => {
      const app = await buildModule();
      useCase = app.get(GetWarehouseBalanceSummaryUseCase);
      inventoryBagsRepo = app.get(InventoryBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns aggregated balance summary for warehouse', async () => {
      const result = await useCase.execute(
        new GetWarehouseBalanceSummaryQuery(BigInt(5)),
      );

      expect(result).toBeInstanceOf(WarehouseBalanceSummaryDto);
      expect(result.warehouse_id).toBe('5');
      expect(result.sku_count).toBe(2);
      expect(result.total_on_hand_dozens).toBe('50.000');
    });

    it('returns zero total and zero sku_count for empty warehouse', async () => {
      (inventoryBagsRepo.findAllByWarehouse as jest.Mock).mockResolvedValue([]);
      const result = await useCase.execute(
        new GetWarehouseBalanceSummaryQuery(BigInt(99)),
      );
      expect(result.total_on_hand_dozens).toBe('0.000');
      expect(result.sku_count).toBe(0);
    });
  });

  describe('GetModelBalanceSummaryUseCase', () => {
    let useCase: GetModelBalanceSummaryUseCase;
    let inventoryBagsRepo: jest.Mocked<Partial<InventoryBagsRepository>>;

    beforeEach(async () => {
      const app = await buildModule();
      useCase = app.get(GetModelBalanceSummaryUseCase);
      inventoryBagsRepo = app.get(InventoryBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns aggregated balance summary for model across warehouses', async () => {
      const result = await useCase.execute(
        new GetModelBalanceSummaryQuery(BigInt(2)),
      );

      expect(result).toBeInstanceOf(ModelBalanceSummaryDto);
      expect(result.model_id).toBe('2');
      expect(result.sku_count).toBe(3);
      expect(result.warehouse_count).toBe(2);
      expect(result.total_on_hand_dozens).toBe('60.000');
    });

    it('returns zeros when model has no ledger entries', async () => {
      (inventoryBagsRepo.findAllByModel as jest.Mock).mockResolvedValue([]);
      const result = await useCase.execute(
        new GetModelBalanceSummaryQuery(BigInt(999)),
      );
      expect(result.total_on_hand_dozens).toBe('0.000');
      expect(result.sku_count).toBe(0);
      expect(result.warehouse_count).toBe(0);
    });
  });

  describe('GetBalanceSnapshotUseCase', () => {
    let useCase: GetBalanceSnapshotUseCase;
    let inventoryBagsRepo: jest.Mocked<Partial<InventoryBagsRepository>>;

    beforeEach(async () => {
      const app = await buildModule();
      useCase = app.get(GetBalanceSnapshotUseCase);
      inventoryBagsRepo = app.get(InventoryBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns ledger snapshot for a warehouse+model+part combination', async () => {
      const result = await useCase.execute(
        new GetBalanceSnapshotQuery(BigInt(5), BigInt(2), BigInt(3)),
      );

      expect(result).toBeInstanceOf(BalanceSnapshotDto);
      expect(result.bag_id).toBe('100');
      expect(result.warehouse_id).toBe('5');
      expect(result.model_id).toBe('2');
      expect(result.part_id).toBe('3');
      expect(result.on_hand_dozens).toBe('30.000');
      expect(result.version).toBe('1');
      expect(result.last_updated).toBe('2026-06-15T08:00:00.000Z');
    });

    it('throws NotFoundException when ledger entry does not exist', async () => {
      (inventoryBagsRepo.findByKey as jest.Mock).mockResolvedValue(null);
      await expect(
        useCase.execute(
          new GetBalanceSnapshotQuery(BigInt(1), BigInt(1), BigInt(1)),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
