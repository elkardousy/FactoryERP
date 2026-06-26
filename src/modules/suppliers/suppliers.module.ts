import { Module } from '@nestjs/common';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { CreateSupplierUseCase } from './use-cases/create-supplier.use-case';
import { GetSupplierUseCase } from './use-cases/get-supplier.use-case';
import { UpdateSupplierUseCase } from './use-cases/update-supplier.use-case';
import { ListSuppliersUseCase } from './use-cases/list-suppliers.use-case';
import { DeactivateSupplierUseCase } from './use-cases/deactivate-supplier.use-case';
import { ReactivateSupplierUseCase } from './use-cases/reactivate-supplier.use-case';
import { SuppliersController } from './controllers/suppliers.controller';

@Module({
  controllers: [SuppliersController],
  providers: [
    SuppliersRepository,
    CreateSupplierUseCase,
    GetSupplierUseCase,
    UpdateSupplierUseCase,
    ListSuppliersUseCase,
    DeactivateSupplierUseCase,
    ReactivateSupplierUseCase,
  ],
})
export class SuppliersModule {}
