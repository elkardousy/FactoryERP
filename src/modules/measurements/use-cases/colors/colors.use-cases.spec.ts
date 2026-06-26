import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ColorsRepository } from '../../repositories/colors.repository';
import { AuditService } from '../../../../core/audit/audit.service';
import { CreateColorUseCase } from './create-color.use-case';
import { DeleteColorUseCase } from './delete-color.use-case';

const ACTOR = BigInt(99);
const MOCK_COLOR = {
  color_id: BigInt(1),
  color_code: 'RED',
  color_name: 'Red',
  hex_value: '#FF0000',
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateColorUseCase,
      DeleteColorUseCase,
      {
        provide: ColorsRepository,
        useValue: {
          findByCode: jest.fn(),
          findById: jest.fn(),
          create: jest.fn(),
          delete: jest.fn(),
        },
      },
      {
        provide: AuditService,
        useValue: { log: jest.fn().mockResolvedValue(undefined) },
      },
    ],
  }).compile();
}

describe('CreateColorUseCase', () => {
  let useCase: CreateColorUseCase;
  let repo: jest.Mocked<ColorsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateColorUseCase);
    repo = m.get(ColorsRepository);
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(MOCK_COLOR);
  });

  it('creates and returns the color', async () => {
    const result = await useCase.execute(
      { color_code: 'RED', color_name: 'Red', hex_value: '#FF0000' },
      ACTOR,
    );
    expect(result.color_code).toBe('RED');
  });

  it('throws ConflictException on duplicate code', async () => {
    repo.findByCode.mockResolvedValue(MOCK_COLOR);
    await expect(
      useCase.execute({ color_code: 'RED', color_name: 'Dup' }, ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DeleteColorUseCase', () => {
  let useCase: DeleteColorUseCase;
  let repo: jest.Mocked<ColorsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeleteColorUseCase);
    repo = m.get(ColorsRepository);
    repo.findById.mockResolvedValue(MOCK_COLOR);
    repo.delete.mockResolvedValue(undefined);
  });

  it('deletes the color successfully', async () => {
    await expect(useCase.execute(1, ACTOR)).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith(BigInt(1));
  });

  it('throws NotFoundException for unknown color', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
