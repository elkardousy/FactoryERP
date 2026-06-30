import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplementaryStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import {
  SupplementaryApprovedEvent,
  SupplementarySummaryUpdatedEvent,
} from '../../events/production.events';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type { SupplementaryRequestResponseDto } from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class ApproveSupplementaryRequestUseCase {
  constructor(
    private readonly repo: ProductionSupplementaryRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    requestId: string,
    actor: JwtPayload,
  ): Promise<SupplementaryRequestResponseDto> {
    const id = BigInt(requestId);
    const actorId = actor.sub;
    const now = new Date();

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(
        `Supplementary request ${requestId} not found`,
      );
    }

    if (existing.status !== SupplementaryStatusEnum.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Supplementary request ${requestId} must be PENDING_APPROVAL to approve (current: ${existing.status})`,
      );
    }

    // ED-P10-006: full approval — approved_dozens = requested_dozens for all lines
    const approved = await this.repo.approveSupplementaryRequest(id);

    this.publisher.emitSupplementaryApproved(
      new SupplementaryApprovedEvent(
        approved.request_id.toString(),
        approved.request_number,
        actorId.toString(),
        now,
      ),
    );

    this.publisher.emitSupplementarySummaryUpdated(
      new SupplementarySummaryUpdatedEvent(
        approved.order_id.toString(),
        actorId.toString(),
        now,
      ),
    );

    // ED-P10-001: approval actor stored in audit log only
    await this.auditService.log({
      eventType: 'production.supplementary.approved',
      entityType: 'supplementary_material_requests',
      entityId: approved.request_id.toString(),
      userId: actorId,
      payload: {
        request_number: approved.request_number,
        order_id: approved.order_id.toString(),
        lines_approved: approved.supplementary_request_lines.length,
      },
    });

    return mapSupplementaryRequest(approved);
  }
}
