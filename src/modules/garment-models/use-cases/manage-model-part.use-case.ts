import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { ModelsRepository } from '../repositories/models.repository';
import { ModelPartsRepository } from '../repositories/model-parts.repository';
import { CreateModelPartDto, UpdateModelPartDto } from '../dto/model-part.dto';

@Injectable()
export class ManageModelPartUseCase {
  constructor(
    private readonly modelsRepo: ModelsRepository,
    private readonly partsRepo: ModelPartsRepository,
    private readonly auditService: AuditService,
  ) {}

  private async assertModelExists(modelId: bigint) {
    const model = await this.modelsRepo.findById(modelId);
    if (!model) throw new NotFoundException(`Model ${modelId} not found.`);
  }

  async addPart(modelId: number, dto: CreateModelPartDto, actorId: bigint) {
    const mid = BigInt(modelId);
    await this.assertModelExists(mid);
    const existing = await this.partsRepo.findByModelAndCode(
      mid,
      dto.part_code,
    );
    if (existing)
      throw new ConflictException(
        `Part code '${dto.part_code}' already exists on this model.`,
      );

    const part = await this.partsRepo.create({
      model_id: mid,
      part_code: dto.part_code,
      part_description: dto.part_description,
      sort_order: dto.sort_order ?? 0,
    });

    void this.auditService.log({
      eventType: 'MODEL_PART_ADDED',
      entityType: 'model_parts',
      entityId: String(part.part_id),
      userId: actorId,
      payload: { model_id: String(modelId), part_code: dto.part_code },
    });

    return part;
  }

  async updatePart(
    modelId: number,
    partId: number,
    dto: UpdateModelPartDto,
    actorId: bigint,
  ) {
    const mid = BigInt(modelId);
    const pid = BigInt(partId);
    await this.assertModelExists(mid);
    const part = await this.partsRepo.findById(pid);
    if (!part || part.model_id !== mid)
      throw new NotFoundException(
        `Part ${partId} not found on model ${modelId}.`,
      );

    if (dto.part_code && dto.part_code !== part.part_code) {
      const conflict = await this.partsRepo.findByModelAndCode(
        mid,
        dto.part_code,
      );
      if (conflict)
        throw new ConflictException(
          `Part code '${dto.part_code}' already exists on this model.`,
        );
    }

    const updated = await this.partsRepo.update(pid, {
      part_code: dto.part_code,
      part_description: dto.part_description,
      sort_order: dto.sort_order,
    });

    void this.auditService.log({
      eventType: 'MODEL_PART_UPDATED',
      entityType: 'model_parts',
      entityId: String(partId),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }

  async removePart(modelId: number, partId: number, actorId: bigint) {
    const mid = BigInt(modelId);
    const pid = BigInt(partId);
    const part = await this.partsRepo.findById(pid);
    if (!part || part.model_id !== mid)
      throw new NotFoundException(
        `Part ${partId} not found on model ${modelId}.`,
      );

    await this.partsRepo.delete(pid);

    void this.auditService.log({
      eventType: 'MODEL_PART_REMOVED',
      entityType: 'model_parts',
      entityId: String(partId),
      userId: actorId,
      payload: { model_id: String(modelId), part_code: part.part_code },
    });
  }

  async listParts(modelId: number) {
    await this.assertModelExists(BigInt(modelId));
    return this.partsRepo.findByModelId(BigInt(modelId));
  }
}
