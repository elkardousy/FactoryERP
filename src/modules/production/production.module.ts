import { Module } from '@nestjs/common';
import { ProductionController } from './controllers/production.controller';
import { ProductionOrdersRepository } from './repositories/production-orders.repository';
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

@Module({
  controllers: [ProductionController],
  providers: [
    // Repository
    ProductionOrdersRepository,
    // Use Cases — Commands
    CreateProductionOrderUseCase,
    UpdateProductionOrderUseCase,
    PlanProductionOrderUseCase,
    StartProductionOrderUseCase,
    CompleteProductionOrderUseCase,
    CloseProductionOrderUseCase,
    // Use Cases — Queries
    GetProductionOrderUseCase,
    ListProductionOrdersUseCase,
    // Event infrastructure
    ProductionEventPublisher,
    ProductionEventListener,
  ],
  exports: [ProductionOrdersRepository],
})
export class ProductionModule {}
