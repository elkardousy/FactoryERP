import { Module } from '@nestjs/common';

import { ProductionLinesRepository } from './repositories/production-lines.repository';
import { ProductionStagesRepository } from './repositories/production-stages.repository';

import { CreateProductionLineUseCase } from './use-cases/production-lines/create-production-line.use-case';
import { GetProductionLineUseCase } from './use-cases/production-lines/get-production-line.use-case';
import { UpdateProductionLineUseCase } from './use-cases/production-lines/update-production-line.use-case';
import { ListProductionLinesUseCase } from './use-cases/production-lines/list-production-lines.use-case';
import { DeactivateProductionLineUseCase } from './use-cases/production-lines/deactivate-production-line.use-case';
import { ReactivateProductionLineUseCase } from './use-cases/production-lines/reactivate-production-line.use-case';

import { CreateProductionStageUseCase } from './use-cases/production-stages/create-production-stage.use-case';
import { GetProductionStageUseCase } from './use-cases/production-stages/get-production-stage.use-case';
import { UpdateProductionStageUseCase } from './use-cases/production-stages/update-production-stage.use-case';
import { ListProductionStagesUseCase } from './use-cases/production-stages/list-production-stages.use-case';
import { DeleteProductionStageUseCase } from './use-cases/production-stages/delete-production-stage.use-case';

import { ProductionLinesController } from './controllers/production-lines.controller';
import { ProductionStagesController } from './controllers/production-stages.controller';

@Module({
  controllers: [ProductionLinesController, ProductionStagesController],
  providers: [
    ProductionLinesRepository,
    ProductionStagesRepository,
    CreateProductionLineUseCase,
    GetProductionLineUseCase,
    UpdateProductionLineUseCase,
    ListProductionLinesUseCase,
    DeactivateProductionLineUseCase,
    ReactivateProductionLineUseCase,
    CreateProductionStageUseCase,
    GetProductionStageUseCase,
    UpdateProductionStageUseCase,
    ListProductionStagesUseCase,
    DeleteProductionStageUseCase,
  ],
})
export class ProductionSetupModule {}
