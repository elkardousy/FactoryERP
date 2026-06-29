import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { ProductionOrderUpdatedEvent } from '../../events/production.events';
import {
  mapOrder,
  type UpdateProductionOrderDto,
  type ProductionOrderResponseDto,
} from '../../dto/production-order.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class UpdateProductionOrderUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    orderId: string,
    dto: UpdateProductionOrderDto,
    actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    const id = BigInt(orderId);
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }

    if (order.status !== OrderStatusEnum.DRAFT) {
      throw new BadRequestException(
        `Production order can only be updated in DRAFT status (current: ${order.status})`,
      );
    }

    await this.ordersRepo.update(id, {
      notes: dto.notes,
      target_dozens: dto.target_dozens,
    });

    const updated = await this.ordersRepo.findById(id);

    this.publisher.emitOrderUpdated(
      new ProductionOrderUpdatedEvent(
        orderId,
        actor.sub.toString(),
        new Date(),
      ),
    );

    await this.auditService.log({
      eventType: 'production_order.updated',
      entityType: 'production_orders',
      entityId: orderId,
      userId: actor.sub,
      payload: { notes: dto.notes, target_dozens: dto.target_dozens },
    });

    return mapOrder(updated!);
  }
}
