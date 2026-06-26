import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SuppliersRepository } from '../repositories/suppliers.repository';
import { AuditService } from '../../../core/audit/audit.service';
import { CreateSupplierUseCase } from './create-supplier.use-case';
import { DeactivateSupplierUseCase } from './deactivate-supplier.use-case';
import { ReactivateSupplierUseCase } from './reactivate-supplier.use-case';

const ACTOR = BigInt(99);
const MOCK_SUPPLIER = {
  supplier_id: BigInt(1),
  supplier_code: 'SUP-001',
  supplier_name: 'Best Fabrics Ltd',
  contact_info: null,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateSupplierUseCase,
      DeactivateSupplierUseCase,
      ReactivateSupplierUseCase,
      {
        provide: SuppliersRepository,
        useValue: {
          findByCode: jest.fn(),
          findById: jest.fn(),
          create: jest.fn(),
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

describe('CreateSupplierUseCase', () => {
  let useCase: CreateSupplierUseCase;
  let repo: jest.Mocked<SuppliersRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateSupplierUseCase);
    repo = m.get(SuppliersRepository);
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(MOCK_SUPPLIER);
  });

  it('creates and returns the supplier', async () => {
    const result = await useCase.execute(
      { supplier_code: 'SUP-001', supplier_name: 'Best Fabrics Ltd' },
      ACTOR,
    );
    expect(result.supplier_code).toBe('SUP-001');
  });

  it('throws ConflictException on duplicate code', async () => {
    repo.findByCode.mockResolvedValue(MOCK_SUPPLIER);
    await expect(
      useCase.execute(
        { supplier_code: 'SUP-001', supplier_name: 'Dup' },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DeactivateSupplierUseCase', () => {
  let useCase: DeactivateSupplierUseCase;
  let repo: jest.Mocked<SuppliersRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeactivateSupplierUseCase);
    repo = m.get(SuppliersRepository);
    repo.findById.mockResolvedValue(MOCK_SUPPLIER);
    repo.softDelete.mockResolvedValue({
      ...MOCK_SUPPLIER,
      is_active: false,
    });
  });

  it('deactivates the supplier', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException for missing supplier', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException if already inactive', async () => {
    repo.findById.mockResolvedValue({
      ...MOCK_SUPPLIER,
      is_active: false,
    });
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ReactivateSupplierUseCase', () => {
  let useCase: ReactivateSupplierUseCase;
  let repo: jest.Mocked<SuppliersRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(ReactivateSupplierUseCase);
    repo = m.get(SuppliersRepository);
    repo.findById.mockResolvedValue({
      ...MOCK_SUPPLIER,
      is_active: false,
    });
    repo.restore.mockResolvedValue(MOCK_SUPPLIER);
  });

  it('restores the supplier', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(true);
  });

  it('throws NotFoundException for missing supplier', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException if already active', async () => {
    repo.findById.mockResolvedValue(MOCK_SUPPLIER);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
