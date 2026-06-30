import { Injectable } from '@nestjs/common';
import { ProductionReturnsRepository } from '../../repositories/production-returns.repository';
import type {
  ReturnFilterDto,
  ReturnResponseDto,
} from '../../dto/production-returns.dto';
import { mapReturn } from '../../dto/production-returns.dto';

@Injectable()
export class ListReturnsUseCase {
  constructor(private readonly returnsRepo: ProductionReturnsRepository) {}

  async execute(filter: ReturnFilterDto): Promise<ReturnResponseDto[]> {
    const returns = await this.returnsRepo.findMany({
      order_id: filter.order_id ? BigInt(filter.order_id) : undefined,
      part_id: filter.part_id ? BigInt(filter.part_id) : undefined,
    });
    return returns.map(mapReturn);
  }
}
