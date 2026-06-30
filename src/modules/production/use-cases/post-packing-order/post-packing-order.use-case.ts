import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackingOrderStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { PackingPostedEvent } from '../../events/production.events';
import {
  mapPackingOrder,
  type PackingOrderResponseDto,
} from '../../dto/production-packing.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class PostPackingOrderUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly packingRepo: ProductionPackingRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    packingOrderId: string,
    actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    const packingOrderBigInt = BigInt(packingOrderId);

    const packingOrder =
      await this.packingRepo.findPackingOrderById(packingOrderBigInt);
    if (!packingOrder) {
      throw new NotFoundException(`Packing order ${packingOrderId} not found`);
    }

    if (packingOrder.status !== PackingOrderStatusEnum.VERIFIED) {
      throw new BadRequestException(
        `Packing order must be VERIFIED before posting (current: ${packingOrder.status})`,
      );
    }

    // BR-P05: variance must be accepted (ED-P08-003)
    const verification = packingOrder.packing_verifications?.[0] ?? null;
    if (!verification) {
      throw new BadRequestException(
        'Packing verification record is required before posting',
      );
    }
    if (!verification.variance_accepted) {
      throw new BadRequestException(
        'Packing verification variance must be accepted before posting (BR-P05)',
      );
    }

    // Resolve model_id from production order for inventory transaction (ED-P08-007)
    const productionOrder = await this.ordersRepo.findById(
      packingOrder.production_order_id,
    );
    if (!productionOrder) {
      throw new NotFoundException(
        `Production order ${packingOrder.production_order_id} not found`,
      );
    }

    const now = new Date();
    const assembledDozens = Number(packingOrder.assembled_dozens);

    const updated = await this.packingRepo.postPackingOrder({
      packingOrderId: packingOrderBigInt,
      productionOrderId: packingOrder.production_order_id,
      modelId: productionOrder.model_id,
      assembledDozens,
      postedBy: actor.sub,
      now,
    });

    this.publisher.emitPackingPosted(
      new PackingPostedEvent(
        packingOrderId,
        packingOrder.production_order_id.toString(),
        assembledDozens,
        actor.sub.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'packing_order.posted',
      entityType: 'packing_orders',
      entityId: packingOrderId,
      userId: actor.sub,
      payload: {
        production_order_id: packingOrder.production_order_id.toString(),
        assembled_dozens: assembledDozens,
        model_id: productionOrder.model_id.toString(),
      },
    });

    return mapPackingOrder(updated);
  }
}
