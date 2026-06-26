import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ColorsRepository } from '../../repositories/colors.repository';

@Injectable()
export class DeleteColorUseCase {
  constructor(
    private readonly repo: ColorsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const colorId = BigInt(id);
    const color = await this.repo.findById(colorId);
    if (!color) throw new NotFoundException(`Color ${id} not found.`);

    await this.repo.delete(colorId);

    void this.auditService.log({
      eventType: 'COLOR_DELETED',
      entityType: 'colors',
      entityId: String(id),
      userId: actorId,
      payload: { color_code: color.color_code },
    });
  }
}
