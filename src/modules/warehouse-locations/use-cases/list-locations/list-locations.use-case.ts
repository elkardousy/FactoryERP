import { Injectable } from '@nestjs/common';
import { WarehouseLocationService } from '../../services/warehouse-location.service';
import type {
  LocationFilterDto,
  LocationResponseDto,
} from '../../dto/warehouse-location.dto';

@Injectable()
export class ListWarehouseLocationsUseCase {
  constructor(private readonly service: WarehouseLocationService) {}

  execute(filter: LocationFilterDto): Promise<LocationResponseDto[]> {
    return this.service.listLocations(filter);
  }
}
