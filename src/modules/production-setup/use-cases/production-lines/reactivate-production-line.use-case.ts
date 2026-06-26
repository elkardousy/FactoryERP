import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionLinesRepository } from '../../repositories/production-lines.repository';

@Injectable()
export class ReactivateProductionLineUseCase {
  constructor(
    private readonly repo: ProductionLinesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const lineId = BigInt(id);
    const line = await this.repo.findById(lineId);
    if (!line) throw new NotFoundException(`Production line ${id} not found.`);
    if (line.is_active)
      throw new BadRequestException(`Production line ${id} is already active.`);

    const result = await this.repo.restore(lineId);

    void this.auditService.log({
      eventType: 'PRODUCTION_LINE_REACTIVATED',
      entityType: 'production_lines',
      entityId: String(id),
      userId: actorId,
      payload: { line_id: String(id) },
    });

    return result;
  }
}
