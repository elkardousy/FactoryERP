import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { AuditService } from '../../../core/audit/audit.service';
import { CreateWarehouseUseCase } from './create-warehouse.use-case';
import { DeactivateWarehouseUseCase } from './deactivate-warehouse.use-case';
import { ReactivateWarehouseUseCase } from './reactivate-warehouse.use-case';
import { UpdateWarehouseUseCase } from './update-warehouse.use-case';

const ACTOR = BigInt(99);
const MOCK_WH = {
  warehouse_id: BigInt(1),
  warehouse_code: 'WH-RAW',
  warehouse_name: 'Raw Materials Store',
  warehouse_type: 'RAW',
  is_active: true,
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateWarehouseUseCase,
      DeactivateWarehouseUseCase,
      ReactivateWarehouseUseCase,
      UpdateWarehouseUseCase,
      {
        provide: WarehousesRepository,
        useValue: {
          findByCode: jest.fn(),
          findById: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          softDelete: jest.fn(),
          restore: jest.fn(),
        },
      },
      {
        provide: AuditService,
        useValue: { log: jest.fn().mockResolvedValue(undefined) },
      },
    ],
  }).compile();
}

describe('CreateWarehouseUseCase', () => {
  let useCase: CreateWarehouseUseCase;
  let repo: jest.Mocked<WarehousesRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateWarehouseUseCase);
    repo = m.get(WarehousesRepository);
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(MOCK_WH as any);
  });

  it('creates and returns the warehouse', async () => {
    const result = await useCase.execute(
      {
        warehouse_code: 'WH-RAW',
        warehouse_name: 'Raw Materials Store',
        warehouse_type: 'RAW',
      },
      ACTOR,
    );
    expect(result.warehouse_code).toBe('WH-RAW');
  });

  it('throws ConflictException on duplicate code', async () => {
    repo.findByCode.mockResolvedValue(MOCK_WH as any);
    await expect(
      useCase.execute(
        {
          warehouse_code: 'WH-RAW',
          warehouse_name: 'Dup',
          warehouse_type: 'RAW' as any,
        },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('UpdateWarehouseUseCase — warehouse_type guard', () => {
  let useCase: UpdateWarehouseUseCase;
  let repo: jest.Mocked<WarehousesRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(UpdateWarehouseUseCase);
    repo = m.get(WarehousesRepository);
    repo.findById.mockResolvedValue(MOCK_WH as any);
    repo.update.mockResolvedValue(MOCK_WH as any);
  });

  it('throws BadRequestException when warehouse_type is changed', async () => {
    await expect(
      useCase.execute(1, { warehouse_type: 'WIP' as any }, ACTOR),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates when warehouse_type is not changed', async () => {
    await expect(
      useCase.execute(1, { warehouse_name: 'New Name' }, ACTOR),
    ).resolves.toBeDefined();
  });
});

describe('DeactivateWarehouseUseCase', () => {
  let useCase: DeactivateWarehouseUseCase;
  let repo: jest.Mocked<WarehousesRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeactivateWarehouseUseCase);
    repo = m.get(WarehousesRepository);
    repo.findById.mockResolvedValue(MOCK_WH as any);
    repo.softDelete.mockResolvedValue({ ...MOCK_WH, is_active: false } as any);
  });

  it('deactivates the warehouse', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException for unknown warehouse', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already deactivated', async () => {
    repo.findById.mockResolvedValue({ ...MOCK_WH, is_active: false } as any);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ReactivateWarehouseUseCase', () => {
  let useCase: ReactivateWarehouseUseCase;
  let repo: jest.Mocked<WarehousesRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(ReactivateWarehouseUseCase);
    repo = m.get(WarehousesRepository);
    repo.findById.mockResolvedValue({ ...MOCK_WH, is_active: false } as any);
    repo.restore.mockResolvedValue(MOCK_WH as any);
  });

  it('restores the warehouse', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(true);
  });

  it('throws NotFoundException for unknown warehouse', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already active', async () => {
    repo.findById.mockResolvedValue(MOCK_WH as any);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
