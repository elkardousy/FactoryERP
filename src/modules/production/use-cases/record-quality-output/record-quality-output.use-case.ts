import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatusEnum, StageStatusEnum } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ProductionOrdersRepository } from '../../repositories/production-orders.repository';
import { ProductionStagesRepository } from '../../repositories/production-stages.repository';
import { ProductionQualityRepository } from '../../repositories/production-quality.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import {
  ProductionQualityRecordedEvent,
  ProductionQualitySummaryUpdatedEvent,
} from '../../events/production.events';
import type {
  RecordQualityOutputDto,
  QualityBoxResponseDto,
} from '../../dto/production-quality.dto';
import { mapQualityBox } from '../../dto/production-quality.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class RecordQualityOutputUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly stagesRepo: ProductionStagesRepository,
    private readonly qualityRepo: ProductionQualityRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    dto: RecordQualityOutputDto,
    actor: JwtPayload,
  ): Promise<QualityBoxResponseDto> {
    const orderId = BigInt(dto.order_id);
    const colorId = BigInt(dto.color_id);
    const sizeId = BigInt(dto.size_id);

    // Order must exist and be IN_PRODUCTION or PRODUCTION_COMPLETE (ED-P06-005)
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Production order ${dto.order_id} not found`);
    }
    const allowedStatuses: OrderStatusEnum[] = [
      OrderStatusEnum.IN_PRODUCTION,
      OrderStatusEnum.PRODUCTION_COMPLETE,
    ];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot record quality output: order status must be IN_PRODUCTION or PRODUCTION_COMPLETE, current is ${order.status}`,
      );
    }

    // Final stage must be COMPLETE (BR-S06)
    const stageLogs = await this.stagesRepo.findLogsByOrder(orderId);
    if (stageLogs.length === 0) {
      throw new BadRequestException(
        `No stage logs found for order ${dto.order_id}`,
      );
    }
    const lastLog = stageLogs[stageLogs.length - 1];
    if (lastLog.status !== StageStatusEnum.COMPLETE) {
      throw new BadRequestException(
        `Cannot record quality output: final stage is not yet COMPLETE (current status: ${lastLog.status})`,
      );
    }

    const finalStageOutputDozens = Number(lastLog.output_dozens ?? 0);

    // BR-Q03: current total QO + new dozens ≤ final stage output (ED-P06-003)
    const currentTotal =
      await this.qualityRepo.getTotalAvailableForOrder(orderId);
    if (currentTotal + dto.dozens_passed > finalStageOutputDozens + 0.0001) {
      throw new BadRequestException(
        `Quality output would exceed final stage output: current QO total (${currentTotal}) + new (${dto.dozens_passed}) = ${currentTotal + dto.dozens_passed}, exceeds stage output (${finalStageOutputDozens})`,
      );
    }

    const now = new Date();
    const actorId = actor.sub;

    // BR-Q01/Q02: upsert-add with optimistic lock
    const box = await this.qualityRepo.upsertAndRecordTransaction({
      orderId,
      modelId: order.model_id,
      colorId,
      sizeId,
      dozensToAdd: dto.dozens_passed,
      executedBy: actorId,
      now,
    });

    // Fetch with relations for response
    const boxWithRelations = await this.qualityRepo.findBoxById(box.box_id);
    if (!boxWithRelations) {
      throw new NotFoundException(
        `Quality box ${box.box_id} not found after upsert`,
      );
    }

    this.publisher.emitQualityRecorded(
      new ProductionQualityRecordedEvent(
        box.box_id.toString(),
        dto.order_id,
        dto.color_id,
        dto.size_id,
        dto.dozens_passed,
        Number(box.dozens_available),
        actorId.toString(),
        now,
      ),
    );

    this.publisher.emitQualitySummaryUpdated(
      new ProductionQualitySummaryUpdatedEvent(
        dto.order_id,
        actorId.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'production.quality.recorded',
      entityType: 'quality_output_boxes',
      entityId: box.box_id.toString(),
      userId: actorId,
      payload: {
        order_id: dto.order_id,
        color_id: dto.color_id,
        size_id: dto.size_id,
        dozens_passed: dto.dozens_passed,
        dozens_available: Number(box.dozens_available),
      },
    });

    this.logger.info(
      `QO recorded for order ${dto.order_id} color ${dto.color_id} size ${dto.size_id}: +${dto.dozens_passed} dozens (total: ${box.dozens_available.toString()})`,
    );

    return mapQualityBox(boxWithRelations);
  }
}
