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
import type {
  CreateIncompleteRecordData,
  CreateScrapRecordData,
} from '../../repositories/production-stages.repository';
import { ProductionEventPublisher } from '../../events/production-event.publisher';
import { ProductionStageCompletedEvent } from '../../events/production.events';
import type { RecordStageOutputDto } from '../../dto/production-stage.dto';
import {
  mapStageLogDetail,
  type StageLogDetailDto,
} from '../../dto/production-stage.dto';
import type { JwtPayload } from '../../../auth/use-cases/login';

@Injectable()
export class RecordStageOutputUseCase {
  constructor(
    private readonly ordersRepo: ProductionOrdersRepository,
    private readonly stagesRepo: ProductionStagesRepository,
    private readonly publisher: ProductionEventPublisher,
    private readonly auditService: AuditService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    orderId: string,
    stageId: string,
    dto: RecordStageOutputDto,
    actor: JwtPayload,
  ): Promise<StageLogDetailDto> {
    const oid = BigInt(orderId);
    const sid = BigInt(stageId);

    // Order must be IN_PRODUCTION
    const order = await this.ordersRepo.findById(oid);
    if (!order) {
      throw new NotFoundException(`Production order ${orderId} not found`);
    }
    if (order.status !== OrderStatusEnum.IN_PRODUCTION) {
      throw new BadRequestException(
        `Cannot record output: order must be IN_PRODUCTION, current status is ${order.status}`,
      );
    }

    // Stage log must exist and be IN_PROGRESS
    const log = await this.stagesRepo.findLogByOrderAndStage(oid, sid);
    if (!log) {
      throw new NotFoundException(
        `Stage log not found for order ${orderId} and stage ${stageId}`,
      );
    }
    if (log.status !== StageStatusEnum.IN_PROGRESS) {
      throw new BadRequestException(
        `Stage ${stageId} is not IN_PROGRESS (current status: ${log.status})`,
      );
    }

    const inputDozens = Number(log.input_dozens ?? 0);

    // Compute scrap and incomplete totals
    const scrapDozens = dto.scrap_records.reduce(
      (sum, r) => sum + r.dozens_scrapped,
      0,
    );
    const incompleteDozens = dto.incomplete_records.reduce(
      (sum, r) => sum + r.dozens_incomplete,
      0,
    );

    // BR-S02: conservation law
    const outputTotal = dto.output_dozens + scrapDozens + incompleteDozens;
    if (Math.abs(outputTotal - inputDozens) > 0.0001) {
      throw new BadRequestException(
        `Conservation law violated: output(${dto.output_dozens}) + scrap(${scrapDozens}) + incomplete(${incompleteDozens}) = ${outputTotal}, expected ${inputDozens}`,
      );
    }

    // BR-S07: scrap records required if scrap > 0
    if (scrapDozens > 0 && dto.scrap_records.length === 0) {
      throw new BadRequestException(
        'scrap_records must be non-empty when total scrap dozens > 0',
      );
    }

    // BR-S08: incomplete records required if incomplete > 0
    if (incompleteDozens > 0 && dto.incomplete_records.length === 0) {
      throw new BadRequestException(
        'incomplete_records must be non-empty when total incomplete dozens > 0',
      );
    }

    const now = new Date();
    const actorId = actor.sub;

    const scrapData: CreateScrapRecordData[] = dto.scrap_records.map((r) => ({
      log_id: log.log_id,
      order_id: oid,
      stage_id: sid,
      scrap_type: r.scrap_type,
      dozens_scrapped: r.dozens_scrapped,
      color_id: r.color_id ? BigInt(r.color_id) : null,
      size_id: r.size_id ? BigInt(r.size_id) : null,
      notes: r.notes ?? null,
      recorded_by: actorId,
    }));

    const incompleteData: CreateIncompleteRecordData[] =
      dto.incomplete_records.map((r) => ({
        log_id: log.log_id,
        order_id: oid,
        stage_id: sid,
        reason_type: r.reason,
        dozens_incomplete: r.dozens_incomplete,
        notes: r.notes ?? null,
        recorded_by: actorId,
      }));

    const isLast = await this.stagesRepo.isLastStage(sid);

    const updatedLog = await this.stagesRepo.executeInTransaction(async (tx) =>
      this.stagesRepo.completeStageInTx(
        tx,
        log.log_id,
        oid,
        sid,
        dto.output_dozens,
        scrapDozens,
        incompleteDozens,
        actorId,
        now,
        scrapData,
        incompleteData,
      ),
    );

    this.publisher.emitStageCompleted(
      new ProductionStageCompletedEvent(
        orderId,
        stageId,
        updatedLog.log_id.toString(),
        inputDozens,
        dto.output_dozens,
        scrapDozens,
        incompleteDozens,
        isLast,
        actorId.toString(),
        now,
      ),
    );

    await this.auditService.log({
      eventType: 'production.stage.completed',
      entityType: 'production_stage_logs',
      entityId: updatedLog.log_id.toString(),
      userId: actorId,
      payload: {
        order_id: orderId,
        stage_id: stageId,
        input_dozens: inputDozens,
        output_dozens: dto.output_dozens,
        scrap_dozens: scrapDozens,
        incomplete_dozens: incompleteDozens,
        is_last_stage: isLast,
      },
    });

    this.logger.info(
      `Stage ${stageId} completed for order ${orderId}: output=${dto.output_dozens} scrap=${scrapDozens} incomplete=${incompleteDozens} isLast=${isLast}`,
    );

    return mapStageLogDetail(updatedLog);
  }
}
