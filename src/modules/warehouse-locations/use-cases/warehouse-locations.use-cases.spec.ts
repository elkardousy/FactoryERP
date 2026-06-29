import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WarehouseLocationService } from '../services/warehouse-location.service';
import { WarehouseLocationRepository } from '../repositories/warehouse-location.repository';

const MOCK_PAGINATION = {
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const mockRepo = (): jest.Mocked<WarehouseLocationRepository> =>
  ({
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    findManyWithPagination: jest.fn(),
    updateStatus: jest.fn(),
    existsByCode: jest.fn(),
    sumCapacityInUse: jest.fn(),
  }) as unknown as jest.Mocked<WarehouseLocationRepository>;

const mockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

const buildLocation = (overrides: Partial<any> = {}): any => ({
  location_id: BigInt(1),
  warehouse_id: BigInt(10),
  zone_code: 'A',
  rack_code: 'R1',
  shelf_code: 'S1',
  bin_code: 'B1',
  location_code: 'A-R1-S1-B1',
  is_active: true,
  capacity_dozens: null,
  created_at: new Date('2026-06-01T00:00:00Z'),
  ...overrides,
});

describe('WarehouseLocationService', () => {
  let service: WarehouseLocationService;
  let repo: jest.Mocked<WarehouseLocationRepository>;

  beforeEach(() => {
    repo = mockRepo();
    service = new WarehouseLocationService(repo, mockLogger() as any);
  });

  describe('createLocation', () => {
    it('creates a location with computed code', async () => {
      (repo.existsByCode as jest.Mock).mockResolvedValue(false);
      (repo.create as jest.Mock).mockResolvedValue(buildLocation());

      const result = await service.createLocation({
        warehouse_id: '10',
        zone_code: 'A',
        rack_code: 'R1',
        shelf_code: 'S1',
        bin_code: 'B1',
      });

      expect(result.location_code).toBe('A-R1-S1-B1');
      expect(result.warehouse_id).toBe('10');
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when location code already exists', async () => {
      (repo.existsByCode as jest.Mock).mockResolvedValue(true);

      await expect(
        service.createLocation({ warehouse_id: '10', zone_code: 'A' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequestException when bin provided without shelf', async () => {
      await expect(
        service.createLocation({
          warehouse_id: '10',
          zone_code: 'A',
          rack_code: 'R1',
          bin_code: 'B1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when shelf provided without rack', async () => {
      await expect(
        service.createLocation({
          warehouse_id: '10',
          zone_code: 'A',
          shelf_code: 'S1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getLocation', () => {
    it('returns location when found', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(buildLocation());

      const result = await service.getLocation('1');

      expect(result.location_id).toBe('1');
    });

    it('throws NotFoundException when location does not exist', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getLocation('999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('listLocations', () => {
    it('returns paginated list with warehouse filter applied', async () => {
      const locations = [
        buildLocation(),
        buildLocation({ location_id: BigInt(2), location_code: 'A-R2' }),
      ];
      (repo.findManyWithPagination as jest.Mock).mockResolvedValue({
        items: locations,
        meta: MOCK_PAGINATION,
      });

      const result = await service.listLocations({ warehouse_id: '10' }, 1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(repo.findManyWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({ warehouse_id: BigInt(10) }),
        1,
        20,
      );
    });

    it('passes zone filter to repository', async () => {
      (repo.findManyWithPagination as jest.Mock).mockResolvedValue({
        items: [],
        meta: { ...MOCK_PAGINATION, total: 0 },
      });

      await service.listLocations({ zone_code: 'B' }, 1, 20);

      expect(repo.findManyWithPagination).toHaveBeenCalledWith(
        expect.objectContaining({ zone_code: 'B' }),
        1,
        20,
      );
    });
  });

  describe('updateLocationStatus', () => {
    it('activates an existing location', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(
        buildLocation({ is_active: false }),
      );
      (repo.updateStatus as jest.Mock).mockResolvedValue(
        buildLocation({ is_active: true }),
      );

      const result = await service.updateLocationStatus('1', true);

      expect(result.is_active).toBe(true);
    });

    it('throws NotFoundException when location does not exist', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateLocationStatus('999', false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getWarehouseHierarchy', () => {
    it('groups locations by zone', async () => {
      const locations = [
        buildLocation({
          zone_code: 'A',
          rack_code: null,
          shelf_code: null,
          bin_code: null,
          location_code: 'A',
        }),
        buildLocation({
          location_id: BigInt(2),
          zone_code: 'B',
          rack_code: null,
          shelf_code: null,
          bin_code: null,
          location_code: 'B',
        }),
      ];
      (repo.findMany as jest.Mock).mockResolvedValue(locations);

      const hierarchy = await service.getWarehouseHierarchy('10');

      expect(hierarchy.zones).toHaveLength(2);
      expect(hierarchy.total_locations).toBe(2);
      expect(hierarchy.active_locations).toBe(2);
    });
  });

  describe('validateLocationForBag', () => {
    it('passes when location is active and same warehouse', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(
        buildLocation({ warehouse_id: BigInt(10) }),
      );

      await expect(
        service.validateLocationForBag('1', '10'),
      ).resolves.toBeUndefined();
    });

    it('throws UnprocessableEntityException when location is inactive', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(
        buildLocation({ is_active: false }),
      );

      await expect(
        service.validateLocationForBag('1', '10'),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('throws BadRequestException when location is in a different warehouse', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(
        buildLocation({ warehouse_id: BigInt(99) }),
      );

      await expect(
        service.validateLocationForBag('1', '10'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('validateCapacity', () => {
    it('passes when location has no capacity limit', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(
        buildLocation({ capacity_dozens: null }),
      );

      await expect(service.validateCapacity('1', 500)).resolves.toBeUndefined();
      expect(repo.sumCapacityInUse).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when capacity would be exceeded', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(
        buildLocation({ capacity_dozens: { toString: () => '10' } }),
      );
      (repo.sumCapacityInUse as jest.Mock).mockResolvedValue(8);

      await expect(service.validateCapacity('1', 5)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('passes when adding dozens stays within capacity', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(
        buildLocation({ capacity_dozens: { toString: () => '20' } }),
      );
      (repo.sumCapacityInUse as jest.Mock).mockResolvedValue(10);

      await expect(service.validateCapacity('1', 5)).resolves.toBeUndefined();
    });
  });

  describe('buildLocationCode', () => {
    it('returns zone-only code', () => {
      expect(service.buildLocationCode('A')).toBe('A');
    });

    it('returns zone-rack code', () => {
      expect(service.buildLocationCode('A', 'R1')).toBe('A-R1');
    });

    it('returns full hierarchy code', () => {
      expect(service.buildLocationCode('A', 'R1', 'S2', 'B3')).toBe(
        'A-R1-S2-B3',
      );
    });
  });
});
