import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ColorsRepository } from '../../repositories/colors.repository';
import { CreateColorDto } from '../../dto/color.dto';

@Injectable()
export class CreateColorUseCase {
  constructor(
    private readonly repo: ColorsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateColorDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.color_code);
    if (existing) {
      throw new ConflictException(
        `Color code '${dto.color_code}' already exists.`,
      );
    }

    const color = await this.repo.create({
      color_code: dto.color_code,
      color_name: dto.color_name,
      hex_value: dto.hex_value,
    });

    void this.auditService.log({
      eventType: 'COLOR_CREATED',
      entityType: 'colors',
      entityId: String(color.color_id),
      userId: actorId,
      payload: { color_code: color.color_code, color_name: color.color_name },
    });

    return color;
  }
}
