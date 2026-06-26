import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DepartmentsRepository } from '../../repositories/departments.repository';
import { AuditService } from '../../../../core/audit/audit.service';
import { CreateDepartmentUseCase } from './create-department.use-case';
import { DeactivateDepartmentUseCase } from './deactivate-department.use-case';
import { ReactivateDepartmentUseCase } from './reactivate-department.use-case';

const ACTOR = BigInt(99);
const MOCK_DEPT = {
  department_id: BigInt(1),
  dept_code: 'CUTTING',
  dept_name: 'Cutting',
  description: null,
  parent_department_id: null,
  is_active: true,
  departments_parent: null,
  departments_children: [],
};

function buildModule() {
  return Test.createTestingModule({
    providers: [
      CreateDepartmentUseCase,
      DeactivateDepartmentUseCase,
      ReactivateDepartmentUseCase,
      {
        provide: DepartmentsRepository,
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

describe('CreateDepartmentUseCase', () => {
  let useCase: CreateDepartmentUseCase;
  let repo: jest.Mocked<DepartmentsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(CreateDepartmentUseCase);
    repo = m.get(DepartmentsRepository);
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockResolvedValue(MOCK_DEPT);
  });

  it('creates and returns the department', async () => {
    const result = await useCase.execute(
      { dept_code: 'CUTTING', dept_name: 'Cutting' },
      ACTOR,
    );
    expect(result.dept_code).toBe('CUTTING');
    expect(repo.create).toHaveBeenCalled();
  });

  it('throws ConflictException when code already exists', async () => {
    repo.findByCode.mockResolvedValue(MOCK_DEPT);
    await expect(
      useCase.execute({ dept_code: 'CUTTING', dept_name: 'Cutting' }, ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when parent does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(
        { dept_code: 'NEW', dept_name: 'New', parent_department_id: 999 },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DeactivateDepartmentUseCase', () => {
  let useCase: DeactivateDepartmentUseCase;
  let repo: jest.Mocked<DepartmentsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(DeactivateDepartmentUseCase);
    repo = m.get(DepartmentsRepository);
    repo.findById.mockResolvedValue(MOCK_DEPT);
    repo.softDelete.mockResolvedValue({
      ...MOCK_DEPT,
      is_active: false,
    });
  });

  it('deactivates the department', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(false);
  });

  it('throws NotFoundException when department does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already deactivated', async () => {
    repo.findById.mockResolvedValue({ ...MOCK_DEPT, is_active: false });
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws BadRequestException when active children exist', async () => {
    repo.findById.mockResolvedValue({
      ...MOCK_DEPT,
      departments_children: [
        { department_id: BigInt(2), dept_code: 'CHILD', dept_name: 'Child' },
      ],
    });
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ReactivateDepartmentUseCase', () => {
  let useCase: ReactivateDepartmentUseCase;
  let repo: jest.Mocked<DepartmentsRepository>;

  beforeEach(async () => {
    const m = await buildModule();
    useCase = m.get(ReactivateDepartmentUseCase);
    repo = m.get(DepartmentsRepository);
    repo.findById.mockResolvedValue({ ...MOCK_DEPT, is_active: false });
    repo.restore.mockResolvedValue(MOCK_DEPT);
  });

  it('reactivates the department', async () => {
    const result = await useCase.execute(1, ACTOR);
    expect(result.is_active).toBe(true);
  });

  it('throws NotFoundException when department does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(999, ACTOR)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadRequestException when already active', async () => {
    repo.findById.mockResolvedValue(MOCK_DEPT);
    await expect(useCase.execute(1, ACTOR)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
