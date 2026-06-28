import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ReservationStatusEnum } from '@prisma/client';

import { ReservationService } from '../services/reservation.service';
import { ReservationFactory } from '../services/reservation.factory';
import { ReservationMapper } from '../services/reservation.mapper';
import { ReservationValidator } from '../services/reservation.validator';
import { PhysicalBagReservationsRepository } from '../repositories/physical-bag-reservations.repository';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { InventoryValidationRepository } from '../repositories/inventory-validation.repository';
import { LoggerService } from '../../../core/logger/logger.service';

import { CreateReservationUseCase } from './create-reservation/create-reservation.use-case';
import { ReleaseReservationUseCase } from './create-reservation/release-reservation.use-case';
import { CancelReservationUseCase } from './create-reservation/cancel-reservation.use-case';
import { ExpireReservationUseCase } from './create-reservation/expire-reservation.use-case';
import { GetReservationUseCase } from './get-reservation/get-reservation.use-case';
import { ListReservationsUseCase } from './list-reservations/list-reservations.use-case';
import { ListReservationsByBagUseCase } from './list-reservations/list-reservations-by-bag.use-case';
import { ListReservationsByOrderUseCase } from './list-reservations/list-reservations-by-order.use-case';

import { CreateReservationCommand } from './create-reservation/commands/create-reservation.command';
import { ReleaseReservationCommand } from './create-reservation/commands/release-reservation.command';
import { CancelReservationCommand } from './create-reservation/commands/cancel-reservation.command';
import { ExpireReservationCommand } from './create-reservation/commands/expire-reservation.command';
import { GetReservationQuery } from './get-reservation/queries/get-reservation.query';
import { GetReservationsQuery } from './list-reservations/queries/get-reservations.query';
import { GetReservationsByBagQuery } from './list-reservations/queries/get-reservations-by-bag.query';
import { GetReservationsByOrderQuery } from './list-reservations/queries/get-reservations-by-order.query';
import { ReservationResponseDto } from '../dto/reservation-response.dto';
import { ReservationHistoryDto } from '../dto/reservation-history.dto';

const MOCK_PAGINATION = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const MOCK_DB_RESERVATION = {
  reservation_id: BigInt(1),
  bag_id: BigInt(5),
  order_id: BigInt(10),
  reserved_dozens: { toString: () => '5.000' } as any,
  reserved_by: BigInt(99),
  reserved_at: new Date('2026-06-28T10:00:00.000Z'),
  released_at: null,
  status: ReservationStatusEnum.ACTIVE,
};

const MOCK_RESPONSE: ReservationResponseDto = {
  reservation_id: '1',
  bag_id: '5',
  order_id: '10',
  reserved_dozens: '5.000',
  reserved_by: '99',
  reserved_at: '2026-06-28T10:00:00.000Z',
  released_at: null,
  status: 'ACTIVE',
};

const MOCK_HISTORY: ReservationHistoryDto = {
  ...MOCK_RESPONSE,
  status: 'RELEASED',
};

function buildModule(overrides: Record<string, any> = {}) {
  const reservationsRepo: jest.Mocked<
    Partial<PhysicalBagReservationsRepository>
  > = {
    findById: jest.fn().mockResolvedValue(MOCK_DB_RESERVATION),
    findByBagAndOrder: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(MOCK_DB_RESERVATION),
    updateStatus: jest.fn().mockResolvedValue({
      ...MOCK_DB_RESERVATION,
      status: ReservationStatusEnum.RELEASED,
      released_at: new Date(),
    }),
    findAllWithPagination: jest.fn().mockResolvedValue({
      items: [MOCK_DB_RESERVATION],
      meta: MOCK_PAGINATION,
    }),
    findAllByBag: jest.fn().mockResolvedValue({
      items: [MOCK_DB_RESERVATION],
      meta: MOCK_PAGINATION,
    }),
    findAllByOrder: jest.fn().mockResolvedValue({
      items: [MOCK_DB_RESERVATION],
      meta: MOCK_PAGINATION,
    }),
    sumActiveReservedDozens: jest.fn().mockResolvedValue(0),
    ...overrides.reservationsRepo,
  };

  const bagsRepo: jest.Mocked<Partial<PhysicalBagsRepository>> = {
    findById: jest.fn().mockResolvedValue({
      bag_id: BigInt(5),
      current_dozens: { toString: () => '20.000' },
    }),
    ...overrides.bagsRepo,
  };

  const validationRepo: jest.Mocked<Partial<InventoryValidationRepository>> = {
    orderExists: jest.fn().mockResolvedValue(true),
    ...overrides.validationRepo,
  };

  const mapper: jest.Mocked<Partial<ReservationMapper>> = {
    toResponse: jest.fn().mockReturnValue(MOCK_RESPONSE),
    toResponseList: jest.fn().mockReturnValue([MOCK_RESPONSE]),
    toHistory: jest.fn().mockReturnValue(MOCK_HISTORY),
    toHistoryList: jest.fn().mockReturnValue([MOCK_HISTORY]),
    ...overrides.mapper,
  };

  const logger: jest.Mocked<Partial<LoggerService>> = {
    info: jest.fn(),
    error: jest.fn(),
    ...overrides.logger,
  };

  return Test.createTestingModule({
    providers: [
      ReservationService,
      ReservationFactory,
      CreateReservationUseCase,
      ReleaseReservationUseCase,
      CancelReservationUseCase,
      ExpireReservationUseCase,
      GetReservationUseCase,
      ListReservationsUseCase,
      ListReservationsByBagUseCase,
      ListReservationsByOrderUseCase,
      ReservationValidator,
      {
        provide: PhysicalBagReservationsRepository,
        useValue: reservationsRepo,
      },
      { provide: PhysicalBagsRepository, useValue: bagsRepo },
      { provide: InventoryValidationRepository, useValue: validationRepo },
      { provide: ReservationMapper, useValue: mapper },
      { provide: LoggerService, useValue: logger },
    ],
  }).compile();
}

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationsRepo: jest.Mocked<PhysicalBagReservationsRepository>;

  const CREATE_CMD = new CreateReservationCommand(
    BigInt(5),
    BigInt(10),
    5,
    BigInt(99),
  );
  const RELEASE_CMD = new ReleaseReservationCommand(BigInt(1), BigInt(99));
  const CANCEL_CMD = new CancelReservationCommand(BigInt(1), BigInt(99));
  const EXPIRE_CMD = new ExpireReservationCommand(BigInt(1), BigInt(99));

  beforeEach(async () => {
    const module = await buildModule();
    service = module.get(ReservationService);
    reservationsRepo = module.get(PhysicalBagReservationsRepository);
  });

  describe('reserve', () => {
    it('creates reservation and returns ReservationResult', async () => {
      const result = await service.reserve(CREATE_CMD);
      expect(reservationsRepo.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.reservation.bag_id).toBe('5');
    });

    it('throws ConflictException for duplicate bag+order', async () => {
      const module = await buildModule({
        reservationsRepo: {
          findByBagAndOrder: jest.fn().mockResolvedValue(MOCK_DB_RESERVATION),
        },
      });
      const svc = module.get(ReservationService);
      await expect(svc.reserve(CREATE_CMD)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws NotFoundException when bag not found', async () => {
      const module = await buildModule({
        bagsRepo: { findById: jest.fn().mockResolvedValue(null) },
      });
      const svc = module.get(ReservationService);
      await expect(svc.reserve(CREATE_CMD)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFoundException when order not found', async () => {
      const module = await buildModule({
        validationRepo: { orderExists: jest.fn().mockResolvedValue(false) },
      });
      const svc = module.get(ReservationService);
      await expect(svc.reserve(CREATE_CMD)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException when quantity exceeds available', async () => {
      const module = await buildModule({
        reservationsRepo: {
          findByBagAndOrder: jest.fn().mockResolvedValue(null),
          sumActiveReservedDozens: jest.fn().mockResolvedValue(18),
        },
        bagsRepo: {
          findById: jest.fn().mockResolvedValue({
            bag_id: BigInt(5),
            current_dozens: { toString: () => '20.000' },
          }),
        },
      });
      const svc = module.get(ReservationService);
      const cmd = new CreateReservationCommand(
        BigInt(5),
        BigInt(10),
        5,
        BigInt(99),
      );
      await expect(svc.reserve(cmd)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('throws BadRequestException when quantity is zero', async () => {
      const zeroCmd = new CreateReservationCommand(
        BigInt(5),
        BigInt(10),
        0,
        BigInt(99),
      );
      await expect(service.reserve(zeroCmd)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('release', () => {
    it('sets status to RELEASED and returns updated reservation', async () => {
      const result = await service.release(RELEASE_CMD);
      expect(reservationsRepo.updateStatus).toHaveBeenCalledWith(
        BigInt(1),
        ReservationStatusEnum.RELEASED,
        expect.any(Date),
      );
      expect(result.success).toBe(true);
    });

    it('throws NotFoundException when reservation not found', async () => {
      reservationsRepo.findById = jest.fn().mockResolvedValue(null);
      await expect(service.release(RELEASE_CMD)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException when reservation is not ACTIVE', async () => {
      reservationsRepo.findById = jest.fn().mockResolvedValue({
        ...MOCK_DB_RESERVATION,
        status: ReservationStatusEnum.RELEASED,
      });
      await expect(service.release(RELEASE_CMD)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe('cancel', () => {
    it('sets status to CANCELLED and returns updated reservation', async () => {
      await service.cancel(CANCEL_CMD);
      expect(reservationsRepo.updateStatus).toHaveBeenCalledWith(
        BigInt(1),
        ReservationStatusEnum.CANCELLED,
      );
    });

    it('throws NotFoundException when reservation not found', async () => {
      reservationsRepo.findById = jest.fn().mockResolvedValue(null);
      await expect(service.cancel(CANCEL_CMD)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException when reservation is CANCELLED', async () => {
      reservationsRepo.findById = jest.fn().mockResolvedValue({
        ...MOCK_DB_RESERVATION,
        status: ReservationStatusEnum.CANCELLED,
      });
      await expect(service.cancel(CANCEL_CMD)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe('expire', () => {
    it('sets status to CANCELLED (no EXPIRED in enum) and returns result', async () => {
      await service.expire(EXPIRE_CMD);
      expect(reservationsRepo.updateStatus).toHaveBeenCalledWith(
        BigInt(1),
        ReservationStatusEnum.CANCELLED,
      );
    });

    it('throws NotFoundException when reservation not found', async () => {
      reservationsRepo.findById = jest.fn().mockResolvedValue(null);
      await expect(service.expire(EXPIRE_CMD)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects expire on non-ACTIVE reservation', async () => {
      reservationsRepo.findById = jest.fn().mockResolvedValue({
        ...MOCK_DB_RESERVATION,
        status: ReservationStatusEnum.RELEASED,
      });
      await expect(service.expire(EXPIRE_CMD)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe('get', () => {
    it('returns mapped reservation when found', async () => {
      const result = await service.get(new GetReservationQuery(BigInt(1)));
      expect(reservationsRepo.findById).toHaveBeenCalledWith(BigInt(1));
      expect(result.reservation_id).toBe('1');
    });

    it('throws NotFoundException when not found', async () => {
      reservationsRepo.findById = jest.fn().mockResolvedValue(null);
      await expect(
        service.get(new GetReservationQuery(BigInt(999))),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('list', () => {
    it('returns paginated list', async () => {
      const result = await service.list(new GetReservationsQuery(1, 20));
      expect(reservationsRepo.findAllWithPagination).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.meta.page).toBe(1);
    });

    it('forwards filters to repository', async () => {
      await service.list(
        new GetReservationsQuery(
          1,
          20,
          ReservationStatusEnum.ACTIVE,
          BigInt(5),
          BigInt(10),
        ),
      );
      expect(reservationsRepo.findAllWithPagination).toHaveBeenCalledWith(
        {
          status: ReservationStatusEnum.ACTIVE,
          bag_id: BigInt(5),
          order_id: BigInt(10),
        },
        1,
        20,
      );
    });
  });

  describe('listByBag', () => {
    it('returns paginated history for a bag', async () => {
      const result = await service.listByBag(
        new GetReservationsByBagQuery(BigInt(5), 1, 20),
      );
      expect(reservationsRepo.findAllByBag).toHaveBeenCalledWith(
        BigInt(5),
        1,
        20,
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('listByOrder', () => {
    it('returns paginated history for an order', async () => {
      const result = await service.listByOrder(
        new GetReservationsByOrderQuery(BigInt(10), 1, 20),
      );
      expect(reservationsRepo.findAllByOrder).toHaveBeenCalledWith(
        BigInt(10),
        1,
        20,
      );
      expect(result.items).toHaveLength(1);
    });
  });
});

describe('CreateReservationUseCase', () => {
  it('delegates to ReservationService.reserve', async () => {
    const module = await buildModule();
    const useCase = module.get(CreateReservationUseCase);
    const svc = module.get(ReservationService);
    jest
      .spyOn(svc, 'reserve')
      .mockResolvedValue({ success: true, reservation: MOCK_RESPONSE });
    const cmd = new CreateReservationCommand(
      BigInt(5),
      BigInt(10),
      5,
      BigInt(99),
    );
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect(svc.reserve).toHaveBeenCalledWith(cmd);
  });
});

describe('ReleaseReservationUseCase', () => {
  it('delegates to ReservationService.release', async () => {
    const module = await buildModule();
    const useCase = module.get(ReleaseReservationUseCase);
    const svc = module.get(ReservationService);
    jest
      .spyOn(svc, 'release')
      .mockResolvedValue({ success: true, reservation: MOCK_RESPONSE });
    const cmd = new ReleaseReservationCommand(BigInt(1), BigInt(99));
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect(svc.release).toHaveBeenCalledWith(cmd);
  });
});

describe('CancelReservationUseCase', () => {
  it('delegates to ReservationService.cancel', async () => {
    const module = await buildModule();
    const useCase = module.get(CancelReservationUseCase);
    const svc = module.get(ReservationService);
    jest
      .spyOn(svc, 'cancel')
      .mockResolvedValue({ success: true, reservation: MOCK_RESPONSE });
    const cmd = new CancelReservationCommand(BigInt(1), BigInt(99));
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect(svc.cancel).toHaveBeenCalledWith(cmd);
  });
});

describe('ExpireReservationUseCase', () => {
  it('delegates to ReservationService.expire', async () => {
    const module = await buildModule();
    const useCase = module.get(ExpireReservationUseCase);
    const svc = module.get(ReservationService);
    jest
      .spyOn(svc, 'expire')
      .mockResolvedValue({ success: true, reservation: MOCK_RESPONSE });
    const cmd = new ExpireReservationCommand(BigInt(1), BigInt(99));
    const result = await useCase.execute(cmd);
    expect(result.success).toBe(true);
    expect(svc.expire).toHaveBeenCalledWith(cmd);
  });
});

describe('GetReservationUseCase', () => {
  it('delegates to ReservationService.get', async () => {
    const module = await buildModule();
    const useCase = module.get(GetReservationUseCase);
    const svc = module.get(ReservationService);
    jest.spyOn(svc, 'get').mockResolvedValue(MOCK_RESPONSE);
    const result = await useCase.execute(new GetReservationQuery(BigInt(1)));
    expect(result.reservation_id).toBe('1');
    expect(svc.get).toHaveBeenCalled();
  });
});

describe('ListReservationsUseCase', () => {
  it('delegates to ReservationService.list', async () => {
    const module = await buildModule();
    const useCase = module.get(ListReservationsUseCase);
    const svc = module.get(ReservationService);
    jest
      .spyOn(svc, 'list')
      .mockResolvedValue({ items: [MOCK_RESPONSE], meta: MOCK_PAGINATION });
    const result = await useCase.execute(new GetReservationsQuery(1, 20));
    expect(result.items).toHaveLength(1);
    expect(svc.list).toHaveBeenCalled();
  });
});

describe('ListReservationsByBagUseCase', () => {
  it('delegates to ReservationService.listByBag', async () => {
    const module = await buildModule();
    const useCase = module.get(ListReservationsByBagUseCase);
    const svc = module.get(ReservationService);
    jest
      .spyOn(svc, 'listByBag')
      .mockResolvedValue({ items: [MOCK_HISTORY], meta: MOCK_PAGINATION });
    const result = await useCase.execute(
      new GetReservationsByBagQuery(BigInt(5), 1, 20),
    );
    expect(result.items).toHaveLength(1);
    expect(svc.listByBag).toHaveBeenCalled();
  });
});

describe('ListReservationsByOrderUseCase', () => {
  it('delegates to ReservationService.listByOrder', async () => {
    const module = await buildModule();
    const useCase = module.get(ListReservationsByOrderUseCase);
    const svc = module.get(ReservationService);
    jest
      .spyOn(svc, 'listByOrder')
      .mockResolvedValue({ items: [MOCK_HISTORY], meta: MOCK_PAGINATION });
    const result = await useCase.execute(
      new GetReservationsByOrderQuery(BigInt(10), 1, 20),
    );
    expect(result.items).toHaveLength(1);
    expect(svc.listByOrder).toHaveBeenCalled();
  });
});
