import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductionLinesRepository } from '../../repositories/production-lines.repository';
import { AuditService } from '../../../../core/audit/audit.service';
import { CreateProductionLineUseCase } from './create-production-line.use-case';
import { DeactivateProductionLineUseCase } from './deactivate-production-line.use-case';
import { ReactivateProductionLineUseCase } from './reactivate-production-line.use-case';

const ACTOR = BigInt(99);
const MOCK_LINE = {
  line_id: BigInt(1),
  line_code: 'L-01',
  line_name: 'Line 1',
  is_active: true,
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateProductionLineUseCase,
      DeactivateProductionLineUseCase,
      ReactivateProductionLineUseCase,
      {
        provide: ProductionLinesRepository,
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

describe('CreateProductionLineUseCase', () => {
  let useCase: CreateProductionLineUseCase;
  let repo: jest.Mocked<ProductionLinesRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateProductionLineUseCase);
    repo = m.get(ProductionLinesRepository);
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(MOCK_LINE);
  });

  it('creates and returns the production line', async () => {
    const result = await useCase.execute(
      { line_code: 'L-01', line_name: 'Line 1' },
      ACTOR,
    );
    expect(result.line_code).toBe('L-01');
  });

  it('throws ConflictException on duplicate code', async () => {
    repo.findByCode.mockResolvedValue(MOCK_LINE);
    await expect(
      useCase.execute({ line_code: 'L-01', line_name: 'Dup' }, ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DeactivateProductionLineUseCase', () => {
  let useCase: DeactivateProductionLineUseCase;
  let repo: jest.Mocked<ProductionLinesRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeactivateProductionLineUseCase);
    repo = m.get(ProductionLinesRepository);
    repo.findById.mockResolvedValue(MOCK_LINE);
    repo.softDelete.mockResolvedValue({
      ...MOCK_LINE,
      is_active: false,
    });
  });

  it('deactivates the production line', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException for missing production line', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already deactivated', async () => {
    repo.findById.mockResolvedValue({ ...MOCK_LINE, is_active: false });
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ReactivateProductionLineUseCase', () => {
  let useCase: ReactivateProductionLineUseCase;
  let repo: jest.Mocked<ProductionLinesRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(ReactivateProductionLineUseCase);
    repo = m.get(ProductionLinesRepository);
    repo.findById.mockResolvedValue({ ...MOCK_LINE, is_active: false });
    repo.restore.mockResolvedValue(MOCK_LINE);
  });

  it('restores the production line', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(true);
  });

  it('throws NotFoundException for missing production line', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already active', async () => {
    repo.findById.mockResolvedValue(MOCK_LINE);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
