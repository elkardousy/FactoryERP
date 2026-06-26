import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { SizesRepository } from '../../repositories/sizes.repository';
import { CreateSizeDto } from '../../dto/size.dto';

@Injectable()
export class CreateSizeUseCase {
  constructor(
    private readonly repo: SizesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateSizeDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.size_code);
    if (existing) {
      throw new ConflictException(
        `Size code '${dto.size_code}' already exists.`,
      );
    }

    const size = await this.repo.create({
      size_code: dto.size_code,
      sort_order: dto.sort_order,
    });

    void this.auditService.log({
      eventType: 'SIZE_CREATED',
      entityType: 'sizes',
      entityId: String(size.size_id),
      userId: actorId,
      payload: { size_code: size.size_code },
    });

    return size;
  }
}
