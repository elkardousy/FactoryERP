import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackingOrderStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { PackingVerifiedEvent } from '../../events/production.events';
import {
  mapPackingOrder,
  type VerifyPackingDto,
  type PackingOrderResponseDto,
} from '../../dto/production-packing.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const VERIFIABLE_STATUSES = new Set<string>([
  PackingOrderStatusEnum.IN_PROCESS,
  PackingOrderStatusEnum.ASSEMBLED,
]);

@Injectable()
export class VerifyPackingUseCase {
  constructor(
    private readonly packingRepo: ProductionPackingRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    packingOrderId: string,
    dto: VerifyPackingDto,
    actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    const packingOrderBigInt = BigInt(packingOrderId);

    const packingOrder =
      await this.packingRepo.findPackingOrderById(packingOrderBigInt);
    if (!packingOrder) {
      throw new NotFoundException(`Packing order ${packingOrderId} not found`);
    }

    if (!VERIFIABLE_STATUSES.has(packingOrder.status)) {
      throw new BadRequestException(
        `Cannot verify a packing order in status ${packingOrder.status} — must be IN_PROCESS or ASSEMBLED`,
      );
    }

    const now = new Date();
    const systemDozens = Number(packingOrder.assembled_dozens);

    const updated = await this.packingRepo.verifyPackingOrder({
      packingOrderId: packingOrderBigInt,
      systemDozens,
      physicalCountDozens: dto.physical_count_dozens,
      varianceNotes: dto.variance_notes,
      verifiedBy: actor.sub,
      now,
    });

    this.publisher.emitPackingVerified(
      new PackingVerifiedEvent(
        packingOrderId,
        systemDozens,
        dto.physical_count_dozens,
        true,
        actor.sub.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'packing_order.verified',
      entityType: 'packing_orders',
      entityId: packingOrderId,
      userId: actor.sub,
      payload: {
        system_dozens: systemDozens,
        physical_count_dozens: dto.physical_count_dozens,
        variance_notes: dto.variance_notes ?? null,
      },
    });

    return mapPackingOrder(updated);
  }
}
