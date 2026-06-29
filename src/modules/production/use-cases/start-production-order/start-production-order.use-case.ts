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
export class StartProductionOrderUseCase {
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

    if (order.status !== OrderStatusEnum.PLANNED) {
      throw new BadRequestException(
        `Cannot start order in status ${order.status} — expected PLANNED`,
      );
    }

    const nonReleased = await this.ordersRepo.countNonReleasedParts(id);
    if (nonReleased > 0) {
      throw new BadRequestException(
        `Cannot start production: ${nonReleased} part(s) have not been released yet`,
      );
    }

    await this.ordersRepo.executeInTransaction(async (tx) => {
      await this.ordersRepo.initializeStageLogsInTx(tx, id, order.line_id);
      await tx.production_orders.update({
        where: { order_id: id },
        data: { status: OrderStatusEnum.IN_PRODUCTION },
      });
    });

    const updated = await this.ordersRepo.findById(id);

    this.publisher.emitOrderStatusChanged(
      new ProductionOrderStatusChangedEvent(
        orderId,
        order.order_number,
        OrderStatusEnum.PLANNED,
        OrderStatusEnum.IN_PRODUCTION,
        actor.sub.toString(),
        new Date(),
      ),
    );

    await this.auditService.log({
      eventType: 'production_order.started',
      entityType: 'production_orders',
      entityId: orderId,
      userId: actor.sub,
      payload: { previous_status: 'PLANNED', new_status: 'IN_PRODUCTION' },
    });

    return mapOrder(updated!);
  }
}
