import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { SizesRepository } from '../../repositories/sizes.repository';
import { UpdateSizeDto } from '../../dto/size.dto';

@Injectable()
export class UpdateSizeUseCase {
  constructor(
    private readonly repo: SizesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateSizeDto, actorId: bigint) {
    const sizeId = BigInt(id);
    const size = await this.repo.findById(sizeId);
    if (!size) throw new NotFoundException(`Size ${id} not found.`);

    if (dto.size_code && dto.size_code !== size.size_code) {
      const conflict = await this.repo.findByCode(dto.size_code);
      if (conflict)
        throw new ConflictException(
          `Size code '${dto.size_code}' already exists.`,
        );
    }

    const updated = await this.repo.update(sizeId, {
      size_code: dto.size_code,
      sort_order: dto.sort_order,
    });

    void this.auditService.log({
      eventType: 'SIZE_UPDATED',
      entityType: 'sizes',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
