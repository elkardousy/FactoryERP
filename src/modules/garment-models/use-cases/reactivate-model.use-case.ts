import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { ModelsRepository } from '../repositories/models.repository';

@Injectable()
export class ReactivateModelUseCase {
  constructor(
    private readonly repo: ModelsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const modelId = BigInt(id);
    const model = await this.repo.findById(modelId);
    if (!model) throw new NotFoundException(`Model ${id} not found.`);
    if (model.is_active)
      throw new BadRequestException(`Model ${id} is already active.`);

    const result = await this.repo.restore(modelId);

    void this.auditService.log({
      eventType: 'MODEL_REACTIVATED',
      entityType: 'models',
      entityId: String(id),
      userId: actorId,
      payload: { model_id: String(id) },
    });

    return result;
  }
}
