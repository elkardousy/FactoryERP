import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ModelsRepository } from '../repositories/models.repository';
import { CustomersRepository } from '../../customers/repositories/customers.repository';
import { AuditService } from '../../../core/audit/audit.service';
import { CreateModelUseCase } from './create-model.use-case';
import { DeactivateModelUseCase } from './deactivate-model.use-case';
import { ReactivateModelUseCase } from './reactivate-model.use-case';

const ACTOR = BigInt(99);
const MOCK_MODEL = {
  model_id: BigInt(1),
  customer_id: BigInt(10),
  model_code: 'DRESS-001',
  model_name: 'Summer Dress',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};
const MOCK_CUSTOMER = {
  customer_id: BigInt(10),
  customer_code: 'CUST-001',
  customer_name: 'ACME Corp',
  is_active: true,
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateModelUseCase,
      DeactivateModelUseCase,
      ReactivateModelUseCase,
      {
        provide: ModelsRepository,
        useValue: {
          findByCustomerAndCode: jest.fn(),
          findById: jest.fn(),
          create: jest.fn(),
          softDelete: jest.fn(),
          restore: jest.fn(),
        },
      },
      {
        provide: CustomersRepository,
        useValue: {
          findById: jest.fn(),
        },
      },
      {
        provide: AuditService,
        useValue: { log: jest.fn().mockResolvedValue(undefined) },
      },
    ],
  }).compile();
}

describe('CreateModelUseCase', () => {
  let useCase: CreateModelUseCase;
  let modelsRepo: jest.Mocked<ModelsRepository>;
  let customersRepo: jest.Mocked<CustomersRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateModelUseCase);
    modelsRepo = m.get(ModelsRepository);
    customersRepo = m.get(CustomersRepository);
    customersRepo.findById.mockResolvedValue(MOCK_CUSTOMER as any);
    modelsRepo.findByCustomerAndCode.mockResolvedValue(null);
    modelsRepo.create.mockResolvedValue(MOCK_MODEL);
  });

  it('creates and returns the model', async () => {
    const result = await useCase.execute(
      { customer_id: 10, model_code: 'DRESS-001', model_name: 'Summer Dress' },
      ACTOR,
    );
    expect(result.model_code).toBe('DRESS-001');
  });

  it('throws NotFoundException when customer does not exist', async () => {
    customersRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(
        { customer_id: 999, model_code: 'X', model_name: 'X' },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when customer is inactive', async () => {
    customersRepo.findById.mockResolvedValue({
      ...MOCK_CUSTOMER,
      is_active: false,
    } as any);
    await expect(
      useCase.execute(
        { customer_id: 10, model_code: 'X', model_name: 'X' },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws ConflictException on duplicate model code for same customer', async () => {
    modelsRepo.findByCustomerAndCode.mockResolvedValue(MOCK_MODEL);
    await expect(
      useCase.execute(
        { customer_id: 10, model_code: 'DRESS-001', model_name: 'Dup' },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DeactivateModelUseCase', () => {
  let useCase: DeactivateModelUseCase;
  let repo: jest.Mocked<ModelsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeactivateModelUseCase);
    repo = m.get(ModelsRepository);
    repo.findById.mockResolvedValue(MOCK_MODEL as any);
    repo.softDelete.mockResolvedValue({
      ...MOCK_MODEL,
      is_active: false,
    });
  });

  it('deactivates the model', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException for missing model', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already inactive', async () => {
    repo.findById.mockResolvedValue({ ...MOCK_MODEL, is_active: false } as any);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ReactivateModelUseCase', () => {
  let useCase: ReactivateModelUseCase;
  let repo: jest.Mocked<ModelsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(ReactivateModelUseCase);
    repo = m.get(ModelsRepository);
    repo.findById.mockResolvedValue({ ...MOCK_MODEL, is_active: false } as any);
    repo.restore.mockResolvedValue(MOCK_MODEL);
  });

  it('reactivates the model', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(true);
  });

  it('throws NotFoundException for missing model', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already active', async () => {
    repo.findById.mockResolvedValue(MOCK_MODEL as any);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
