import { Injectable } from '@nestjs/common';
import { WarehouseLocationService } from '../../services/warehouse-location.service';
import type { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import type {
  LocationFilterDto,
  LocationResponseDto,
} from '../../dto/warehouse-location.dto';

@Injectable()
export class ListWarehouseLocationsUseCase {
  constructor(private readonly service: WarehouseLocationService) {}

  execute(
    filter: LocationFilterDto,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<LocationResponseDto>> {
    return this.service.listLocations(filter, page, limit);
  }
}
