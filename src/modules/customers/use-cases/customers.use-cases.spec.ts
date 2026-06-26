import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CustomersRepository } from '../repositories/customers.repository';
import { AuditService } from '../../../core/audit/audit.service';
import { CreateCustomerUseCase } from './create-customer.use-case';
import { DeactivateCustomerUseCase } from './deactivate-customer.use-case';
import { ReactivateCustomerUseCase } from './reactivate-customer.use-case';

const ACTOR = BigInt(99);
const MOCK_CUSTOMER = {
  customer_id: BigInt(1),
  customer_code: 'CUST-001',
  customer_name: 'ACME Corp',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateCustomerUseCase,
      DeactivateCustomerUseCase,
      ReactivateCustomerUseCase,
      {
        provide: CustomersRepository,
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

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let repo: jest.Mocked<CustomersRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateCustomerUseCase);
    repo = m.get(CustomersRepository);
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(MOCK_CUSTOMER);
  });

  it('creates and returns the customer', async () => {
    const result = await useCase.execute(
      { customer_code: 'CUST-001', customer_name: 'ACME Corp' },
      ACTOR,
    );
    expect(result.customer_code).toBe('CUST-001');
    expect(repo.create).toHaveBeenCalled();
  });

  it('throws ConflictException on duplicate code', async () => {
    repo.findByCode.mockResolvedValue(MOCK_CUSTOMER);
    await expect(
      useCase.execute(
        { customer_code: 'CUST-001', customer_name: 'Dup' },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DeactivateCustomerUseCase', () => {
  let useCase: DeactivateCustomerUseCase;
  let repo: jest.Mocked<CustomersRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeactivateCustomerUseCase);
    repo = m.get(CustomersRepository);
    repo.findById.mockResolvedValue(MOCK_CUSTOMER);
    repo.softDelete.mockResolvedValue({
      ...MOCK_CUSTOMER,
      is_active: false,
    });
  });

  it('soft-deletes and returns the updated customer', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException for missing customer', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException if already inactive', async () => {
    repo.findById.mockResolvedValue({
      ...MOCK_CUSTOMER,
      is_active: false,
    });
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ReactivateCustomerUseCase', () => {
  let useCase: ReactivateCustomerUseCase;
  let repo: jest.Mocked<CustomersRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(ReactivateCustomerUseCase);
    repo = m.get(CustomersRepository);
    repo.findById.mockResolvedValue({
      ...MOCK_CUSTOMER,
      is_active: false,
    });
    repo.restore.mockResolvedValue(MOCK_CUSTOMER);
  });

  it('restores and returns the active customer', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(true);
  });

  it('throws NotFoundException for missing customer', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException if already active', async () => {
    repo.findById.mockResolvedValue(MOCK_CUSTOMER);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
