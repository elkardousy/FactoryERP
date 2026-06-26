import { Module } from '@nestjs/common';
import { CustomersRepository } from './repositories/customers.repository';
import { CreateCustomerUseCase } from './use-cases/create-customer.use-case';
import { GetCustomerUseCase } from './use-cases/get-customer.use-case';
import { UpdateCustomerUseCase } from './use-cases/update-customer.use-case';
import { ListCustomersUseCase } from './use-cases/list-customers.use-case';
import { DeactivateCustomerUseCase } from './use-cases/deactivate-customer.use-case';
import { ReactivateCustomerUseCase } from './use-cases/reactivate-customer.use-case';
import { CustomersController } from './controllers/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [
    CustomersRepository,
    CreateCustomerUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    ListCustomersUseCase,
    DeactivateCustomerUseCase,
    ReactivateCustomerUseCase,
  ],
  exports: [CustomersRepository],
})
export class CustomersModule {}
