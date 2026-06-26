import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionLinesRepository } from '../../repositories/production-lines.repository';
import { CreateProductionLineDto } from '../../dto/production-line.dto';

@Injectable()
export class CreateProductionLineUseCase {
  constructor(
    private readonly repo: ProductionLinesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateProductionLineDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.line_code);
    if (existing)
      throw new ConflictException(
        `Line code '${dto.line_code}' already exists.`,
      );

    const line = await this.repo.create({
      line_code: dto.line_code,
      line_name: dto.line_name,
    });

    void this.auditService.log({
      eventType: 'PRODUCTION_LINE_CREATED',
      entityType: 'production_lines',
      entityId: String(line.line_id),
      userId: actorId,
      payload: { line_code: line.line_code, line_name: line.line_name },
    });

    return line;
  }
}
