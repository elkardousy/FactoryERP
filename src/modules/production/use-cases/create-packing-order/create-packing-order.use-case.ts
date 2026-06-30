import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatusEnum } from '@prisma/client';
import { DocumentNumberingService } from '../../../../core/document-numbering/document-numbering.service';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionPackingRepository } from '../../repositories/production-packing.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { PackingOrderCreatedEvent } from '../../events/production.events';
import {
  mapPackingOrder,
  type CreatePackingOrderDto,
  type PackingOrderResponseDto,
} from '../../dto/production-packing.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const PACKING_ORDER_SEQUENCE = 'PACKING_ORDER';

@Injectable()
export class CreatePackingOrderUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly packingRepo: ProductionPackingRepository,
    private readonly docNumbering: DocumentNumberingService,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    dto: CreatePackingOrderDto,
    actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    const productionOrderId = BigInt(dto.production_order_id);

    // BR-P08: production order must be PRODUCTION_COMPLETE
    const order = await this.ordersRepo.findById(productionOrderId);
    if (!order) {
      throw new NotFoundException(
        `Production order ${dto.production_order_id} not found`,
      );
    }
    if (order.status !== OrderStatusEnum.PRODUCTION_COMPLETE) {
      throw new BadRequestException(
        `Production order must be PRODUCTION_COMPLETE to create a packing order (current: ${order.status})`,
      );
    }

    // BR-P07: one packing order per production order
    const existing =
      await this.packingRepo.findPackingOrderByProductionOrderId(
        productionOrderId,
      );
    if (existing) {
      throw new ConflictException(
        `A packing order already exists for production order ${dto.production_order_id}`,
      );
    }

    // BR-P01: active packing pattern must exist for model (ED-P08-002)
    const pattern = await this.packingRepo.findActivePatternForModel(
      order.model_id,
    );
    if (!pattern) {
      throw new BadRequestException(
        `No active packing pattern found for model ${order.model_id}`,
      );
    }

    // BR-Q04: at least one quality output box with dozens_available > 0
    const targetDozens =
      await this.packingRepo.sumAvailableDozensByOrder(productionOrderId);
    if (targetDozens <= 0) {
      throw new BadRequestException(
        'No quality output available for packing — all QO boxes are empty',
      );
    }

    // Generate packing_order_no (ED-P08-001)
    const now = new Date();
    const packingOrderNo = await this.docNumbering.generate(
      PACKING_ORDER_SEQUENCE,
      now,
    );

    const packingOrder = await this.packingRepo.createPackingOrder({
      productionOrderId,
      patternId: pattern.pattern_id,
      modelId: order.model_id,
      targetDozens,
      packingOrderNo,
      createdBy: actor.sub,
      now,
      notes: dto.notes,
    });

    this.publisher.emitPackingOrderCreated(
      new PackingOrderCreatedEvent(
        packingOrder.packing_order_id.toString(),
        packingOrder.packing_order_no,
        productionOrderId.toString(),
        pattern.pattern_id.toString(),
        targetDozens,
        actor.sub.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'packing_order.created',
      entityType: 'packing_orders',
      entityId: packingOrder.packing_order_id.toString(),
      userId: actor.sub,
      payload: {
        packing_order_no: packingOrderNo,
        production_order_id: dto.production_order_id,
        pattern_id: pattern.pattern_id.toString(),
        target_dozens: targetDozens,
      },
    });

    return mapPackingOrder({ ...packingOrder, packing_verifications: [] });
  }
}
