import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { WarehouseLocationRepository } from '../repositories/warehouse-location.repository';
import type {
  CreateWarehouseLocationDto,
  LocationFilterDto,
  LocationResponseDto,
  WarehouseHierarchyDto,
  ZoneGroupDto,
  RackGroupDto,
  ShelfGroupDto,
} from '../dto/warehouse-location.dto';
import type { warehouse_locations } from '@prisma/client';

@Injectable()
export class WarehouseLocationService {
  constructor(
    private readonly repo: WarehouseLocationRepository,
    private readonly logger: LoggerService,
  ) {}

  async createLocation(
    dto: CreateWarehouseLocationDto,
  ): Promise<LocationResponseDto> {
    this.validateHierarchy(
      dto.zone_code,
      dto.rack_code,
      dto.shelf_code,
      dto.bin_code,
    );

    const warehouseId = BigInt(dto.warehouse_id);
    const locationCode = this.buildLocationCode(
      dto.zone_code,
      dto.rack_code,
      dto.shelf_code,
      dto.bin_code,
    );

    const exists = await this.repo.existsByCode(warehouseId, locationCode);
    if (exists) {
      throw new ConflictException(
        `Location "${locationCode}" already exists in warehouse ${dto.warehouse_id}`,
      );
    }

    const location = await this.repo.create({
      warehouse_id: warehouseId,
      zone_code: dto.zone_code,
      rack_code: dto.rack_code ?? null,
      shelf_code: dto.shelf_code ?? null,
      bin_code: dto.bin_code ?? null,
      location_code: locationCode,
      is_active: true,
      capacity_dozens: dto.capacity_dozens ?? null,
    });

    this.logger.info(`Warehouse location created: ${location.location_id.toString()}`);
    return this.toDto(location);
  }

  async getLocation(locationId: string): Promise<LocationResponseDto> {
    const location = await this.repo.findById(BigInt(locationId));
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }
    return this.toDto(location);
  }

  async listLocations(
    filter: LocationFilterDto,
  ): Promise<LocationResponseDto[]> {
    const locations = await this.repo.findMany({
      warehouse_id: filter.warehouse_id
        ? BigInt(filter.warehouse_id)
        : undefined,
      zone_code: filter.zone_code,
      is_active: filter.is_active,
    });
    return locations.map((l) => this.toDto(l));
  }

  async updateLocationStatus(
    locationId: string,
    isActive: boolean,
  ): Promise<LocationResponseDto> {
    const location = await this.repo.findById(BigInt(locationId));
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }
    const updated = await this.repo.updateStatus(BigInt(locationId), isActive);
    this.logger.info(`Location ${locationId} status updated to ${isActive}`);
    return this.toDto(updated);
  }

  async getWarehouseHierarchy(
    warehouseId: string,
  ): Promise<WarehouseHierarchyDto> {
    const locations = await this.repo.findMany({
      warehouse_id: BigInt(warehouseId),
    });
    return this.buildHierarchy(warehouseId, locations);
  }

  async validateLocationForBag(
    locationId: string,
    bagCurrentWarehouseId: string | null,
  ): Promise<void> {
    const location = await this.repo.findById(BigInt(locationId));
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }
    if (!location.is_active) {
      throw new UnprocessableEntityException(
        `Location ${locationId} is not active`,
      );
    }
    if (bagCurrentWarehouseId !== null) {
      if (location.warehouse_id.toString() !== bagCurrentWarehouseId) {
        throw new BadRequestException(
          `Location ${locationId} belongs to warehouse ${location.warehouse_id} but bag is in warehouse ${bagCurrentWarehouseId}`,
        );
      }
    }
  }

  async validateCapacity(
    locationId: string,
    requiredDozens: number,
  ): Promise<void> {
    const location = await this.repo.findById(BigInt(locationId));
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }
    if (location.capacity_dozens === null) return;

    const inUse = await this.repo.sumCapacityInUse(BigInt(locationId));
    const capacity = Number(location.capacity_dozens);
    if (inUse + requiredDozens > capacity) {
      throw new UnprocessableEntityException(
        `Location ${locationId} capacity exceeded: ${inUse + requiredDozens} > ${capacity} dozens`,
      );
    }
  }

  private validateHierarchy(
    zone: string,
    rack?: string,
    shelf?: string,
    bin?: string,
  ): void {
    if (bin && !shelf) {
      throw new BadRequestException('Bin requires a shelf code');
    }
    if (shelf && !rack) {
      throw new BadRequestException('Shelf requires a rack code');
    }
    if (rack && !zone) {
      throw new BadRequestException('Rack requires a zone code');
    }
  }

  buildLocationCode(
    zone: string,
    rack?: string | null,
    shelf?: string | null,
    bin?: string | null,
  ): string {
    let code = zone;
    if (rack) code += `-${rack}`;
    if (shelf) code += `-${shelf}`;
    if (bin) code += `-${bin}`;
    return code;
  }

  private buildHierarchy(
    warehouseId: string,
    locations: warehouse_locations[],
  ): WarehouseHierarchyDto {
    const zoneMap = new Map<
      string,
      Map<string | null, Map<string | null, warehouse_locations[]>>
    >();

    for (const loc of locations) {
      if (!zoneMap.has(loc.zone_code)) {
        zoneMap.set(loc.zone_code, new Map());
      }
      const rackMap = zoneMap.get(loc.zone_code)!;
      const rackKey = loc.rack_code ?? null;
      if (!rackMap.has(rackKey)) {
        rackMap.set(rackKey, new Map());
      }
      const shelfMap = rackMap.get(rackKey)!;
      const shelfKey = loc.shelf_code ?? null;
      if (!shelfMap.has(shelfKey)) {
        shelfMap.set(shelfKey, []);
      }
      shelfMap.get(shelfKey)!.push(loc);
    }

    const zones: ZoneGroupDto[] = [];
    for (const [zoneCode, rackMap] of zoneMap) {
      const racks: RackGroupDto[] = [];
      const zoneOnly: LocationResponseDto[] = [];

      for (const [rackCode, shelfMap] of rackMap) {
        if (rackCode === null) {
          for (const [, locs] of shelfMap) {
            zoneOnly.push(...locs.map((l) => this.toDto(l)));
          }
          continue;
        }

        const shelves: ShelfGroupDto[] = [];
        const rackOnly: LocationResponseDto[] = [];
        for (const [shelfCode, locs] of shelfMap) {
          if (shelfCode === null) {
            rackOnly.push(...locs.map((l) => this.toDto(l)));
            continue;
          }
          const bins: LocationResponseDto[] = [];
          const shelfOnly: LocationResponseDto[] = [];
          for (const loc of locs) {
            if (loc.bin_code === null) {
              shelfOnly.push(this.toDto(loc));
            } else {
              bins.push(this.toDto(loc));
            }
          }
          shelves.push({
            shelf_code: shelfCode,
            bins,
            shelf_only_locations: shelfOnly,
          });
        }
        racks.push({
          rack_code: rackCode,
          shelves,
          rack_only_locations: rackOnly,
        });
      }
      zones.push({ zone_code: zoneCode, racks, zone_only_locations: zoneOnly });
    }

    const activeCount = locations.filter((l) => l.is_active).length;
    return {
      warehouse_id: warehouseId,
      zones,
      total_locations: locations.length,
      active_locations: activeCount,
    };
  }

  private toDto(location: warehouse_locations): LocationResponseDto {
    return {
      location_id: location.location_id.toString(),
      warehouse_id: location.warehouse_id.toString(),
      zone_code: location.zone_code,
      rack_code: location.rack_code,
      shelf_code: location.shelf_code,
      bin_code: location.bin_code,
      location_code: location.location_code,
      is_active: location.is_active,
      capacity_dozens: location.capacity_dozens?.toString() ?? null,
      created_at: location.created_at.toISOString(),
    };
  }
}
