import { Module } from '@nestjs/common';
import { WarehousesRepository } from './repositories/warehouses.repository';
import { CreateWarehouseUseCase } from './use-cases/create-warehouse.use-case';
import { GetWarehouseUseCase } from './use-cases/get-warehouse.use-case';
import { UpdateWarehouseUseCase } from './use-cases/update-warehouse.use-case';
import { ListWarehousesUseCase } from './use-cases/list-warehouses.use-case';
import { DeactivateWarehouseUseCase } from './use-cases/deactivate-warehouse.use-case';
import { ReactivateWarehouseUseCase } from './use-cases/reactivate-warehouse.use-case';
import { WarehousesController } from './controllers/warehouses.controller';

@Module({
  controllers: [WarehousesController],
  providers: [
    WarehousesRepository,
    CreateWarehouseUseCase,
    GetWarehouseUseCase,
    UpdateWarehouseUseCase,
    ListWarehousesUseCase,
    DeactivateWarehouseUseCase,
    ReactivateWarehouseUseCase,
  ],
})
export class WarehousesModule {}
