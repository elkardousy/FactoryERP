import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BagStatusEnum } from '@prisma/client';

import { PhysicalBagMovementService } from '../services/physical-bag-movement.service';
import { PhysicalBagMovementValidator } from '../services/physical-bag-movement.validator';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { InventoryValidationRepository } from '../repositories/inventory-validation.repository';
import { LoggerService } from '../../../core/logger/logger.service';

import { TransferBagToWarehouseUseCase } from './transfer-bag-to-warehouse/transfer-bag-to-warehouse.use-case';
import { AssignBagToOrderUseCase } from './assign-bag-to-order/assign-bag-to-order.use-case';
import { ReturnBagFromOrderUseCase } from './return-bag-from-order/return-bag-from-order.use-case';

import { TransferBagToWarehouseCommand } from './transfer-bag-to-warehouse/commands/transfer-bag-to-warehouse.command';
import { AssignBagToOrderCommand } from './assign-bag-to-order/commands/assign-bag-to-order.command';
import { ReturnBagFromOrderCommand } from './return-bag-from-order/commands/return-bag-from-order.command';

import { TransactionHistoryDto } from '../dto/transaction-history.dto';

const MOCK_AVAILABLE_BAG = {
  bag_id: BigInt(10),
  bag_code: 'BAG-001',
  container_id: BigInt(1),
  audit_item_id: null,
  customer_id: BigInt(1),
  model_id: BigInt(2),
  part_id: BigInt(3),
  received_dozens: { toString: () => '20.000' } as any,
  current_dozens: { toString: () => '20.000' } as any,
  current_warehouse_id: BigInt(5),
  current_order_id: null,
  status: BagStatusEnum.AVAILABLE,
  received_date: new Date('2026-06-01'),
  created_by: BigInt(99),
  created_at: new Date('2026-06-01'),
  updated_at: new Date('2026-06-01'),
};

const MOCK_IN_WIP_BAG = {
  ...MOCK_AVAILABLE_BAG,
  status: BagStatusEnum.IN_WIP,
  current_warehouse_id: null,
  current_order_id: BigInt(20),
};

const MOCK_MOVEMENT = {
  movement_id: BigInt(1),
  bag_id: BigInt(10),
  from_status: BagStatusEnum.AVAILABLE,
  to_status: BagStatusEnum.AVAILABLE,
  from_warehouse_id: BigInt(5),
  to_warehouse_id: BigInt(7),
  from_order_id: null,
  to_order_id: null,
  dozens_moved: null,
  movement_reason: 'WAREHOUSE_TRANSFER',
  performed_by: BigInt(99),
  performed_at: new Date('2026-06-29T12:00:00.000Z'),
  notes: null,
};

function buildModule(overrides: Record<string, any> = {}) {
  const bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_AVAILABLE_BAG),
    createMovementInTx: jest.fn().mockResolvedValue(MOCK_MOVEMENT),
    updateBagLocationInTx: jest.fn().mockResolvedValue(MOCK_AVAILABLE_BAG),
    executeInTransaction: jest
      .fn()
      .mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb({})),
    ...overrides.bagsRepo,
  };

  const validationRepo: jest.Mocked<Partial<InventoryValidationRepository>> = {
    warehouseExistsAndActive: jest.fn().mockResolvedValue(true),
    orderExists: jest.fn().mockResolvedValue(true),
    ...overrides.validationRepo,
  };

  const logger: jest.Mocked<Partial<LoggerService>> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return Test.createTestingModule({
    providers: [
      PhysicalBagMovementService,
      PhysicalBagMovementValidator,
      TransferBagToWarehouseUseCase,
      AssignBagToOrderUseCase,
      ReturnBagFromOrderUseCase,
      { provide: PhysicalBagsRepository, useValue: bagsRepo },
      { provide: InventoryValidationRepository, useValue: validationRepo },
      { provide: LoggerService, useValue: logger },
    ],
  }).compile();
}

describe('Movement Use Cases', () => {
  describe('TransferBagToWarehouseUseCase', () => {
    let useCase: TransferBagToWarehouseUseCase;
    let bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>>;

    beforeEach(async () => {
      const app = await buildModule();
      useCase = app.get(TransferBagToWarehouseUseCase);
      bagsRepo = app.get(PhysicalBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('transfers bag to a different warehouse successfully', async () => {
      const result = await useCase.execute(
        new TransferBagToWarehouseCommand(
          BigInt(10),
          BigInt(7),
          null,
          'WAREHOUSE_TRANSFER',
          BigInt(99),
          null,
        ),
      );

      expect(result).toBeInstanceOf(TransactionHistoryDto);
      expect(result.movement_id).toBe('1');
      expect(result.to_warehouse_id).toBe('7');
    });

    it('throws NotFoundException when bag does not exist', async () => {
      (bagsRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        useCase.execute(
          new TransferBagToWarehouseCommand(
            BigInt(999),
            BigInt(7),
            null,
            'TRANSFER',
            BigInt(99),
            null,
          ),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when source and destination warehouse are the same', async () => {
      await expect(
        useCase.execute(
          new TransferBagToWarehouseCommand(
            BigInt(10),
            BigInt(5),
            null,
            'TRANSFER',
            BigInt(99),
            null,
          ),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws UnprocessableEntityException when bag is not in a warehouse', async () => {
      (bagsRepo.findById as jest.Mock).mockResolvedValue(MOCK_IN_WIP_BAG);
      await expect(
        useCase.execute(
          new TransferBagToWarehouseCommand(
            BigInt(10),
            BigInt(7),
            null,
            'TRANSFER',
            BigInt(99),
            null,
          ),
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('AssignBagToOrderUseCase', () => {
    let useCase: AssignBagToOrderUseCase;
    let bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>>;
    const assignedMovement = {
      ...MOCK_MOVEMENT,
      to_status: BagStatusEnum.IN_WIP,
      to_order_id: BigInt(20),
      to_warehouse_id: null,
    };

    beforeEach(async () => {
      const app = await buildModule({
        bagsRepo: {
          createMovementInTx: jest.fn().mockResolvedValue(assignedMovement),
        },
      });
      useCase = app.get(AssignBagToOrderUseCase);
      bagsRepo = app.get(PhysicalBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('assigns AVAILABLE bag to production order successfully', async () => {
      const result = await useCase.execute(
        new AssignBagToOrderCommand(
          BigInt(10),
          BigInt(20),
          null,
          'PRODUCTION_ASSIGNMENT',
          BigInt(99),
          null,
        ),
      );

      expect(result).toBeInstanceOf(TransactionHistoryDto);
      expect(result.to_status).toBe(BagStatusEnum.IN_WIP);
    });

    it('throws UnprocessableEntityException when bag is not AVAILABLE', async () => {
      (bagsRepo.findById as jest.Mock).mockResolvedValue({
        ...MOCK_AVAILABLE_BAG,
        status: BagStatusEnum.RESERVED,
      });
      await expect(
        useCase.execute(
          new AssignBagToOrderCommand(
            BigInt(10),
            BigInt(20),
            null,
            'ASSIGNMENT',
            BigInt(99),
            null,
          ),
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('ReturnBagFromOrderUseCase', () => {
    let useCase: ReturnBagFromOrderUseCase;
    let bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>>;
    const returnedMovement = {
      ...MOCK_MOVEMENT,
      from_status: BagStatusEnum.IN_WIP,
      to_status: BagStatusEnum.RETURNED,
      from_warehouse_id: null,
      from_order_id: BigInt(20),
    };

    beforeEach(async () => {
      const app = await buildModule({
        bagsRepo: {
          findById: jest.fn().mockResolvedValue(MOCK_IN_WIP_BAG),
          createMovementInTx: jest.fn().mockResolvedValue(returnedMovement),
        },
      });
      useCase = app.get(ReturnBagFromOrderUseCase);
      bagsRepo = app.get(PhysicalBagsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns IN_WIP bag from order to warehouse successfully', async () => {
      const result = await useCase.execute(
        new ReturnBagFromOrderCommand(
          BigInt(10),
          BigInt(5),
          'PRODUCTION_RETURN',
          BigInt(99),
          null,
        ),
      );

      expect(result).toBeInstanceOf(TransactionHistoryDto);
      expect(result.to_status).toBe(BagStatusEnum.RETURNED);
    });

    it('throws UnprocessableEntityException when bag is not IN_WIP', async () => {
      (bagsRepo.findById as jest.Mock).mockResolvedValue(MOCK_AVAILABLE_BAG);
      await expect(
        useCase.execute(
          new ReturnBagFromOrderCommand(
            BigInt(10),
            BigInt(5),
            'RETURN',
            BigInt(99),
            null,
          ),
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });
});
