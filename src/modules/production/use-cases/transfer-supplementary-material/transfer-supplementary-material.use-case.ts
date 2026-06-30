import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupplementaryStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import {
  SupplementaryTransferredEvent,
  SupplementarySummaryUpdatedEvent,
} from '../../events/production.events';
import { ProductionSupplementaryRepository } from '../../repositories/production-supplementary.repository';
import type { SupplementaryRequestResponseDto } from '../../dto/production-supplementary.dto';
import { mapSupplementaryRequest } from '../../dto/production-supplementary.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class TransferSupplementaryMaterialUseCase {
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

    if (existing.status !== SupplementaryStatusEnum.APPROVED) {
      throw new BadRequestException(
        `Supplementary request ${requestId} must be APPROVED to transfer (current: ${existing.status})`,
      );
    }

    // BR-Sup05: creates SUPPLEMENTARY_RELEASE inventory transactions per line (ED-P10-005)
    const transferred = await this.repo.transferSupplementaryMaterial(
      id,
      actorId,
      now,
    );

    this.publisher.emitSupplementaryTransferred(
      new SupplementaryTransferredEvent(
        transferred.request_id.toString(),
        transferred.request_number,
        transferred.supplementary_request_lines.length,
        actorId.toString(),
        now,
      ),
    );

    this.publisher.emitSupplementarySummaryUpdated(
      new SupplementarySummaryUpdatedEvent(
        transferred.order_id.toString(),
        actorId.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'production.supplementary.transferred',
      entityType: 'supplementary_material_requests',
      entityId: transferred.request_id.toString(),
      userId: actorId,
      payload: {
        request_number: transferred.request_number,
        order_id: transferred.order_id.toString(),
        lines_transferred: transferred.supplementary_request_lines.length,
      },
    });

    return mapSupplementaryRequest(transferred);
  }
}
