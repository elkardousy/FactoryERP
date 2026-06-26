import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';

@Injectable()
export class DeleteProductionStageUseCase {
  constructor(
    private readonly repo: ProductionStagesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const stageId = BigInt(id);
    const stage = await this.repo.findById(stageId);
    if (!stage)
      throw new NotFoundException(`Production stage ${id} not found.`);

    await this.repo.delete(stageId);

    void this.auditService.log({
      eventType: 'PRODUCTION_STAGE_DELETED',
      entityType: 'production_stages',
      entityId: String(id),
      userId: actorId,
      payload: { stage_code: stage.stage_code },
    });
  }
}
