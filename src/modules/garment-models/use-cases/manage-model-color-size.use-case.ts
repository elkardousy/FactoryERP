import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { ModelsRepository } from '../repositories/models.repository';
import { ModelColorsSizesRepository } from '../repositories/model-colors-sizes.repository';
import { ColorsRepository } from '../../measurements/repositories/colors.repository';
import { SizesRepository } from '../../measurements/repositories/sizes.repository';

@Injectable()
export class ManageModelColorSizeUseCase {
  constructor(
    private readonly modelsRepo: ModelsRepository,
    private readonly csRepo: ModelColorsSizesRepository,
    private readonly colorsRepo: ColorsRepository,
    private readonly sizesRepo: SizesRepository,
    private readonly auditService: AuditService,
  ) {}

  private async assertModelExists(modelId: bigint) {
    const model = await this.modelsRepo.findById(modelId);
    if (!model) throw new NotFoundException(`Model ${modelId} not found.`);
  }

  async assignColor(modelId: number, colorId: number, actorId: bigint) {
    const mid = BigInt(modelId);
    const cid = BigInt(colorId);
    await this.assertModelExists(mid);
    const color = await this.colorsRepo.findById(cid);
    if (!color) throw new NotFoundException(`Color ${colorId} not found.`);
    const existing = await this.csRepo.findColor(mid, cid);
    if (existing)
      throw new ConflictException(
        `Color ${colorId} is already assigned to model ${modelId}.`,
      );

    const result = await this.csRepo.assignColor(mid, cid);

    void this.auditService.log({
      eventType: 'MODEL_COLOR_ASSIGNED',
      entityType: 'garment_models',
      entityId: String(modelId),
      userId: actorId,
      payload: { model_id: String(modelId), color_id: String(colorId) },
    });

    return result;
  }

  async removeColor(modelId: number, colorId: number, actorId: bigint) {
    const mid = BigInt(modelId);
    const cid = BigInt(colorId);
    const existing = await this.csRepo.findColor(mid, cid);
    if (!existing)
      throw new NotFoundException(
        `Color ${colorId} is not assigned to model ${modelId}.`,
      );

    await this.csRepo.removeColor(mid, cid);

    void this.auditService.log({
      eventType: 'MODEL_COLOR_REMOVED',
      entityType: 'garment_models',
      entityId: String(modelId),
      userId: actorId,
      payload: { model_id: String(modelId), color_id: String(colorId) },
    });
  }

  async assignSize(modelId: number, sizeId: number, actorId: bigint) {
    const mid = BigInt(modelId);
    const sid = BigInt(sizeId);
    await this.assertModelExists(mid);
    const size = await this.sizesRepo.findById(sid);
    if (!size) throw new NotFoundException(`Size ${sizeId} not found.`);
    const existing = await this.csRepo.findSize(mid, sid);
    if (existing)
      throw new ConflictException(
        `Size ${sizeId} is already assigned to model ${modelId}.`,
      );

    const result = await this.csRepo.assignSize(mid, sid);

    void this.auditService.log({
      eventType: 'MODEL_SIZE_ASSIGNED',
      entityType: 'garment_models',
      entityId: String(modelId),
      userId: actorId,
      payload: { model_id: String(modelId), size_id: String(sizeId) },
    });

    return result;
  }

  async removeSize(modelId: number, sizeId: number, actorId: bigint) {
    const mid = BigInt(modelId);
    const sid = BigInt(sizeId);
    const existing = await this.csRepo.findSize(mid, sid);
    if (!existing)
      throw new NotFoundException(
        `Size ${sizeId} is not assigned to model ${modelId}.`,
      );

    await this.csRepo.removeSize(mid, sid);

    void this.auditService.log({
      eventType: 'MODEL_SIZE_REMOVED',
      entityType: 'garment_models',
      entityId: String(modelId),
      userId: actorId,
      payload: { model_id: String(modelId), size_id: String(sizeId) },
    });
  }
}
