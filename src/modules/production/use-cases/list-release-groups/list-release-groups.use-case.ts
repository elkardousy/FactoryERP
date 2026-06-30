import { Injectable } from '@nestjs/common';
import { MaterialReleaseRepository } from '../../repositories/material-release.repository';
import {
  mapReleaseGroupSummary,
  type ReleaseGroupSummaryDto,
} from '../../dto/material-release.dto';

@Injectable()
export class ListReleaseGroupsUseCase {
  constructor(private readonly releaseRepo: MaterialReleaseRepository) {}

  async execute(orderId: string): Promise<ReleaseGroupSummaryDto[]> {
    const groups = await this.releaseRepo.findGroupsByOrder(BigInt(orderId));
    const summaries = await Promise.all(
      groups.map(async (group) => {
        const lineCount = await this.releaseRepo.countLinesByGroup(
          group.release_group_id,
        );
        return mapReleaseGroupSummary(group, lineCount);
      }),
    );
    return summaries;
  }
}
