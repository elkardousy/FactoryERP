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
export class CompleteProductionOrderUseCase {
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

    if (order.status !== OrderStatusEnum.IN_PRODUCTION) {
      throw new BadRequestException(
        `Cannot complete order in status ${order.status} — expected IN_PRODUCTION`,
      );
    }

    const stageCount = await this.ordersRepo.countStageLogs(id);
    if (stageCount === 0) {
      throw new BadRequestException(
        'Production order has no stage logs — start production first',
      );
    }

    const nonComplete = await this.ordersRepo.countNonCompleteStages(id);
    if (nonComplete > 0) {
      throw new BadRequestException(
        `Cannot complete production: ${nonComplete} stage(s) are not yet COMPLETE`,
      );
    }

    await this.ordersRepo.updateStatus(id, OrderStatusEnum.PRODUCTION_COMPLETE);

    const updated = await this.ordersRepo.findById(id);

    this.publisher.emitOrderStatusChanged(
      new ProductionOrderStatusChangedEvent(
        orderId,
        order.order_number,
        OrderStatusEnum.IN_PRODUCTION,
        OrderStatusEnum.PRODUCTION_COMPLETE,
        actor.sub.toString(),
        new Date(),
      ),
    );

    await this.auditService.log({
      eventType: 'production_order.completed',
      entityType: 'production_orders',
      entityId: orderId,
      userId: actor.sub,
      payload: {
        previous_status: 'IN_PRODUCTION',
        new_status: 'PRODUCTION_COMPLETE',
      },
    });

    return mapOrder(updated!);
  }
}
