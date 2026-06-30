import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type { SupplementaryRequestResponseDto } from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';

@Injectable()
export class GetSupplementaryRequestUseCase {
  constructor(private readonly repo: ProductionSupplementaryRepository) {}

  async execute(requestId: string): Promise<SupplementaryRequestResponseDto> {
    const record = await this.repo.findById(BigInt(requestId));
    if (!record) {
      throw new NotFoundException(
        `Supplementary request ${requestId} not found`,
      );
    }
    return mapSupplementaryRequest(record);
  }
}
