import { Injectable } from '@nestjs/common';
import { StageStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type {
  production_stages,
  production_stage_logs,
  scrap_records,
  incomplete_item_records,
} from '@prisma/client';
import type {
  StageLogWithDetails,
  StageLogWithStage,
} from '../dto/production-stage.dto';
import type { PrismaService as PrismaTx } from '../../../core/database/prisma/prisma.service';

export interface CreateScrapRecordData {
  log_id: bigint;
  order_id: bigint;
  stage_id: bigint;
  scrap_type: scrap_records['scrap_type'];
  dozens_scrapped: number;
  color_id?: bigint | null;
  size_id?: bigint | null;
  notes?: string | null;
  recorded_by: bigint;
}

export interface CreateIncompleteRecordData {
  log_id: bigint;
  order_id: bigint;
  stage_id: bigint;
  reason_type: incomplete_item_records['reason_type'];
  dozens_incomplete: number;
  notes?: string | null;
  recorded_by: bigint;
}

@Injectable()
export class ProductionStagesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findStageById(stageId: bigint): Promise<production_stages | null> {
    return this.db.production_stages.findUnique({
      where: { stage_id: stageId },
    });
  }

  async findLogByOrderAndStage(
    orderId: bigint,
    stageId: bigint,
  ): Promise<StageLogWithStage | null> {
    return this.db.production_stage_logs.findFirst({
      where: { order_id: orderId, stage_id: stageId },
      include: { production_stages: true },
    });
  }

  async findLogWithDetailsByOrderAndStage(
    orderId: bigint,
    stageId: bigint,
  ): Promise<StageLogWithDetails | null> {
    return this.db.production_stage_logs.findFirst({
      where: { order_id: orderId, stage_id: stageId },
      include: {
        production_stages: true,
        scrap_records: { orderBy: { recorded_at: 'asc' } },
        incomplete_item_records: { orderBy: { recorded_at: 'asc' } },
      },
    });
  }

  async findLogsByOrder(orderId: bigint): Promise<StageLogWithStage[]> {
    return this.db.production_stage_logs.findMany({
      where: { order_id: orderId },
      include: { production_stages: true },
      orderBy: { production_stages: { sequence_order: 'asc' } },
    });
  }

  async findPreviousStageLog(
    orderId: bigint,
    currentSequenceOrder: number,
  ): Promise<production_stage_logs | null> {
    const prevStage = await this.db.production_stages.findFirst({
      where: { sequence_order: { lt: currentSequenceOrder } },
      orderBy: { sequence_order: 'desc' },
      select: { stage_id: true },
    });
    if (!prevStage) return null;
    return this.db.production_stage_logs.findFirst({
      where: { order_id: orderId, stage_id: prevStage.stage_id },
    });
  }

  async isFirstStage(sequenceOrder: number): Promise<boolean> {
    const minStage = await this.db.production_stages.findFirst({
      orderBy: { sequence_order: 'asc' },
      select: { sequence_order: true },
    });
    return minStage?.sequence_order === sequenceOrder;
  }

  async isLastStage(stageId: bigint): Promise<boolean> {
    const maxStage = await this.db.production_stages.findFirst({
      orderBy: { sequence_order: 'desc' },
      select: { stage_id: true },
    });
    return maxStage?.stage_id === stageId;
  }

  async sumReleasedDozensForOrder(orderId: bigint): Promise<number> {
    const result = await this.db.release_group_lines.aggregate({
      _sum: { dozens_released: true },
      where: {
        release_groups: { order_id: orderId },
      },
    });
    return Number(result._sum.dozens_released ?? 0);
  }

  async startStage(
    logId: bigint,
    inputDozens: number,
    startedBy: bigint,
    startedAt: Date,
  ): Promise<StageLogWithStage> {
    return this.db.production_stage_logs.update({
      where: { log_id: logId },
      data: {
        status: StageStatusEnum.IN_PROGRESS,
        input_dozens: inputDozens,
        started_by: startedBy,
        started_at: startedAt,
      },
      include: { production_stages: true },
    });
  }

  async completeStageInTx(
    tx: PrismaTx,
    logId: bigint,
    orderId: bigint,
    stageId: bigint,
    outputDozens: number,
    scrapDozens: number,
    incompleteDozens: number,
    completedBy: bigint,
    completedAt: Date,
    scrapInputs: CreateScrapRecordData[],
    incompleteInputs: CreateIncompleteRecordData[],
  ): Promise<StageLogWithDetails> {
    if (scrapInputs.length > 0) {
      await tx.scrap_records.createMany({ data: scrapInputs });
    }
    if (incompleteInputs.length > 0) {
      await tx.incomplete_item_records.createMany({ data: incompleteInputs });
    }

    const updated = await tx.production_stage_logs.update({
      where: { log_id: logId },
      data: {
        status: StageStatusEnum.COMPLETE,
        output_dozens: outputDozens,
        scrap_dozens: scrapDozens,
        incomplete_dozens: incompleteDozens,
        completed_by: completedBy,
        completed_at: completedAt,
      },
      include: {
        production_stages: true,
        scrap_records: { orderBy: { recorded_at: 'asc' } },
        incomplete_item_records: { orderBy: { recorded_at: 'asc' } },
      },
    });

    return updated;
  }
}
