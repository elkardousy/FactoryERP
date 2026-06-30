import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  BagStatusEnum,
  OrderStatusEnum,
  ReservationStatusEnum,
  ReleaseTypeEnum,
} from '@prisma/client';

import { ProductionOrdersRepository } from '../repositories/production-orders.repository';
import { MaterialReleaseRepository } from '../repositories/material-release.repository';
import { PhysicalBagsRepository } from '../../inventory/repositories/physical-bags.repository';
import { PhysicalBagReservationsRepository } from '../../inventory/repositories/physical-bag-reservations.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { AuditService } from '../../../core/audit/audit.service';
import { LoggerService } from '../../../core/logger/logger.service';

import { CreateReleaseGroupUseCase } from './create-release-group/create-release-group.use-case';
import { GetReleaseGroupUseCase } from './get-release-group/get-release-group.use-case';
import { ListReleaseGroupsUseCase } from './list-release-groups/list-release-groups.use-case';

import type { CreateReleaseGroupDto } from '../dto/material-release.dto';
import type { JwtPayload } from '../../auth/use-cases/login';

const MOCK_ACTOR: JwtPayload = {
  sub: BigInt(99),
  username: 'testuser',
  roleId: BigInt(1),
  sessionId: BigInt(1),
};

const MOCK_ORDER = {
  order_id: BigInt(1),
  order_number: 'PO-2026-0001',
  model_id: BigInt(2),
  line_id: BigInt(3),
  release_type: ReleaseTypeEnum.FULL,
  status: OrderStatusEnum.PLANNED,
  target_dozens: null,
  notes: null,
  created_by: BigInt(99),
  created_at: new Date('2026-06-30T00:00:00.000Z'),
  closed_by: null,
  closed_at: null,
  cmo_line_id: BigInt(7),
  production_order_parts: [],
};

const MOCK_BAG = {
  bag_id: BigInt(10),
  bag_code: 'BAG-001',
  model_id: BigInt(2),
  part_id: BigInt(5),
  customer_id: BigInt(1),
  container_id: BigInt(1),
  received_dozens: 12,
  current_dozens: 12,
  current_warehouse_id: BigInt(20),
  current_order_id: null,
  location_id: null,
  status: BagStatusEnum.RESERVED,
  received_date: new Date('2026-01-01'),
  created_by: BigInt(1),
  created_at: new Date(),
  updated_at: new Date(),
  audit_item_id: null,
};

const MOCK_RESERVATION = {
  reservation_id: BigInt(100),
  bag_id: BigInt(10),
  order_id: BigInt(1),
  reserved_dozens: 12,
  reserved_by: BigInt(1),
  reserved_at: new Date(),
  released_at: null,
  status: ReservationStatusEnum.ACTIVE,
};

const MOCK_GROUP = {
  release_group_id: BigInt(50),
  order_id: BigInt(1),
  group_number: 1,
  released_by: BigInt(99),
  released_at: new Date('2026-06-30T00:00:00.000Z'),
};

const MOCK_LINE = {
  release_line_id: BigInt(200),
  release_group_id: BigInt(50),
  order_part_id: BigInt(10),
  source_warehouse_id: BigInt(20),
  dozens_released: 12,
};

const MOCK_CMO_LINE = {
  cmo_line_id: BigInt(7),
  version: BigInt(0),
  released_dozens: 0,
};

const CREATE_DTO: CreateReleaseGroupDto = {
  lines: [
    {
      bag_id: '10',
      dozens_to_release: 12,
      source_warehouse_id: '20',
    },
  ],
};

function buildModule(
  overrides: {
    ordersRepo?: Record<string, any>;
    releaseRepo?: Record<string, any>;
    bagsRepo?: Record<string, any>;
    reservationsRepo?: Record<string, any>;
  } = {},
) {
  const ordersRepo: jest.Mocked<Partial<ProductionOrdersRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_ORDER),
    findOrderPartId: jest.fn().mockResolvedValue(BigInt(10)),
    ...overrides.ordersRepo,
  };

  const releaseRepo: jest.Mocked<Partial<MaterialReleaseRepository>> = {
    executeInTransaction: jest
      .fn()
      .mockResolvedValue({ ...MOCK_GROUP, release_group_lines: [MOCK_LINE] }),
    findGroupById: jest
      .fn()
      .mockResolvedValue({ ...MOCK_GROUP, release_group_lines: [MOCK_LINE] }),
    findGroupsByOrder: jest.fn().mockResolvedValue([MOCK_GROUP]),
    countLinesByGroup: jest.fn().mockResolvedValue(1),
    findCmoLine: jest.fn().mockResolvedValue(MOCK_CMO_LINE),
    incrementCmoReleasedDozens: jest.fn().mockResolvedValue(true),
    ...overrides.releaseRepo,
  };

  const bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>> = {
    findById: jest.fn().mockResolvedValue(MOCK_BAG),
    ...overrides.bagsRepo,
  };

  const reservationsRepo: jest.Mocked<
    Partial<PhysicalBagReservationsRepository>
  > = {
    findByBagAndOrder: jest.fn().mockResolvedValue(MOCK_RESERVATION),
    ...overrides.reservationsRepo,
  };

  const publisher: jest.Mocked<Partial<ProductionEventPublisher>> = {
    emitMaterialReleased: jest.fn(),
  };

  return Test.createTestingModule({
    providers: [
      CreateReleaseGroupUseCase,
      GetReleaseGroupUseCase,
      ListReleaseGroupsUseCase,
      { provide: ProductionOrdersRepository, useValue: ordersRepo },
      { provide: MaterialReleaseRepository, useValue: releaseRepo },
      { provide: PhysicalBagsRepository, useValue: bagsRepo },
      {
        provide: PhysicalBagReservationsRepository,
        useValue: reservationsRepo,
      },
      { provide: ProductionEventPublisher, useValue: publisher },
      {
        provide: AuditService,
        useValue: { log: jest.fn().mockResolvedValue(undefined) },
      },
      {
        provide: LoggerService,
        useValue: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
      },
    ],
  }).compile();
}

// ─── CreateReleaseGroupUseCase ────────────────────────────────────────────────

describe('CreateReleaseGroupUseCase', () => {
  it('creates release group and returns mapped response', async () => {
    const module = await buildModule();
    const useCase = module.get(CreateReleaseGroupUseCase);
    const result = await useCase.execute('1', CREATE_DTO, MOCK_ACTOR);
    expect(result.release_group_id).toBe('50');
    expect(result.order_id).toBe('1');
    expect(result.group_number).toBe(1);
    expect(result.lines).toHaveLength(1);
  });

  it('throws NotFoundException when order does not exist', async () => {
    const module = await buildModule({
      ordersRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(
      useCase.execute('999', CREATE_DTO, MOCK_ACTOR),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when order is not PLANNED', async () => {
    const module = await buildModule({
      ordersRepo: {
        findById: jest
          .fn()
          .mockResolvedValue({ ...MOCK_ORDER, status: OrderStatusEnum.DRAFT }),
      },
    });
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(useCase.execute('1', CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when duplicate bag_ids are submitted', async () => {
    const module = await buildModule();
    const useCase = module.get(CreateReleaseGroupUseCase);
    const dtoWithDuplicates: CreateReleaseGroupDto = {
      lines: [
        { bag_id: '10', dozens_to_release: 12, source_warehouse_id: '20' },
        { bag_id: '10', dozens_to_release: 12, source_warehouse_id: '20' },
      ],
    };
    await expect(
      useCase.execute('1', dtoWithDuplicates, MOCK_ACTOR),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when bag does not exist', async () => {
    const module = await buildModule({
      bagsRepo: { findById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(useCase.execute('1', CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when bag is not RESERVED', async () => {
    const module = await buildModule({
      bagsRepo: {
        findById: jest
          .fn()
          .mockResolvedValue({ ...MOCK_BAG, status: BagStatusEnum.RECEIVED }),
      },
    });
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(useCase.execute('1', CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when source_warehouse_id does not match bag location', async () => {
    const dtoWithWrongWarehouse: CreateReleaseGroupDto = {
      lines: [
        { bag_id: '10', dozens_to_release: 12, source_warehouse_id: '99' },
      ],
    };
    const module = await buildModule();
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(
      useCase.execute('1', dtoWithWrongWarehouse, MOCK_ACTOR),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when reservation does not exist for bag+order', async () => {
    const module = await buildModule({
      reservationsRepo: {
        findByBagAndOrder: jest.fn().mockResolvedValue(null),
      },
    });
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(useCase.execute('1', CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when dozens_to_release does not equal reserved_dozens', async () => {
    const dtoWithWrongDozens: CreateReleaseGroupDto = {
      lines: [
        { bag_id: '10', dozens_to_release: 6, source_warehouse_id: '20' },
      ],
    };
    const module = await buildModule();
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(
      useCase.execute('1', dtoWithWrongDozens, MOCK_ACTOR),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ConflictException when CMO optimistic lock exhausted', async () => {
    const module = await buildModule({
      releaseRepo: {
        executeInTransaction: jest.fn().mockResolvedValue({
          ...MOCK_GROUP,
          release_group_lines: [MOCK_LINE],
        }),
        findCmoLine: jest.fn().mockResolvedValue(MOCK_CMO_LINE),
        incrementCmoReleasedDozens: jest.fn().mockResolvedValue(false),
      },
    });
    const useCase = module.get(CreateReleaseGroupUseCase);
    await expect(useCase.execute('1', CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      ConflictException,
    );
  });
});

// ─── GetReleaseGroupUseCase ───────────────────────────────────────────────────

describe('GetReleaseGroupUseCase', () => {
  it('returns mapped release group detail', async () => {
    const module = await buildModule();
    const useCase = module.get(GetReleaseGroupUseCase);
    const result = await useCase.execute('50');
    expect(result.release_group_id).toBe('50');
    expect(result.lines).toHaveLength(1);
  });

  it('throws NotFoundException when release group does not exist', async () => {
    const module = await buildModule({
      releaseRepo: { findGroupById: jest.fn().mockResolvedValue(null) },
    });
    const useCase = module.get(GetReleaseGroupUseCase);
    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
  });
});

// ─── ListReleaseGroupsUseCase ─────────────────────────────────────────────────

describe('ListReleaseGroupsUseCase', () => {
  it('returns summaries with line_count for each group', async () => {
    const module = await buildModule();
    const useCase = module.get(ListReleaseGroupsUseCase);
    const result = await useCase.execute('1');
    expect(result).toHaveLength(1);
    expect(result[0].release_group_id).toBe('50');
    expect(result[0].line_count).toBe(1);
  });

  it('returns empty array when order has no release groups', async () => {
    const module = await buildModule({
      releaseRepo: { findGroupsByOrder: jest.fn().mockResolvedValue([]) },
    });
    const useCase = module.get(ListReleaseGroupsUseCase);
    const result = await useCase.execute('1');
    expect(result).toEqual([]);
  });
});
