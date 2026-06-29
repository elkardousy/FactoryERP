import { Injectable } from '@nestjs/common';
import { WarehouseLocationService } from '../../services/warehouse-location.service';
import type { WarehouseHierarchyDto } from '../../dto/warehouse-location.dto';

@Injectable()
export class GetWarehouseHierarchyUseCase {
  constructor(private readonly service: WarehouseLocationService) {}

  execute(warehouseId: string): Promise<WarehouseHierarchyDto> {
    return this.service.getWarehouseHierarchy(warehouseId);
  }
}
