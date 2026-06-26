import { Injectable } from '@nestjs/common';
import { CustomersRepository } from '../repositories/customers.repository';
import { CustomerFilterDto } from '../dto/customer.dto';

@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly repo: CustomersRepository) {}

  async execute(filter: CustomerFilterDto) {
    return this.repo.findAllWithPagination(
      { search: filter.search, is_active: filter.is_active ?? true },
      filter.page,
      filter.limit,
    );
  }
}
