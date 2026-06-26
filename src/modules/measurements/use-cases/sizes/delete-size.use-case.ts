import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { SizesRepository } from '../../repositories/sizes.repository';

@Injectable()
export class DeleteSizeUseCase {
  constructor(
    private readonly repo: SizesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const sizeId = BigInt(id);
    const size = await this.repo.findById(sizeId);
    if (!size) throw new NotFoundException(`Size ${id} not found.`);

    await this.repo.delete(sizeId);

    void this.auditService.log({
      eventType: 'SIZE_DELETED',
      entityType: 'sizes',
      entityId: String(id),
      userId: actorId,
      payload: { size_code: size.size_code },
    });
  }
}
