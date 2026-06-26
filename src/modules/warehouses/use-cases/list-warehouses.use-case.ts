import { Injectable } from '@nestjs/common';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { WarehouseFilterDto } from '../dto/warehouse.dto';

@Injectable()
export class ListWarehousesUseCase {
  constructor(private readonly repo: WarehousesRepository) {}

  async execute(filter: WarehouseFilterDto) {
    return this.repo.findAllWithPagination(
      {
        search: filter.search,
        warehouse_type: filter.warehouse_type,
        is_active: filter.is_active ?? true,
      },
      filter.page,
      filter.limit,
    );
  }
}
