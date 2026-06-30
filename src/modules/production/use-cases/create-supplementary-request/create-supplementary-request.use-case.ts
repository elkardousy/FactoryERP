import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplementaryReasonEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { DocumentNumberingService } from '../../../../core/document-numbering/document-numbering.service';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import {
  SupplementaryRequestedEvent,
  SupplementarySummaryUpdatedEvent,
} from '../../events/production.events';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type {
  CreateSupplementaryRequestDto,
  SupplementaryRequestResponseDto,
} from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const IN_PRODUCTION_STATUS = 'IN_PRODUCTION';

@Injectable()
export class CreateSupplementaryRequestUseCase {
  constructor(
    private readonly repo: ProductionSupplementaryRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
    private readonly docNumbering: DocumentNumberingService,
  ) {}

  async execute(
    dto: CreateSupplementaryRequestDto,
    actor: JwtPayload,
  ): Promise<SupplementaryRequestResponseDto> {
    const orderId = BigInt(dto.order_id);
    const actorId = actor.sub;
    const now = new Date();

    // BR-Sup04: only IN_PRODUCTION orders
    const order = await this.repo.findProductionOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`Production order ${dto.order_id} not found`);
    }
    if (order.status !== IN_PRODUCTION_STATUS) {
      throw new BadRequestException(
        `Production order ${dto.order_id} must be IN_PRODUCTION to create a supplementary request (current: ${order.status})`,
      );
    }

    // Validate lines
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException(
        'At least one supplementary line is required',
      );
    }

    // BR-Sup01: NEGLIGENCE requires negligence payload (ED-P10-004)
    if (
      dto.reason_type === SupplementaryReasonEnum.NEGLIGENCE &&
      !dto.negligence
    ) {
      throw new BadRequestException(
        'Negligence details are required when reason_type is NEGLIGENCE',
      );
    }

    // ED-P10-007: generate request number via DocumentNumberingService
    const requestNumber = await this.docNumbering.generate('SUP_REQUEST', now);

    const lines = dto.lines.map((line) => ({
      orderPartId: BigInt(line.order_part_id),
      partId: BigInt(line.part_id),
      sourceWarehouseId: BigInt(line.source_warehouse_id),
      requestedDozens: line.requested_dozens,
      lineNotes: line.line_notes,
    }));

    const negligenceParams =
      dto.reason_type === SupplementaryReasonEnum.NEGLIGENCE && dto.negligence
        ? {
            responsibleEmployeeId: BigInt(
              dto.negligence.responsible_employee_id,
            ),
            negligenceType: dto.negligence.negligence_type,
            stageId: BigInt(dto.negligence.stage_id),
            incidentDescription: dto.negligence.incident_description,
            warningIssued: dto.negligence.warning_issued ?? false,
            warningReference: dto.negligence.warning_reference,
            rootCauseCategory: dto.negligence.root_cause_category,
            correctiveAction: dto.negligence.corrective_action,
            preventiveAction: dto.negligence.preventive_action,
            reportedBy: actorId,
            reportedAt: now,
          }
        : undefined;

    // ED-P10-003: create directly in PENDING_APPROVAL (skip DRAFT)
    const created = await this.repo.createSupplementaryRequest({
      requestNumber,
      orderId,
      reasonType: dto.reason_type as SupplementaryReasonEnum,
      justification: dto.justification,
      notes: dto.notes,
      requestedBy: actorId,
      requestedAt: now,
      lines,
      negligence: negligenceParams,
    });

    this.publisher.emitSupplementaryRequested(
      new SupplementaryRequestedEvent(
        created.request_id.toString(),
        created.request_number,
        created.order_id.toString(),
        created.reason_type,
        created.supplementary_request_lines.length,
        actorId.toString(),
        now,
      ),
    );

    this.publisher.emitSupplementarySummaryUpdated(
      new SupplementarySummaryUpdatedEvent(
        created.order_id.toString(),
        actorId.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'production.supplementary.requested',
      entityType: 'supplementary_material_requests',
      entityId: created.request_id.toString(),
      userId: actorId,
      payload: {
        request_number: created.request_number,
        order_id: created.order_id.toString(),
        reason_type: created.reason_type,
        lines_count: created.supplementary_request_lines.length,
      },
    });

    return mapSupplementaryRequest(created);
  }
}
