import { Module } from '@nestjs/common';

import { MeasurementsModule } from '../measurements/measurements.module';
import { CustomersModule } from '../customers/customers.module';

import { ModelsRepository } from './repositories/models.repository';
import { ModelPartsRepository } from './repositories/model-parts.repository';
import { ModelColorsSizesRepository } from './repositories/model-colors-sizes.repository';

import { CreateModelUseCase } from './use-cases/create-model.use-case';
import { GetModelUseCase } from './use-cases/get-model.use-case';
import { UpdateModelUseCase } from './use-cases/update-model.use-case';
import { ListModelsUseCase } from './use-cases/list-models.use-case';
import { DeactivateModelUseCase } from './use-cases/deactivate-model.use-case';
import { ReactivateModelUseCase } from './use-cases/reactivate-model.use-case';
import { ManageModelPartUseCase } from './use-cases/manage-model-part.use-case';
import { ManageModelColorSizeUseCase } from './use-cases/manage-model-color-size.use-case';

import { ModelsController } from './controllers/models.controller';
import { ModelPartsController } from './controllers/model-parts.controller';
import { ModelColorsSizesController } from './controllers/model-colors-sizes.controller';

@Module({
  imports: [MeasurementsModule, CustomersModule],
  controllers: [
    ModelsController,
    ModelPartsController,
    ModelColorsSizesController,
  ],
  providers: [
    ModelsRepository,
    ModelPartsRepository,
    ModelColorsSizesRepository,
    CreateModelUseCase,
    GetModelUseCase,
    UpdateModelUseCase,
    ListModelsUseCase,
    DeactivateModelUseCase,
    ReactivateModelUseCase,
    ManageModelPartUseCase,
    ManageModelColorSizeUseCase,
  ],
})
export class GarmentModelsModule {}
