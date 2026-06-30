import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionController } from './controllers/production.controller';
import { MaterialReleaseController } from './controllers/material-release.controller';
import { ProductionStagesController } from './controllers/production-stages.controller';
import { ProductionOrdersRepository } from './repositories/production-orders.repository';
import { MaterialReleaseRepository } from './repositories/material-release.repository';
import { ProductionStagesRepository } from './repositories/production-stages.repository';
import { ProductionEventPublisher } from './events/production-event.publisher';
import { ProductionEventListener } from './events/production-event.listener';
import { CreateProductionOrderUseCase } from './use-cases/create-production-order/create-production-order.use-case';
import { UpdateProductionOrderUseCase } from './use-cases/update-production-order/update-production-order.use-case';
import { PlanProductionOrderUseCase } from './use-cases/plan-production-order/plan-production-order.use-case';
import { StartProductionOrderUseCase } from './use-cases/start-production-order/start-production-order.use-case';
import { CompleteProductionOrderUseCase } from './use-cases/complete-production-order/complete-production-order.use-case';
import { CloseProductionOrderUseCase } from './use-cases/close-production-order/close-production-order.use-case';
import { GetProductionOrderUseCase } from './use-cases/get-production-order/get-production-order.use-case';
import { ListProductionOrdersUseCase } from './use-cases/list-production-orders/list-production-orders.use-case';
import { CreateReleaseGroupUseCase } from './use-cases/create-release-group/create-release-group.use-case';
import { GetReleaseGroupUseCase } from './use-cases/get-release-group/get-release-group.use-case';
import { ListReleaseGroupsUseCase } from './use-cases/list-release-groups/list-release-groups.use-case';
import { StartStageUseCase } from './use-cases/start-stage/start-stage.use-case';
import { RecordStageOutputUseCase } from './use-cases/record-stage-output/record-stage-output.use-case';
import { GetStageLogUseCase } from './use-cases/get-stage-log/get-stage-log.use-case';
import { ListStageLogsUseCase } from './use-cases/list-stage-logs/list-stage-logs.use-case';

@Module({
  imports: [InventoryModule],
  controllers: [
    ProductionController,
    MaterialReleaseController,
    ProductionStagesController,
  ],
  providers: [
    // Repositories
    ProductionOrdersRepository,
    MaterialReleaseRepository,
    ProductionStagesRepository,
    // Use Cases — Commands
    CreateProductionOrderUseCase,
    UpdateProductionOrderUseCase,
    PlanProductionOrderUseCase,
    StartProductionOrderUseCase,
    CompleteProductionOrderUseCase,
    CloseProductionOrderUseCase,
    CreateReleaseGroupUseCase,
    StartStageUseCase,
    RecordStageOutputUseCase,
    // Use Cases — Queries
    GetProductionOrderUseCase,
    ListProductionOrdersUseCase,
    GetReleaseGroupUseCase,
    ListReleaseGroupsUseCase,
    GetStageLogUseCase,
    ListStageLogsUseCase,
    // Event infrastructure
    ProductionEventPublisher,
    ProductionEventListener,
  ],
  exports: [ProductionOrdersRepository],
})
export class ProductionModule {}
