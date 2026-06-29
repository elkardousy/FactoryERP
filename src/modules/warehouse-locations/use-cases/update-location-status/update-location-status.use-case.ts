import { Injectable } from '@nestjs/common';
import { WarehouseLocationService } from '../../services/warehouse-location.service';
import type { LocationResponseDto } from '../../dto/warehouse-location.dto';

@Injectable()
export class UpdateLocationStatusUseCase {
  constructor(private readonly service: WarehouseLocationService) {}

  execute(locationId: string, isActive: boolean): Promise<LocationResponseDto> {
    return this.service.updateLocationStatus(locationId, isActive);
  }
}
