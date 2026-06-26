import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import { UpdateProductionStageDto } from '../../dto/production-stage.dto';

@Injectable()
export class UpdateProductionStageUseCase {
  constructor(
    private readonly repo: ProductionStagesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateProductionStageDto, actorId: bigint) {
    const stageId = BigInt(id);
    const stage = await this.repo.findById(stageId);
    if (!stage)
      throw new NotFoundException(`Production stage ${id} not found.`);

    if (dto.stage_code && dto.stage_code !== stage.stage_code) {
      const conflict = await this.repo.findByCode(dto.stage_code);
      if (conflict)
        throw new ConflictException(
          `Stage code '${dto.stage_code}' already exists.`,
        );
    }

    if (
      dto.sequence_order !== undefined &&
      dto.sequence_order !== stage.sequence_order
    ) {
      const conflict = await this.repo.findBySequenceOrder(dto.sequence_order);
      if (conflict)
        throw new ConflictException(
          `Sequence order ${dto.sequence_order} is already taken.`,
        );
    }

    const updated = await this.repo.update(stageId, {
      stage_code: dto.stage_code,
      stage_name: dto.stage_name,
      sequence_order: dto.sequence_order,
    });

    void this.auditService.log({
      eventType: 'PRODUCTION_STAGE_UPDATED',
      entityType: 'production_stages',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
