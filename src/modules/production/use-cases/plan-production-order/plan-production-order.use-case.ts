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
export class PlanProductionOrderUseCase {
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

    if (order.status !== OrderStatusEnum.DRAFT) {
      throw new BadRequestException(
        `Cannot plan order in status ${order.status} — expected DRAFT`,
      );
    }

    const partCount = await this.ordersRepo.countParts(id);
    if (partCount === 0) {
      throw new BadRequestException(
        'Production order must have at least one part before planning',
      );
    }

    await this.ordersRepo.updateStatus(id, OrderStatusEnum.PLANNED);

    const updated = await this.ordersRepo.findById(id);

    this.publisher.emitOrderStatusChanged(
      new ProductionOrderStatusChangedEvent(
        orderId,
        order.order_number,
        OrderStatusEnum.DRAFT,
        OrderStatusEnum.PLANNED,
        actor.sub.toString(),
        new Date(),
      ),
    );

    await this.auditService.log({
      eventType: 'production_order.planned',
      entityType: 'production_orders',
      entityId: orderId,
      userId: actor.sub,
      payload: { previous_status: 'DRAFT', new_status: 'PLANNED' },
    });

    return mapOrder(updated!);
  }
}
