import { Injectable, NotFoundException } from '@nestjs/common';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class GetSupplierUseCase {
  constructor(private readonly repo: SuppliersRepository) {}

  async execute(id: number) {
    const supplier = await this.repo.findById(BigInt(id));
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found.`);
    return supplier;
  }
}
