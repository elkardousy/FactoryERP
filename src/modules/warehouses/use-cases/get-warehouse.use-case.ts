import { Injectable, NotFoundException } from '@nestjs/common';
import { WarehousesRepository } from '../repositories/warehouses.repository';

@Injectable()
export class GetWarehouseUseCase {
  constructor(private readonly repo: WarehousesRepository) {}

  async execute(id: number) {
    const wh = await this.repo.findById(BigInt(id));
    if (!wh) throw new NotFoundException(`Warehouse ${id} not found.`);
    return wh;
  }
}
