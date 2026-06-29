import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { InventoryAvailabilityService } from '../services/inventory-availability.service';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from '../repositories/physical-bag-reservations.repository';
import { InventoryBagsRepository } from '../repositories/inventory-bags.repository';
import { LoggerService } from '../../../core/logger/logger.service';

import { GetBagAvailabilityUseCase } from './get-bag-availability/get-bag-availability.use-case';
import { GetWarehouseAvailabilityUseCase } from './get-warehouse-availability/get-warehouse-availability.use-case';
import { GetModelAvailabilityUseCase } from './get-model-availability/get-model-availability.use-case';

import { GetBagAvailabilityQuery } from './get-bag-availability/queries/get-bag-availability.query';
import { GetWarehouseAvailabilityQuery } from './get-warehouse-availability/queries/get-warehouse-availability.query';
import { GetModelAvailabilityQuery } from './get-model-availability/queries/get-model-availability.query';

import { BagAvailabilityDto } from '../dto/bag-availability.dto';
import { LedgerAvailabilityDto } from '../dto/ledger-availability.dto';

const MOCK_BAG = {
  bag_id: BigInt(10),
  bag_code: 'BAG-001',
  current_dozens: { toString: () => '20.000' } as any,
  status: 'AVAILABLE',
  container_id: BigInt(1),
  audit_item_id: BigInt(1),
  customer_id: BigInt(1),
  model_id: BigInt(2),
  part_id: BigInt(3),
  received_dozens: { toString: () => '20.000' } as any,
  current_warehouse_id: BigInt(5),
  current_order_id: null,
  received_date: new Date('2026-06-01'),
  created_by: BigInt(99),
  created_at: new Date('2026-06-01'),
  updated_at: new Date('2026-06-01'),
};

const MOCK_LEDGER_ROW = {
  bag_id: BigInt(100),
  warehouse_id: BigInt(5),
  model_id: BigInt(2),
  part_id: BigInt(3),
  dozens_on_hand: { toString: () => '50.000' } as any,
  version: BigInt(1),
  last_updated: new Date('2026-06-15T08:00:00.000Z'),
};

function buildModule(overrides: Record<string, any> = {}) {
  const bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_BAG),
    ...overrides.bagsRepo,
  };

  const reservationsRepo: jest.Mocked<
    Partial<PhysicalBagReservationsRepository>
  > = {
    sumActiveReservedDozens: jest.fn().mockResolvedValue(5),
    ...overrides.reservationsRepo,
  };

  const inventoryBagsRepo: jest.Mocked<Partial<InventoryBagsRepository>> = {
    findAllByWarehouse: jest.fn().mockResolvedValue([MOCK_LEDGER_ROW]),
    findAllByModel: jest.fn().mockResolvedValue([MOCK_LEDGER_ROW]),
    ...overrides.inventoryBagsRepo,
  };

  const logger: jest.Mocked<Partial<LoggerService>> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return Test.createTestingModule({
    providers: [
      InventoryAvailabilityService,
      GetBagAvailabilityUseCase,
      GetWarehouseAvailabilityUseCase,
      GetModelAvailabilityUseCase,
      { provide: PhysicalBagsRepository, useValue: bagsRepo },
      {
        provide: PhysicalBagReservationsRepository,
        useValue: reservationsRepo,
      },
      { provide: InventoryBagsRepository, useValue: inventoryBagsRepo },
      { provide: LoggerService, useValue: logger },
    ],
  }).compile();
}

describe('Availability Use Cases', () => {
  describe('GetBagAvailabilityUseCase', () => {
    let useCase: GetBagAvailabilityUseCase;
    let bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>>;
    let reservationsRepo: jest.Mocked<
      Partial<PhysicalBagReservationsRepository>
    >;

    beforeEach(async () => {
      const app = await buildModule();
      useCase = app.get(GetBagAvailabilityUseCase);
      bagsRepo = app.get(PhysicalBagsRepository);
      reservationsRepo = app.get(PhysicalBagReservationsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns bag availability with correct free_dozens calculation', async () => {
      const result = await useCase.execute(
        new GetBagAvailabilityQuery(BigInt(10)),
      );

      expect(result).toBeInstanceOf(BagAvailabilityDto);
      expect(result.bag_id).toBe('10');
      expect(result.bag_code).toBe('BAG-001');
      expect(result.current_dozens).toBe('20.000');
      expect(result.reserved_dozens).toBe('5.000');
      expect(result.free_dozens).toBe('15.000');
      expect(result.status).toBe('AVAILABLE');
    });

    it('returns free_dozens as 0 when reserved exceeds current', async () => {
      (reservationsRepo.sumActiveReservedDozens as jest.Mock).mockResolvedValue(
        25,
      );
      const result = await useCase.execute(
        new GetBagAvailabilityQuery(BigInt(10)),
      );
      expect(result.free_dozens).toBe('0.000');
    });

    it('throws NotFoundException when bag does not exist', async () => {
      (bagsRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        useCase.execute(new GetBagAvailabilityQuery(BigInt(999))),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('GetWarehouseAvailabilityUseCase', () => {
    let useCase: GetWarehouseAvailabilityUseCase;
    let inventoryBagsRepo: jest.Mocked<Partial<InventoryBagsRepository>>;

    beforeEach(async () => {
      const app = await buildModule();
      useCase = app.get(GetWarehouseAvailabilityUseCase);
      inventoryBagsRepo = app.get(InventoryBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns ledger rows for warehouse', async () => {
      const result = await useCase.execute(
        new GetWarehouseAvailabilityQuery(BigInt(5)),
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      const row = result[0];
      expect(row).toBeInstanceOf(LedgerAvailabilityDto);
      expect(row.warehouse_id).toBe('5');
      expect(row.model_id).toBe('2');
      expect(row.part_id).toBe('3');
      expect(row.on_hand_dozens).toBe('50.000');
    });

    it('returns empty array when warehouse has no ledger entries', async () => {
      (inventoryBagsRepo.findAllByWarehouse as jest.Mock).mockResolvedValue([]);
      const result = await useCase.execute(
        new GetWarehouseAvailabilityQuery(BigInt(99)),
      );
      expect(result).toEqual([]);
    });
  });

  describe('GetModelAvailabilityUseCase', () => {
    let useCase: GetModelAvailabilityUseCase;
    let inventoryBagsRepo: jest.Mocked<Partial<InventoryBagsRepository>>;

    beforeEach(async () => {
      const app = await buildModule();
      useCase = app.get(GetModelAvailabilityUseCase);
      inventoryBagsRepo = app.get(InventoryBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns ledger rows for model across warehouses', async () => {
      const result = await useCase.execute(
        new GetModelAvailabilityQuery(BigInt(2)),
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      const row = result[0];
      expect(row).toBeInstanceOf(LedgerAvailabilityDto);
      expect(row.model_id).toBe('2');
      expect(row.on_hand_dozens).toBe('50.000');
      expect(row.last_updated).toBe('2026-06-15T08:00:00.000Z');
    });

    it('returns empty array when model has no ledger entries', async () => {
      (inventoryBagsRepo.findAllByModel as jest.Mock).mockResolvedValue([]);
      const result = await useCase.execute(
        new GetModelAvailabilityQuery(BigInt(999)),
      );
      expect(result).toEqual([]);
    });
  });
});
