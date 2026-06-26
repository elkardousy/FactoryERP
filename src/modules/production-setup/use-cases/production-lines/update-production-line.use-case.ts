import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionLinesRepository } from '../../repositories/production-lines.repository';
import { UpdateProductionLineDto } from '../../dto/production-line.dto';

@Injectable()
export class UpdateProductionLineUseCase {
  constructor(
    private readonly repo: ProductionLinesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateProductionLineDto, actorId: bigint) {
    const lineId = BigInt(id);
    const line = await this.repo.findById(lineId);
    if (!line) throw new NotFoundException(`Production line ${id} not found.`);

    if (dto.line_code && dto.line_code !== line.line_code) {
      const conflict = await this.repo.findByCode(dto.line_code);
      if (conflict)
        throw new ConflictException(
          `Line code '${dto.line_code}' already exists.`,
        );
    }

    const updated = await this.repo.update(lineId, {
      line_code: dto.line_code,
      line_name: dto.line_name,
    });

    void this.auditService.log({
      eventType: 'PRODUCTION_LINE_UPDATED',
      entityType: 'production_lines',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
