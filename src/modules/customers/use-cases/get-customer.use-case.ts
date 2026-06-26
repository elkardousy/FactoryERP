import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from '../repositories/customers.repository';

@Injectable()
export class GetCustomerUseCase {
  constructor(private readonly repo: CustomersRepository) {}

  async execute(id: number) {
    const customer = await this.repo.findById(BigInt(id));
    if (!customer) throw new NotFoundException(`Customer ${id} not found.`);
    return customer;
  }
}
