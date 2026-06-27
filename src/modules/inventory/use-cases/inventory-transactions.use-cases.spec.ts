import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TxnTypeEnum } from '@prisma/client';

import { InventoryTransactionService } from '../services/inventory-transaction.service';
import { InventoryTransactionFactory } from '../services/inventory-transaction.factory';
import { InventoryTransactionMapper } from '../services/inventory-transaction.mapper';
import { InventoryTransactionValidator } from '../services/inventory-transaction.validator';
import { InventoryTransactionsRepository } from '../repositories/inventory-transactions.repository';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { LoggerService } from '../../../core/logger/logger.service';

import { ReceiveInventoryUseCase } from './create-inventory-transaction/receive-inventory.use-case';
import { IssueInventoryUseCase } from './create-inventory-transaction/issue-inventory.use-case';
import { TransferInventoryUseCase } from './create-inventory-transaction/transfer-inventory.use-case';
import { AdjustInventoryUseCase } from './create-inventory-transaction/adjust-inventory.use-case';
import { CreateInventoryTransactionUseCase } from './create-inventory-transaction/create-inventory-transaction.use-case';
import { ListInventoryTransactionsUseCase } from './list-inventory-transactions/list-inventory-transactions.use-case';
import { GetInventoryTransactionUseCase } from './get-inventory-transaction/get-inventory-transaction.use-case';
import { GetBagTransactionHistoryUseCase } from './get-bag-transaction-history/get-bag-transaction-history.use-case';

import { ReceiveInventoryCommand } from './create-inventory-transaction/commands/receive-inventory.command';
import { IssueInventoryCommand } from './create-inventory-transaction/commands/issue-inventory.command';
import { TransferInventoryCommand } from './create-inventory-transaction/commands/transfer-inventory.command';
import { AdjustInventoryCommand } from './create-inventory-transaction/commands/adjust-inventory.command';
import { CreateInventoryTransactionCommand } from './create-inventory-transaction/commands/create-inventory-transaction.command';
import { GetTransactionQuery } from './get-inventory-transaction/queries/get-transaction.query';
import { GetTransactionsQuery } from './list-inventory-transactions/queries/get-transactions.query';
import { GetTransactionsByBagQuery } from './get-bag-transaction-history/queries/get-transactions-by-bag.query';
import { TransactionOperationType } from '../dto/transaction-request.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { TransactionHistoryDto } from '../dto/transaction-history.dto';

const MOCK_TXN_RESPONSE: TransactionResponseDto = {
  txn_id: '1',
  txn_reference: 'TXN-001',
  txn_type: 'RECEIVING',
  model_id: '10',
  part_id: null,
  from_location_type: null,
  from_location_id: null,
  to_location_type: 'WAREHOUSE',
  to_location_id: '1',
  dozens_qty: '5.000',
  executed_by: '99',
  executed_at: '2026-06-27T10:00:00.000Z',
  notes: null,
};

const MOCK_RELEASE_RESPONSE: TransactionResponseDto = {
  ...MOCK_TXN_RESPONSE,
  txn_id: '2',
  txn_type: 'RELEASE',
  from_location_type: 'WAREHOUSE',
  from_location_id: '1',
  to_location_type: 'WAREHOUSE',
  to_location_id: '2',
};

const MOCK_PAGINATION = { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false };

const MOCK_DB_TXN = {
  txn_id: BigInt(1),
  txn_reference: 'TXN-001',
  txn_type: TxnTypeEnum.RECEIVING,
  model_id: BigInt(10),
  part_id: null,
  color_id: null,
  size_id: null,
  from_location_type: null,
  from_location_id: null,
  to_location_type: 'WAREHOUSE',
  to_location_id: BigInt(1),
  dozens_qty: { toString: () => '5.000' } as any,
  executed_by: BigInt(99),
  executed_at: new Date('2026-06-27T10:00:00.000Z'),
  notes: null,
};

const MOCK_CREATE_DATA = {
  txn_reference: 'TXN-001',
  txn_type: TxnTypeEnum.RECEIVING,
  model_id: BigInt(10),
  part_id: null,
  from_location_type: null,
  from_location_id: null,
  to_location_type: 'WAREHOUSE',
  to_location_id: BigInt(1),
  dozens_qty: 5,
  executed_by: BigInt(99),
  notes: null,
};

function buildTestModule(overrides: Record<string, any> = {}) {
  const txnRepo: jest.Mocked<Partial<InventoryTransactionsRepository>> = {
    create: jest.fn().mockResolvedValue(MOCK_DB_TXN),
    createInTx: jest.fn().mockResolvedValue(MOCK_DB_TXN),
    findById: jest.fn().mockResolvedValue(MOCK_DB_TXN),
    findAllWithPagination: jest.fn().mockResolvedValue({ items: [MOCK_DB_TXN], meta: MOCK_PAGINATION }),
    findByWarehouseId: jest.fn().mockResolvedValue({ items: [MOCK_DB_TXN], meta: MOCK_PAGINATION }),
    executeInTransaction: jest.fn().mockImplementation((cb: any) => cb({})),
    ...overrides.txnRepo,
  };

  const bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>> = {
    findById: jest.fn().mockResolvedValue({ bag_id: BigInt(5) }),
    findMovementHistory: jest.fn().mockResolvedValue({ items: [], meta: MOCK_PAGINATION }),
    ...overrides.bagsRepo,
  };

  const factory: jest.Mocked<Partial<InventoryTransactionFactory>> = {
    fromReceive: jest.fn().mockReturnValue(MOCK_CREATE_DATA),
    fromIssue: jest.fn().mockReturnValue(MOCK_CREATE_DATA),
    fromTransfer: jest.fn().mockReturnValue([MOCK_CREATE_DATA, MOCK_CREATE_DATA]),
    fromAdjust: jest.fn().mockReturnValue(MOCK_CREATE_DATA),
    ...overrides.factory,
  };

  const mapper: jest.Mocked<Partial<InventoryTransactionMapper>> = {
    toResponse: jest.fn().mockReturnValue(MOCK_TXN_RESPONSE),
    toResponseList: jest.fn().mockReturnValue([MOCK_TXN_RESPONSE]),
    ...overrides.mapper,
  };

  const validator: jest.Mocked<Partial<InventoryTransactionValidator>> = {
    validateReceive: jest.fn().mockResolvedValue(undefined),
    validateIssue: jest.fn().mockResolvedValue(undefined),
    validateTransfer: jest.fn().mockResolvedValue(undefined),
    validateAdjust: jest.fn().mockResolvedValue(undefined),
    ...overrides.validator,
  };

  const logger: jest.Mocked<Partial<LoggerService>> = {
    info: jest.fn(),
    error: jest.fn(),
    ...overrides.logger,
  };

  return Test.createTestingModule({
    providers: [
      InventoryTransactionService,
      ReceiveInventoryUseCase,
      IssueInventoryUseCase,
      TransferInventoryUseCase,
      AdjustInventoryUseCase,
      CreateInventoryTransactionUseCase,
      ListInventoryTransactionsUseCase,
      GetInventoryTransactionUseCase,
      GetBagTransactionHistoryUseCase,
      { provide: InventoryTransactionsRepository, useValue: txnRepo },
      { provide: PhysicalBagsRepository, useValue: bagsRepo },
      { provide: InventoryTransactionFactory, useValue: factory },
      { provide: InventoryTransactionMapper, useValue: mapper },
      { provide: InventoryTransactionValidator, useValue: validator },
      { provide: LoggerService, useValue: logger },
    ],
  }).compile();
}

describe('InventoryTransactionService', () => {
  let service: InventoryTransactionService;
  let txnRepo: jest.Mocked<InventoryTransactionsRepository>;
  let factory: jest.Mocked<InventoryTransactionFactory>;
  let validator: jest.Mocked<InventoryTransactionValidator>;

  const RECEIVE_CMD = new ReceiveInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), 5, BigInt(99), null);
  const ISSUE_CMD = new IssueInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), BigInt(20), 5, BigInt(99), null);
  const TRANSFER_CMD = new TransferInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), BigInt(2), 5, BigInt(99), null);
  const ADJUST_CMD = new AdjustInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), -2, BigInt(99), null);

  beforeEach(async () => {
    const module = await buildTestModule();
    service = module.get(InventoryTransactionService);
    txnRepo = module.get(InventoryTransactionsRepository) as jest.Mocked<InventoryTransactionsRepository>;
    factory = module.get(InventoryTransactionFactory) as jest.Mocked<InventoryTransactionFactory>;
    validator = module.get(InventoryTransactionValidator) as jest.Mocked<InventoryTransactionValidator>;
  });

  describe('receive', () => {
    it('validates, creates, and returns TransactionResult', async () => {
      const result = await service.receive(RECEIVE_CMD);
      expect(validator.validateReceive).toHaveBeenCalledWith(RECEIVE_CMD);
      expect(factory.fromReceive).toHaveBeenCalledWith(RECEIVE_CMD);
      expect(txnRepo.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.transaction.txn_id).toBe('1');
    });

    it('propagates validation error', async () => {
      validator.validateReceive.mockRejectedValueOnce(new NotFoundException('Model not found'));
      await expect(service.receive(RECEIVE_CMD)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('issue', () => {
    it('validates, creates, and returns TransactionResult', async () => {
      const result = await service.issue(ISSUE_CMD);
      expect(validator.validateIssue).toHaveBeenCalledWith(ISSUE_CMD);
      expect(factory.fromIssue).toHaveBeenCalledWith(ISSUE_CMD);
      expect(result.success).toBe(true);
    });
  });

  describe('transfer', () => {
    it('validates and creates two records atomically', async () => {
      const result = await service.transfer(TRANSFER_CMD);
      expect(validator.validateTransfer).toHaveBeenCalledWith(TRANSFER_CMD);
      expect(factory.fromTransfer).toHaveBeenCalledWith(TRANSFER_CMD);
      expect(result.success).toBe(true);
      expect('outbound' in result).toBe(true);
      expect('inbound' in result).toBe(true);
    });

    it('propagates validation error from same-warehouse check', async () => {
      validator.validateTransfer.mockRejectedValueOnce(
        new BadRequestException('Source and destination warehouse must differ'),
      );
      await expect(service.transfer(TRANSFER_CMD)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('adjust', () => {
    it('validates, creates, and returns TransactionResult', async () => {
      const result = await service.adjust(ADJUST_CMD);
      expect(validator.validateAdjust).toHaveBeenCalledWith(ADJUST_CMD);
      expect(factory.fromAdjust).toHaveBeenCalledWith(ADJUST_CMD);
      expect(result.success).toBe(true);
    });
  });

  describe('getById', () => {
    it('returns mapped response when found', async () => {
      const result = await service.getById(new GetTransactionQuery(BigInt(1)));
      expect(txnRepo.findById).toHaveBeenCalledWith(BigInt(1));
      expect(result.txn_id).toBe('1');
    });

    it('throws NotFoundException when not found', async () => {
      txnRepo.findById = jest.fn().mockResolvedValue(null);
      await expect(service.getById(new GetTransactionQuery(BigInt(999)))).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listTransactions', () => {
    it('delegates to repository and maps results', async () => {
      const query = new GetTransactionsQuery(1, 20);
      const result = await service.listTransactions(query);
      expect(txnRepo.findAllWithPagination).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('getBagHistory', () => {
    it('throws NotFoundException when bag not found', async () => {
      (txnRepo as any).bagsRepo = undefined;
      const module = await buildTestModule({ bagsRepo: { findById: jest.fn().mockResolvedValue(null) } });
      const svc = module.get(InventoryTransactionService);
      await expect(
        svc.getBagHistory(new GetTransactionsByBagQuery(BigInt(999), 1, 20)),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns paginated bag movement history', async () => {
      const MOCK_MOVEMENT = {
        movement_id: BigInt(1),
        bag_id: BigInt(5),
        from_status: null,
        to_status: 'AVAILABLE',
        from_warehouse_id: null,
        to_warehouse_id: BigInt(1),
        from_order_id: null,
        to_order_id: null,
        dozens_moved: null,
        movement_reason: 'RECEIVE',
        performed_by: BigInt(99),
        performed_at: new Date('2026-06-27T10:00:00.000Z'),
        notes: null,
      };
      const module = await buildTestModule({
        bagsRepo: {
          findById: jest.fn().mockResolvedValue({ bag_id: BigInt(5) }),
          findMovementHistory: jest.fn().mockResolvedValue({ items: [MOCK_MOVEMENT], meta: MOCK_PAGINATION }),
        },
      });
      const svc = module.get(InventoryTransactionService);
      const result = await svc.getBagHistory(new GetTransactionsByBagQuery(BigInt(5), 1, 20));
      expect(result.items).toHaveLength(1);
      expect(result.items[0].movement_id).toBe('1');
    });
  });
});

describe('ReceiveInventoryUseCase', () => {
  it('delegates to InventoryTransactionService.receive', async () => {
    const module = await buildTestModule();
    const useCase = module.get(ReceiveInventoryUseCase);
    const service = module.get(InventoryTransactionService);
    jest.spyOn(service, 'receive').mockResolvedValue({ success: true, transaction: MOCK_TXN_RESPONSE });

    const cmd = new ReceiveInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), 5, BigInt(99), null);
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect(service.receive).toHaveBeenCalledWith(cmd);
  });
});

describe('IssueInventoryUseCase', () => {
  it('delegates to InventoryTransactionService.issue', async () => {
    const module = await buildTestModule();
    const useCase = module.get(IssueInventoryUseCase);
    const service = module.get(InventoryTransactionService);
    jest.spyOn(service, 'issue').mockResolvedValue({ success: true, transaction: MOCK_TXN_RESPONSE });

    const cmd = new IssueInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), BigInt(20), 5, BigInt(99), null);
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect(service.issue).toHaveBeenCalledWith(cmd);
  });
});

describe('TransferInventoryUseCase', () => {
  it('delegates to InventoryTransactionService.transfer', async () => {
    const module = await buildTestModule();
    const useCase = module.get(TransferInventoryUseCase);
    const service = module.get(InventoryTransactionService);
    const transferResult = { success: true as const, outbound: MOCK_TXN_RESPONSE, inbound: MOCK_RELEASE_RESPONSE };
    jest.spyOn(service, 'transfer').mockResolvedValue(transferResult);

    const cmd = new TransferInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), BigInt(2), 5, BigInt(99), null);
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect('outbound' in result).toBe(true);
    expect(service.transfer).toHaveBeenCalledWith(cmd);
  });
});

describe('AdjustInventoryUseCase', () => {
  it('delegates to InventoryTransactionService.adjust', async () => {
    const module = await buildTestModule();
    const useCase = module.get(AdjustInventoryUseCase);
    const service = module.get(InventoryTransactionService);
    jest.spyOn(service, 'adjust').mockResolvedValue({ success: true, transaction: MOCK_TXN_RESPONSE });

    const cmd = new AdjustInventoryCommand('TXN-001', BigInt(10), null, BigInt(1), -2, BigInt(99), null);
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect(service.adjust).toHaveBeenCalledWith(cmd);
  });
});

describe('CreateInventoryTransactionUseCase', () => {
  let useCase: CreateInventoryTransactionUseCase;
  let service: InventoryTransactionService;

  beforeEach(async () => {
    const module = await buildTestModule();
    useCase = module.get(CreateInventoryTransactionUseCase);
    service = module.get(InventoryTransactionService);
  });

  it('routes RECEIVE to service.receive', async () => {
    jest.spyOn(service, 'receive').mockResolvedValue({ success: true, transaction: MOCK_TXN_RESPONSE });
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.RECEIVE, 'TXN-001', BigInt(10), null, null, BigInt(1), null, 5, BigInt(99), null,
    );
    await useCase.execute(cmd);
    expect(service.receive).toHaveBeenCalled();
  });

  it('routes ISSUE to service.issue', async () => {
    jest.spyOn(service, 'issue').mockResolvedValue({ success: true, transaction: MOCK_TXN_RESPONSE });
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.ISSUE, 'TXN-001', BigInt(10), null, BigInt(1), null, BigInt(20), 5, BigInt(99), null,
    );
    await useCase.execute(cmd);
    expect(service.issue).toHaveBeenCalled();
  });

  it('routes TRANSFER to service.transfer', async () => {
    const transferResult = { success: true as const, outbound: MOCK_TXN_RESPONSE, inbound: MOCK_RELEASE_RESPONSE };
    jest.spyOn(service, 'transfer').mockResolvedValue(transferResult);
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.TRANSFER, 'TXN-001', BigInt(10), null, BigInt(1), BigInt(2), null, 5, BigInt(99), null,
    );
    await useCase.execute(cmd);
    expect(service.transfer).toHaveBeenCalled();
  });

  it('routes ADJUSTMENT to service.adjust', async () => {
    jest.spyOn(service, 'adjust').mockResolvedValue({ success: true, transaction: MOCK_TXN_RESPONSE });
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.ADJUSTMENT, 'TXN-001', BigInt(10), null, null, BigInt(1), null, -2, BigInt(99), null,
    );
    await useCase.execute(cmd);
    expect(service.adjust).toHaveBeenCalled();
  });

  it('routes OPENING_BALANCE to service.receive', async () => {
    jest.spyOn(service, 'receive').mockResolvedValue({ success: true, transaction: MOCK_TXN_RESPONSE });
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.OPENING_BALANCE, 'TXN-001', BigInt(10), null, null, BigInt(1), null, 5, BigInt(99), null,
    );
    await useCase.execute(cmd);
    expect(service.receive).toHaveBeenCalled();
  });

  it('throws BadRequestException when RECEIVE missing to_warehouse_id', async () => {
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.RECEIVE, 'TXN-001', BigInt(10), null, null, null, null, 5, BigInt(99), null,
    );
    await expect(useCase.execute(cmd)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when ISSUE missing from_warehouse_id', async () => {
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.ISSUE, 'TXN-001', BigInt(10), null, null, null, BigInt(20), 5, BigInt(99), null,
    );
    await expect(useCase.execute(cmd)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when TRANSFER missing to_warehouse_id', async () => {
    const cmd = new CreateInventoryTransactionCommand(
      TransactionOperationType.TRANSFER, 'TXN-001', BigInt(10), null, BigInt(1), null, null, 5, BigInt(99), null,
    );
    await expect(useCase.execute(cmd)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ListInventoryTransactionsUseCase', () => {
  it('delegates to InventoryTransactionService.listTransactions', async () => {
    const module = await buildTestModule();
    const useCase = module.get(ListInventoryTransactionsUseCase);
    const service = module.get(InventoryTransactionService);
    jest.spyOn(service, 'listTransactions').mockResolvedValue({ items: [MOCK_TXN_RESPONSE], meta: MOCK_PAGINATION });

    const query = new GetTransactionsQuery(1, 20);
    const result = await useCase.execute(query);
    expect(result.items).toHaveLength(1);
    expect(service.listTransactions).toHaveBeenCalledWith(query);
  });
});

describe('GetInventoryTransactionUseCase', () => {
  it('delegates to InventoryTransactionService.getById', async () => {
    const module = await buildTestModule();
    const useCase = module.get(GetInventoryTransactionUseCase);
    const service = module.get(InventoryTransactionService);
    jest.spyOn(service, 'getById').mockResolvedValue(MOCK_TXN_RESPONSE);

    const query = new GetTransactionQuery(BigInt(1));
    const result = await useCase.execute(query);
    expect(result.txn_id).toBe('1');
    expect(service.getById).toHaveBeenCalledWith(query);
  });
});

describe('GetBagTransactionHistoryUseCase', () => {
  it('delegates to InventoryTransactionService.getBagHistory', async () => {
    const MOCK_HISTORY: TransactionHistoryDto = {
      movement_id: '1', bag_id: '5', from_status: null, to_status: 'AVAILABLE',
      from_warehouse_id: null, to_warehouse_id: '1', from_order_id: null, to_order_id: null,
      dozens_moved: null, movement_reason: 'RECEIVE', performed_by: '99',
      performed_at: '2026-06-27T10:00:00.000Z', notes: null,
    };
    const module = await buildTestModule();
    const useCase = module.get(GetBagTransactionHistoryUseCase);
    const service = module.get(InventoryTransactionService);
    jest.spyOn(service, 'getBagHistory').mockResolvedValue({ items: [MOCK_HISTORY], meta: MOCK_PAGINATION });

    const query = new GetTransactionsByBagQuery(BigInt(5), 1, 20);
    const result = await useCase.execute(query);
    expect(result.items).toHaveLength(1);
    expect(service.getBagHistory).toHaveBeenCalledWith(query);
  });
});
