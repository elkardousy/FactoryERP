import { Injectable } from '@nestjs/common';
import { WarehouseLocationService } from '../../services/warehouse-location.service';

export interface ValidationResult {
  location_id: string;
  is_valid: boolean;
  message: string;
}

@Injectable()
export class ValidateLocationUseCase {
  constructor(private readonly service: WarehouseLocationService) {}

  async execute(
    locationId: string,
    bagCurrentWarehouseId: string | null,
    requiredDozens?: number,
  ): Promise<ValidationResult> {
    await this.service.validateLocationForBag(
      locationId,
      bagCurrentWarehouseId,
    );
    if (requiredDozens !== undefined && requiredDozens > 0) {
      await this.service.validateCapacity(locationId, requiredDozens);
    }
    return {
      location_id: locationId,
      is_valid: true,
      message: 'Location is valid for the requested operation',
    };
  }
}
