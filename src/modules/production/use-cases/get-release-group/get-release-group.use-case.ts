import { Injectable, NotFoundException } from '@nestjs/common';
import { MaterialReleaseRepository } from '../../repositories/material-release.repository';
import {
  mapReleaseGroup,
  type ReleaseGroupResponseDto,
} from '../../dto/material-release.dto';

@Injectable()
export class GetReleaseGroupUseCase {
  constructor(private readonly releaseRepo: MaterialReleaseRepository) {}

  async execute(groupId: string): Promise<ReleaseGroupResponseDto> {
    const group = await this.releaseRepo.findGroupById(BigInt(groupId));
    if (!group) {
      throw new NotFoundException(`Release group ${groupId} not found`);
    }
    return mapReleaseGroup(group);
  }
}
