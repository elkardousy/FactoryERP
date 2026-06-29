import { Injectable } from '@nestjs/common';
import { WarehouseLocationService } from '../../services/warehouse-location.service';
import type { LocationResponseDto } from '../../dto/warehouse-location.dto';

@Injectable()
export class GetWarehouseLocationUseCase {
  constructor(private readonly service: WarehouseLocationService) {}

  execute(locationId: string): Promise<LocationResponseDto> {
    return this.service.getLocation(locationId);
  }
}
