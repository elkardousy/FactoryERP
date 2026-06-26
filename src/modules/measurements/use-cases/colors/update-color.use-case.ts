import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ColorsRepository } from '../../repositories/colors.repository';
import { UpdateColorDto } from '../../dto/color.dto';

@Injectable()
export class UpdateColorUseCase {
  constructor(
    private readonly repo: ColorsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateColorDto, actorId: bigint) {
    const colorId = BigInt(id);
    const color = await this.repo.findById(colorId);
    if (!color) throw new NotFoundException(`Color ${id} not found.`);

    if (dto.color_code && dto.color_code !== color.color_code) {
      const conflict = await this.repo.findByCode(dto.color_code);
      if (conflict)
        throw new ConflictException(
          `Color code '${dto.color_code}' already exists.`,
        );
    }

    const updated = await this.repo.update(colorId, {
      color_code: dto.color_code,
      color_name: dto.color_name,
      hex_value: dto.hex_value,
    });

    void this.auditService.log({
      eventType: 'COLOR_UPDATED',
      entityType: 'colors',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
