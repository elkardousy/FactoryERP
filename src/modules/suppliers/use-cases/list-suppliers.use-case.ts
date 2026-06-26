import { Injectable } from '@nestjs/common';
import { SuppliersRepository } from '../repositories/suppliers.repository';
import { SupplierFilterDto } from '../dto/supplier.dto';

@Injectable()
export class ListSuppliersUseCase {
  constructor(private readonly repo: SuppliersRepository) {}

  async execute(filter: SupplierFilterDto) {
    return this.repo.findAllWithPagination(
      { search: filter.search, is_active: filter.is_active ?? true },
      filter.page,
      filter.limit,
    );
  }
}
