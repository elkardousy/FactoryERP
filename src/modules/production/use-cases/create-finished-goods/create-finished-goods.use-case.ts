import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackingOrderStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionFinishedGoodsRepository } from '../../repositories/production-finished-goods.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import {
  FinishedGoodsCreatedEvent,
  FinishedGoodsSummaryUpdatedEvent,
} from '../../events/production.events';
import {
  mapFGBag,
  type CreateFinishedGoodsDto,
  type FinishedGoodsBagResponseDto,
} from '../../dto/production-finished-goods.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class CreateFinishedGoodsUseCase {
  constructor(
    private readonly fgRepo: ProductionFinishedGoodsRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    dto: CreateFinishedGoodsDto,
    actor: JwtPayload,
  ): Promise<FinishedGoodsBagResponseDto> {
    const packingOrderBigInt = BigInt(dto.packing_order_id);

    // Load packing order to check status (POSTED check is part of findPackingOrderWithProduction)
    const packingOrder =
      await this.fgRepo.findPackingOrderStatusById(packingOrderBigInt);
    if (!packingOrder) {
      throw new NotFoundException(
        `Packing order ${dto.packing_order_id} not found`,
      );
    }
    if (packingOrder.status !== PackingOrderStatusEnum.POSTED) {
      throw new BadRequestException(
        `Cannot create finished goods from packing order ${dto.packing_order_id} in status ${packingOrder.status} — must be POSTED`,
      );
    }

    // Load packing order with production order for model_id and cmo_line_id
    const withProduction =
      await this.fgRepo.findPackingOrderWithProduction(packingOrderBigInt);
    if (!withProduction) {
      throw new NotFoundException(
        `Packing order ${dto.packing_order_id} not found`,
      );
    }

    const productionOrder = withProduction.production_orders;
    const modelId = productionOrder.model_id;
    const cmoLineId = productionOrder.cmo_line_id ?? undefined;

    // Resolve customer_id (ED-P09-003):
    // For FULL orders with CMO, auto-derive from CMO chain.
    // For PARTIAL orders, caller must provide.
    let customerId: bigint;
    if (cmoLineId !== undefined) {
      const cmoCustomerId = await this.fgRepo.findCMOCustomerId(cmoLineId);
      if (!cmoCustomerId) {
        throw new NotFoundException(
          `CMO line ${cmoLineId} not found while resolving customer`,
        );
      }
      customerId = cmoCustomerId;
    } else {
      if (!dto.customer_id) {
        throw new BadRequestException(
          'customer_id is required for PARTIAL production orders (no CMO linkage)',
        );
      }
      const customer = await this.fgRepo.findCustomerById(
        BigInt(dto.customer_id),
      );
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customer_id} not found`);
      }
      customerId = customer.customer_id;
    }

    // Validate warehouse_id (ED-P09-004)
    const warehouseId = BigInt(dto.warehouse_id);
    const warehouse = await this.fgRepo.findWarehouseById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${dto.warehouse_id} not found`);
    }

    // Resolve dozens_qty (ED-P09-006): default to assembled_dozens
    const dozensQty = dto.dozens_qty ?? Number(withProduction.assembled_dozens);
    if (dozensQty <= 0) {
      throw new BadRequestException('dozens_qty must be greater than 0');
    }

    const now = new Date();
    const bag = await this.fgRepo.createFGBag({
      modelId,
      customerId,
      warehouseId,
      dozensQty,
      cmoLineId,
      createdAt: now,
    });

    this.publisher.emitFinishedGoodsCreated(
      new FinishedGoodsCreatedEvent(
        bag.fg_bag_id.toString(),
        modelId.toString(),
        customerId.toString(),
        warehouseId.toString(),
        dozensQty,
        cmoLineId ? cmoLineId.toString() : null,
        actor.sub.toString(),
        now,
      ),
    );

    this.publisher.emitFinishedGoodsSummaryUpdated(
      new FinishedGoodsSummaryUpdatedEvent(
        modelId.toString(),
        actor.sub.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'finished_goods.created',
      entityType: 'finished_goods_bags',
      entityId: bag.fg_bag_id.toString(),
      userId: actor.sub,
      payload: {
        packing_order_id: dto.packing_order_id,
        model_id: modelId.toString(),
        customer_id: customerId.toString(),
        warehouse_id: warehouseId.toString(),
        dozens_qty: dozensQty,
        cmo_line_id: cmoLineId ? cmoLineId.toString() : null,
      },
    });

    return mapFGBag(bag);
  }
}
