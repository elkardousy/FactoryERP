import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import { CreateProductionStageDto } from '../../dto/production-stage.dto';

@Injectable()
export class CreateProductionStageUseCase {
  constructor(
    private readonly repo: ProductionStagesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateProductionStageDto, actorId: bigint) {
    const [existingCode, existingSeq] = await Promise.all([
      this.repo.findByCode(dto.stage_code),
      this.repo.findBySequenceOrder(dto.sequence_order),
    ]);
    if (existingCode)
      throw new ConflictException(
        `Stage code '${dto.stage_code}' already exists.`,
      );
    if (existingSeq)
      throw new ConflictException(
        `Sequence order ${dto.sequence_order} is already taken.`,
      );

    const stage = await this.repo.create({
      stage_code: dto.stage_code,
      stage_name: dto.stage_name,
      sequence_order: dto.sequence_order,
    });

    void this.auditService.log({
      eventType: 'PRODUCTION_STAGE_CREATED',
      entityType: 'production_stages',
      entityId: String(stage.stage_id),
      userId: actorId,
      payload: {
        stage_code: stage.stage_code,
        sequence_order: stage.sequence_order,
      },
    });

    return stage;
  }
}
