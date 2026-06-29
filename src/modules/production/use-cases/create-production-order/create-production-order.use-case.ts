import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReleaseTypeEnum } from '@prisma/client';
import { DocumentNumberingService } from '../../../../core/document-numbering/document-numbering.service';
import { AuditService } from '../../../../core/audit/audit.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { ProductionOrderCreatedEvent } from '../../events/production.events';
import {
  mapOrder,
  type CreateProductionOrderDto,
  type ProductionOrderResponseDto,
} from '../../dto/production-order.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

const PROD_ORDER_SEQUENCE = 'PROD_ORDER';

@Injectable()
export class CreateProductionOrderUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly docNumbering: DocumentNumberingService,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    dto: CreateProductionOrderDto,
    actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    if (dto.release_type === ReleaseTypeEnum.FULL && !dto.cmo_line_id) {
      throw new BadRequestException(
        'cmo_line_id is required for FULL release orders',
      );
    }

    const modelId = BigInt(dto.model_id);
    const lineId = BigInt(dto.line_id);
    const partIds = dto.part_ids.map((id) => BigInt(id));
    const cmoLineId = dto.cmo_line_id ? BigInt(dto.cmo_line_id) : undefined;

    const allPartsValid = await this.ordersRepo.validatePartsExistForModel(
      modelId,
      partIds,
    );
    if (!allPartsValid) {
      throw new NotFoundException(
        'One or more part_ids do not belong to the specified model',
      );
    }

    const orderNumber = await this.docNumbering.generate(PROD_ORDER_SEQUENCE);

    const order = await this.ordersRepo.create({
      order_number: orderNumber,
      model_id: modelId,
      line_id: lineId,
      release_type: dto.release_type,
      cmo_line_id: cmoLineId,
      target_dozens: dto.target_dozens,
      notes: dto.notes,
      created_by: actor.sub,
    });

    const parts = await this.ordersRepo.createParts(order.order_id, partIds);

    this.publisher.emitOrderCreated(
      new ProductionOrderCreatedEvent(
        order.order_id.toString(),
        order.order_number,
        order.model_id.toString(),
        order.line_id.toString(),
        order.release_type,
        order.cmo_line_id?.toString() ?? null,
        actor.sub.toString(),
        new Date(),
      ),
    );

    await this.auditService.log({
      eventType: 'production_order.created',
      entityType: 'production_orders',
      entityId: order.order_id.toString(),
      userId: actor.sub,
      payload: { order_number: orderNumber, status: 'DRAFT' },
    });

    return mapOrder({ ...order, production_order_parts: parts });
  }
}
