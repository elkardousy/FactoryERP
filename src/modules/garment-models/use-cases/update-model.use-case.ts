import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { ModelsRepository } from '../repositories/models.repository';
import { UpdateModelDto } from '../dto/model.dto';

@Injectable()
export class UpdateModelUseCase {
  constructor(
    private readonly repo: ModelsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateModelDto, actorId: bigint) {
    const modelId = BigInt(id);
    const model = await this.repo.findById(modelId);
    if (!model) throw new NotFoundException(`Model ${id} not found.`);

    if (dto.model_code && dto.model_code !== model.model_code) {
      const conflict = await this.repo.findByCustomerAndCode(
        model.customer_id,
        dto.model_code,
      );
      if (conflict)
        throw new ConflictException(
          `Model code '${dto.model_code}' already exists for this customer.`,
        );
    }

    const updated = await this.repo.update(modelId, {
      model_code: dto.model_code,
      model_name: dto.model_name,
    });

    void this.auditService.log({
      eventType: 'MODEL_UPDATED',
      entityType: 'garment_models',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
