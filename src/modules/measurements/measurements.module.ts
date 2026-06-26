import { Module } from '@nestjs/common';

import { ColorsRepository } from './repositories/colors.repository';
import { SizesRepository } from './repositories/sizes.repository';

import { CreateColorUseCase } from './use-cases/colors/create-color.use-case';
import { GetColorUseCase } from './use-cases/colors/get-color.use-case';
import { UpdateColorUseCase } from './use-cases/colors/update-color.use-case';
import { ListColorsUseCase } from './use-cases/colors/list-colors.use-case';
import { DeleteColorUseCase } from './use-cases/colors/delete-color.use-case';

import { CreateSizeUseCase } from './use-cases/sizes/create-size.use-case';
import { GetSizeUseCase } from './use-cases/sizes/get-size.use-case';
import { UpdateSizeUseCase } from './use-cases/sizes/update-size.use-case';
import { ListSizesUseCase } from './use-cases/sizes/list-sizes.use-case';
import { DeleteSizeUseCase } from './use-cases/sizes/delete-size.use-case';

import { ColorsController } from './controllers/colors.controller';
import { SizesController } from './controllers/sizes.controller';

@Module({
  controllers: [ColorsController, SizesController],
  providers: [
    ColorsRepository,
    SizesRepository,
    CreateColorUseCase,
    GetColorUseCase,
    UpdateColorUseCase,
    ListColorsUseCase,
    DeleteColorUseCase,
    CreateSizeUseCase,
    GetSizeUseCase,
    UpdateSizeUseCase,
    ListSizesUseCase,
    DeleteSizeUseCase,
  ],
  exports: [ColorsRepository, SizesRepository],
})
export class MeasurementsModule {}
