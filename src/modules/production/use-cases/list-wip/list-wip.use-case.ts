import { Injectable } from '@nestjs/common';
import { ProductionWipRepository } from '../../repositories/production-wip.repository';
import {
  mapWip,
  type WipFilterDto,
  type PaginatedWipResponseDto,
} from '../../dto/production-wip.dto';

@Injectable()
export class ListWipUseCase {
  constructor(private readonly wipRepo: ProductionWipRepository) {}

  async execute(dto: WipFilterDto): Promise<PaginatedWipResponseDto> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);

    const filter = {
      order_id: dto.order_id ? BigInt(dto.order_id) : undefined,
      line_id: dto.line_id ? BigInt(dto.line_id) : undefined,
    };

    const result = await this.wipRepo.findMany(filter, page, limit);
    return {
      items: result.items.map(mapWip),
      meta: result.meta,
    };
  }
}
