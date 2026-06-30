import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionController } from './controllers/production.controller';
import { MaterialReleaseController } from './controllers/material-release.controller';
import { ProductionStagesController } from './controllers/production-stages.controller';
import { ProductionWipController } from './controllers/production-wip.controller';
import { ProductionQualityController } from './controllers/production-quality.controller';
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
import { ProductionQualityRepository } from './repositories/production-quality.repository';
import { RecordQualityOutputUseCase } from './use-cases/record-quality-output/record-quality-output.use-case';
import { GetQualityBoxUseCase } from './use-cases/get-quality-box/get-quality-box.use-case';
import { ListQualityBoxesUseCase } from './use-cases/list-quality-boxes/list-quality-boxes.use-case';
import { GetQualitySummaryUseCase } from './use-cases/get-quality-summary/get-quality-summary.use-case';
import { GetQualityHistoryUseCase } from './use-cases/get-quality-history/get-quality-history.use-case';
import { ProductionReturnsController } from './controllers/production-returns.controller';
import { ProductionReturnsRepository } from './repositories/production-returns.repository';
import { CreateReturnUseCase } from './use-cases/create-return/create-return.use-case';
import { GetReturnUseCase } from './use-cases/get-return/get-return.use-case';
import { ListReturnsUseCase } from './use-cases/list-returns/list-returns.use-case';
import { GetReturnHistoryUseCase } from './use-cases/get-return-history/get-return-history.use-case';
import { GetReturnSummaryUseCase } from './use-cases/get-return-summary/get-return-summary.use-case';
import { ProductionPackingController } from './controllers/production-packing.controller';
import { ProductionPackingRepository } from './repositories/production-packing.repository';
import { CreatePackingOrderUseCase } from './use-cases/create-packing-order/create-packing-order.use-case';
import { AddAssemblyUseCase } from './use-cases/add-assembly/add-assembly.use-case';
import { VerifyPackingUseCase } from './use-cases/verify-packing/verify-packing.use-case';
import { PostPackingOrderUseCase } from './use-cases/post-packing-order/post-packing-order.use-case';
import { GetPackingOrderUseCase } from './use-cases/get-packing-order/get-packing-order.use-case';
import { ListPackingOrdersUseCase } from './use-cases/list-packing-orders/list-packing-orders.use-case';
import { GetPackingHistoryUseCase } from './use-cases/get-packing-history/get-packing-history.use-case';
import { GetPackingSummaryUseCase } from './use-cases/get-packing-summary/get-packing-summary.use-case';

@Module({
  imports: [InventoryModule],
  controllers: [
    ProductionController,
    MaterialReleaseController,
    ProductionStagesController,
    ProductionWipController,
    ProductionQualityController,
    ProductionReturnsController,
    ProductionPackingController,
  ],
  providers: [
    // Repositories
    ProductionOrdersRepository,
    MaterialReleaseRepository,
    ProductionStagesRepository,
    ProductionWipRepository,
    ProductionQualityRepository,
    ProductionReturnsRepository,
    ProductionPackingRepository,
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
    RecordQualityOutputUseCase,
    CreateReturnUseCase,
    CreatePackingOrderUseCase,
    AddAssemblyUseCase,
    VerifyPackingUseCase,
    PostPackingOrderUseCase,
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
    GetQualityBoxUseCase,
    ListQualityBoxesUseCase,
    GetQualitySummaryUseCase,
    GetQualityHistoryUseCase,
    GetReturnUseCase,
    ListReturnsUseCase,
    GetReturnHistoryUseCase,
    GetReturnSummaryUseCase,
    GetPackingOrderUseCase,
    ListPackingOrdersUseCase,
    GetPackingHistoryUseCase,
    GetPackingSummaryUseCase,
    // Event infrastructure
    ProductionEventPublisher,
    ProductionEventListener,
  ],
  exports: [ProductionOrdersRepository],
})
export class ProductionModule {}
