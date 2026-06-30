import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionController } from './controllers/production.controller';
import { MaterialReleaseController } from './controllers/material-release.controller';
import { ProductionStagesController } from './controllers/production-stages.controller';
import { ProductionWipController } from './controllers/production-wip.controller';
import { ProductionOrdersRepository } from './repositories/production-orders.repository';
import { MaterialReleaseRepository } from './repositories/material-release.repository';
import { ProductionStagesRepository } from './repositories/production-stages.repository';
import { ProductionWipRepository } from './repositories/production-wip.repository';
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
import { ProcessStageCompletionWipUseCase } from './use-cases/process-stage-completion-wip/process-stage-completion-wip.use-case';
import { GetWipUseCase } from './use-cases/get-wip/get-wip.use-case';
import { ListWipUseCase } from './use-cases/list-wip/list-wip.use-case';
import { GetWipHistoryUseCase } from './use-cases/get-wip-history/get-wip-history.use-case';
import { GetProductionProgressUseCase } from './use-cases/get-production-progress/get-production-progress.use-case';

@Module({
  imports: [InventoryModule],
  controllers: [
    ProductionController,
    MaterialReleaseController,
    ProductionStagesController,
    ProductionWipController,
  ],
  providers: [
    // Repositories
    ProductionOrdersRepository,
    MaterialReleaseRepository,
    ProductionStagesRepository,
    ProductionWipRepository,
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
    ProcessStageCompletionWipUseCase,
    // Use Cases — Queries
    GetProductionOrderUseCase,
    ListProductionOrdersUseCase,
    GetReleaseGroupUseCase,
    ListReleaseGroupsUseCase,
    GetStageLogUseCase,
    ListStageLogsUseCase,
    GetWipUseCase,
    ListWipUseCase,
    GetWipHistoryUseCase,
    GetProductionProgressUseCase,
    // Event infrastructure
    ProductionEventPublisher,
    ProductionEventListener,
  ],
  exports: [ProductionOrdersRepository],
})
export class ProductionModule {}
