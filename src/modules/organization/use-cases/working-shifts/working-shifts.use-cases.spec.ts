import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { WorkingShiftsRepository } from '../../repositories/working-shifts.repository';
import { AuditService } from '../../../../core/audit/audit.service';
import { CreateWorkingShiftUseCase } from './create-working-shift.use-case';
import { DeactivateWorkingShiftUseCase } from './deactivate-working-shift.use-case';
import { ReactivateWorkingShiftUseCase } from './reactivate-working-shift.use-case';

const ACTOR = BigInt(99);
const MOCK_SHIFT = {
  shift_id: BigInt(1),
  shift_code: 'MORNING',
  shift_name: 'Morning Shift',
  start_time: new Date('1970-01-01T06:00:00.000Z'),
  end_time: new Date('1970-01-01T14:00:00.000Z'),
  is_active: true,
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateWorkingShiftUseCase,
      DeactivateWorkingShiftUseCase,
      ReactivateWorkingShiftUseCase,
      {
        provide: WorkingShiftsRepository,
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

describe('CreateWorkingShiftUseCase', () => {
  let useCase: CreateWorkingShiftUseCase;
  let repo: jest.Mocked<WorkingShiftsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateWorkingShiftUseCase);
    repo = m.get(WorkingShiftsRepository);
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(MOCK_SHIFT);
  });

  it('creates and returns the shift', async () => {
    const result = await useCase.execute(
      {
        shift_code: 'MORNING',
        shift_name: 'Morning Shift',
        start_time: '06:00',
        end_time: '14:00',
      },
      ACTOR,
    );
    expect(result.shift_code).toBe('MORNING');
  });

  it('throws ConflictException on duplicate shift code', async () => {
    repo.findByCode.mockResolvedValue(MOCK_SHIFT);
    await expect(
      useCase.execute(
        {
          shift_code: 'MORNING',
          shift_name: 'Dup',
          start_time: '06:00',
          end_time: '14:00',
        },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DeactivateWorkingShiftUseCase', () => {
  let useCase: DeactivateWorkingShiftUseCase;
  let repo: jest.Mocked<WorkingShiftsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeactivateWorkingShiftUseCase);
    repo = m.get(WorkingShiftsRepository);
    repo.findById.mockResolvedValue(MOCK_SHIFT);
    repo.softDelete.mockResolvedValue({
      ...MOCK_SHIFT,
      is_active: false,
    });
  });

  it('deactivates the shift', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException for unknown shift', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException if already deactivated', async () => {
    repo.findById.mockResolvedValue({ ...MOCK_SHIFT, is_active: false });
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ReactivateWorkingShiftUseCase', () => {
  let useCase: ReactivateWorkingShiftUseCase;
  let repo: jest.Mocked<WorkingShiftsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(ReactivateWorkingShiftUseCase);
    repo = m.get(WorkingShiftsRepository);
    repo.findById.mockResolvedValue({ ...MOCK_SHIFT, is_active: false });
    repo.restore.mockResolvedValue(MOCK_SHIFT);
  });

  it('restores the shift', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(true);
  });

  it('throws NotFoundException for unknown shift', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException if already active', async () => {
    repo.findById.mockResolvedValue(MOCK_SHIFT);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
