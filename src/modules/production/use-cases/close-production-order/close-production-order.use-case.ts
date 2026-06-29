import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { ProductionOrderStatusChangedEvent } from '../../events/production.events';
import {
  mapOrder,
  type ProductionOrderResponseDto,
} from '../../dto/production-order.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class CloseProductionOrderUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    orderId: string,
    actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    const id = BigInt(orderId);
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }

    if (order.status !== OrderStatusEnum.PRODUCTION_COMPLETE) {
      throw new BadRequestException(
        `Cannot close order in status ${order.status} — expected PRODUCTION_COMPLETE`,
      );
    }

    const packingPosted = await this.ordersRepo.isPackingPosted(id);
    if (!packingPosted) {
      throw new BadRequestException(
        'Cannot close production order: packing order must be POSTED first',
      );
    }

    const now = new Date();
    await this.ordersRepo.updateStatus(id, OrderStatusEnum.CLOSED, {
      closedBy: actor.sub,
      closedAt: now,
    });

    const updated = await this.ordersRepo.findById(id);

    this.publisher.emitOrderStatusChanged(
      new ProductionOrderStatusChangedEvent(
        orderId,
        order.order_number,
        OrderStatusEnum.PRODUCTION_COMPLETE,
        OrderStatusEnum.CLOSED,
        actor.sub.toString(),
        new Date(),
      ),
    );

    await this.auditService.log({
      eventType: 'production_order.closed',
      entityType: 'production_orders',
      entityId: orderId,
      userId: actor.sub,
      payload: {
        previous_status: 'PRODUCTION_COMPLETE',
        new_status: 'CLOSED',
        closed_at: now.toISOString(),
      },
    });

    return mapOrder(updated!);
  }
}
