import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplementaryStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import {
  SupplementaryRejectedEvent,
  SupplementarySummaryUpdatedEvent,
} from '../../events/production.events';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type {
  RejectSupplementaryRequestDto,
  SupplementaryRequestResponseDto,
} from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const REJECTABLE_STATUSES: SupplementaryStatusEnum[] = [
  SupplementaryStatusEnum.PENDING_APPROVAL,
  SupplementaryStatusEnum.APPROVED,
];

@Injectable()
export class RejectSupplementaryRequestUseCase {
  constructor(
    private readonly repo: ProductionSupplementaryRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    requestId: string,
    dto: RejectSupplementaryRequestDto,
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

    if (!REJECTABLE_STATUSES.includes(existing.status)) {
      throw new BadRequestException(
        `Supplementary request ${requestId} cannot be rejected in status ${existing.status}. Allowed: ${REJECTABLE_STATUSES.join(', ')}`,
      );
    }

    const rejected = await this.repo.rejectSupplementaryRequest(id);

    this.publisher.emitSupplementaryRejected(
      new SupplementaryRejectedEvent(
        rejected.request_id.toString(),
        rejected.request_number,
        actorId.toString(),
        now,
      ),
    );

    this.publisher.emitSupplementarySummaryUpdated(
      new SupplementarySummaryUpdatedEvent(
        rejected.order_id.toString(),
        actorId.toString(),
        now,
      ),
    );

    // ED-P10-001: rejection actor stored in audit log only
    await this.auditService.log({
      eventType: 'production.supplementary.rejected',
      entityType: 'supplementary_material_requests',
      entityId: rejected.request_id.toString(),
      userId: actorId,
      payload: {
        request_number: rejected.request_number,
        order_id: rejected.order_id.toString(),
        rejection_notes: dto.rejection_notes ?? null,
      },
    });

    return mapSupplementaryRequest(rejected);
  }
}
