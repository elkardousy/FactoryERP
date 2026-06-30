import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplementaryStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { SupplementarySummaryUpdatedEvent } from '../../events/production.events';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type {
  CancelSupplementaryRequestDto,
  SupplementaryRequestResponseDto,
} from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const CANCELLABLE_STATUSES: SupplementaryStatusEnum[] = [
  SupplementaryStatusEnum.DRAFT,
  SupplementaryStatusEnum.PENDING_APPROVAL,
  SupplementaryStatusEnum.APPROVED,
];

@Injectable()
export class CancelSupplementaryRequestUseCase {
  constructor(
    private readonly repo: ProductionSupplementaryRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    requestId: string,
    dto: CancelSupplementaryRequestDto,
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

    if (!CANCELLABLE_STATUSES.includes(existing.status)) {
      throw new BadRequestException(
        `Supplementary request ${requestId} cannot be cancelled in status ${existing.status}. Allowed: ${CANCELLABLE_STATUSES.join(', ')}`,
      );
    }

    const cancelled = await this.repo.cancelSupplementaryRequest(id);

    this.publisher.emitSupplementarySummaryUpdated(
      new SupplementarySummaryUpdatedEvent(
        cancelled.order_id.toString(),
        actorId.toString(),
        now,
      ),
    );

    // ED-P10-001: cancellation actor stored in audit log only
    await this.auditService.log({
      eventType: 'production.supplementary.cancelled',
      entityType: 'supplementary_material_requests',
      entityId: cancelled.request_id.toString(),
      userId: actorId,
      payload: {
        request_number: cancelled.request_number,
        order_id: cancelled.order_id.toString(),
        cancellation_notes: dto.cancellation_notes ?? null,
      },
    });

    return mapSupplementaryRequest(cancelled);
  }
}
