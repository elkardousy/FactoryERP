import { Injectable } from '@nestjs/common';
import {
  AccountabilityClosureEnum,
  InvestigationTypeEnum,
  RootCauseCategoryEnum,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type {
  inventory_investigations,
  inventory_investigation_actions,
} from '@prisma/client';

export interface CreateCycleCountData {
  investigation_number: string;
  warehouse_id?: bigint | null;
  model_id?: bigint | null;
  part_id?: bigint | null;
  description: string;
  reported_by: bigint;
}

export interface CloseCycleCountData {
  root_cause_category?: RootCauseCategoryEnum | null;
  corrective_action?: string | null;
  preventive_action?: string | null;
  closed_by: bigint;
}

export interface CycleCountFilter {
  warehouse_id?: bigint;
  model_id?: bigint;
  closure_status?: AccountabilityClosureEnum;
}

@Injectable()
export class CycleCountRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateCycleCountData): Promise<inventory_investigations> {
    return this.db.inventory_investigations.create({
      data: {
        investigation_type: InvestigationTypeEnum.INVENTORY_VARIANCE,
        investigation_number: data.investigation_number,
        warehouse_id: data.warehouse_id ?? null,
        model_id: data.model_id ?? null,
        part_id: data.part_id ?? null,
        description: data.description,
        closure_status: AccountabilityClosureEnum.OPEN,
        reported_by: data.reported_by,
      },
    });
  }

  async findById(
    investigationId: bigint,
  ): Promise<inventory_investigations | null> {
    return this.db.inventory_investigations.findFirst({
      where: {
        investigation_id: investigationId,
        investigation_type: InvestigationTypeEnum.INVENTORY_VARIANCE,
      },
    });
  }

  async findMany(
    filter: CycleCountFilter,
    page: number,
    limit: number,
  ): Promise<inventory_investigations[]> {
    return this.db.inventory_investigations.findMany({
      where: {
        investigation_type: InvestigationTypeEnum.INVENTORY_VARIANCE,
        ...(filter.warehouse_id && { warehouse_id: filter.warehouse_id }),
        ...(filter.model_id && { model_id: filter.model_id }),
        ...(filter.closure_status && { closure_status: filter.closure_status }),
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { reported_at: 'desc' },
    });
  }

  async addAction(
    investigationId: bigint,
    actionNote: string,
    performedBy: bigint,
  ): Promise<inventory_investigation_actions> {
    return this.db.inventory_investigation_actions.create({
      data: {
        investigation_id: investigationId,
        action_note: actionNote,
        performed_by: performedBy,
      },
    });
  }

  async close(
    investigationId: bigint,
    data: CloseCycleCountData,
  ): Promise<inventory_investigations> {
    return this.db.inventory_investigations.update({
      where: { investigation_id: investigationId },
      data: {
        closure_status: AccountabilityClosureEnum.CLOSED,
        root_cause_category: data.root_cause_category ?? null,
        corrective_action: data.corrective_action ?? null,
        preventive_action: data.preventive_action ?? null,
        closed_by: data.closed_by,
        closed_at: new Date(),
      },
    });
  }
}
