import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatusEnum, PartStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionReturnsRepository } from '../../repositories/production-returns.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import {
  ProductionMaterialReturnedEvent,
  ProductionReturnSummaryUpdatedEvent,
} from '../../events/production.events';
import type {
  CreateReturnDto,
  ReturnResponseDto,
} from '../../dto/production-returns.dto';
import { mapReturn } from '../../dto/production-returns.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const ALLOWED_STATUSES: OrderStatusEnum[] = [
  OrderStatusEnum.IN_PRODUCTION,
  OrderStatusEnum.PRODUCTION_COMPLETE,
];

@Injectable()
export class CreateReturnUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly returnsRepo: ProductionReturnsRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    dto: CreateReturnDto,
    actor: JwtPayload,
  ): Promise<ReturnResponseDto> {
    const orderId = BigInt(dto.order_id);
    const partId = BigInt(dto.part_id);
    const destinationWarehouseId = BigInt(dto.destination_warehouse_id);
    const actorId = actor.sub;

    // Order must exist (ED-P07-005: IN_PRODUCTION or PRODUCTION_COMPLETE)
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Production order ${dto.order_id} not found`);
    }
    if (!ALLOWED_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Cannot return material: order status must be IN_PRODUCTION or PRODUCTION_COMPLETE, current is ${order.status}`,
      );
    }

    // Part must belong to this order and be in RELEASED status
    const orderPart = order.production_order_parts.find(
      (p) => p.part_id === partId,
    );
    if (!orderPart) {
      throw new BadRequestException(
        `Part ${dto.part_id} does not belong to order ${dto.order_id}`,
      );
    }
    if (orderPart.status !== PartStatusEnum.RELEASED) {
      throw new BadRequestException(
        `Cannot return material: part status must be RELEASED, current is ${orderPart.status}`,
      );
    }

    const now = new Date();

    // Atomic: decrement WIP + create return_transactions + create RETURN inventory_transaction
    // WIP validation and optimistic lock handled inside repository (ED-P07-007)
    const { returnTxn, wipRemaining, partStatusUpdated } =
      await this.returnsRepo.createReturnAndRecord({
        orderId,
        partId,
        modelId: order.model_id,
        destinationWarehouseId,
        dozensReturned: dto.dozens_returned,
        returnedBy: actorId,
        now,
      });

    // Fetch with relations for response
    const returnWithRelations = await this.returnsRepo.findById(
      returnTxn.return_id,
    );
    if (!returnWithRelations) {
      throw new NotFoundException(
        `Return ${returnTxn.return_id} not found after creation`,
      );
    }

    this.publisher.emitMaterialReturned(
      new ProductionMaterialReturnedEvent(
        returnTxn.return_id.toString(),
        dto.order_id,
        dto.part_id,
        dto.destination_warehouse_id,
        dto.dozens_returned,
        wipRemaining,
        partStatusUpdated,
        actorId.toString(),
        now,
      ),
    );

    this.publisher.emitReturnSummaryUpdated(
      new ProductionReturnSummaryUpdatedEvent(
        dto.order_id,
        actorId.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'production.material.returned',
      entityType: 'return_transactions',
      entityId: returnTxn.return_id.toString(),
      userId: actorId,
      payload: {
        order_id: dto.order_id,
        part_id: dto.part_id,
        destination_warehouse_id: dto.destination_warehouse_id,
        dozens_returned: dto.dozens_returned,
        wip_remaining: wipRemaining,
        part_status_updated: partStatusUpdated,
      },
    });

    this.logger.info(
      `Material returned for order ${dto.order_id} part ${dto.part_id}: ${dto.dozens_returned} dozens → warehouse ${dto.destination_warehouse_id} (wip_remaining=${wipRemaining}, partStatusUpdated=${partStatusUpdated})`,
    );

    return mapReturn(returnWithRelations);
  }
}
