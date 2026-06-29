import { Module } from '@nestjs/common';
import { WarehouseLocationRepository } from './repositories/warehouse-location.repository';
import { WarehouseLocationService } from './services/warehouse-location.service';
import { CreateWarehouseLocationUseCase } from './use-cases/create-location/create-location.use-case';
import { GetWarehouseLocationUseCase } from './use-cases/get-location/get-location.use-case';
import { ListWarehouseLocationsUseCase } from './use-cases/list-locations/list-locations.use-case';
import { UpdateLocationStatusUseCase } from './use-cases/update-location-status/update-location-status.use-case';
import { GetWarehouseHierarchyUseCase } from './use-cases/get-warehouse-hierarchy/get-warehouse-hierarchy.use-case';
import { ValidateLocationUseCase } from './use-cases/validate-location/validate-location.use-case';
import { WarehouseLocationsController } from './controllers/warehouse-locations.controller';

@Module({
  controllers: [WarehouseLocationsController],
  providers: [
    WarehouseLocationRepository,
    WarehouseLocationService,
    CreateWarehouseLocationUseCase,
    GetWarehouseLocationUseCase,
    ListWarehouseLocationsUseCase,
    UpdateLocationStatusUseCase,
    GetWarehouseHierarchyUseCase,
    ValidateLocationUseCase,
  ],
  exports: [WarehouseLocationService, WarehouseLocationRepository],
})
export class WarehouseLocationsModule {}
