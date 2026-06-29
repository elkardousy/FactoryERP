import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { inventory_investigations } from '@prisma/client';
import { AccountabilityClosureEnum } from '@prisma/client';
import { LoggerService } from '../../../core/logger/logger.service';
import { InventoryBagsRepository } from '../repositories/inventory-bags.repository';
import { CycleCountRepository } from '../repositories/cycle-count.repository';
import { CycleCountDto, OpenCycleCountResultDto } from '../dto/cycle-count.dto';
import type { OpenCycleCountCommand } from '../use-cases/open-cycle-count/commands/open-cycle-count.command';
import type { ListCycleCountsQuery } from '../use-cases/list-cycle-counts/queries/list-cycle-counts.query';
import type { GetCycleCountQuery } from '../use-cases/get-cycle-count/queries/get-cycle-count.query';
import type { AddCycleCountActionCommand } from '../use-cases/add-cycle-count-action/commands/add-cycle-count-action.command';
import type { CloseCycleCountCommand } from '../use-cases/close-cycle-count/commands/close-cycle-count.command';

@Injectable()
export class CycleCountService {
  constructor(
    private readonly cycleCountRepo: CycleCountRepository,
    private readonly bagsRepo: InventoryBagsRepository,
    private readonly logger: LoggerService,
  ) {}

  async openCycleCount(
    cmd: OpenCycleCountCommand,
  ): Promise<OpenCycleCountResultDto> {
    const bag = await this.bagsRepo.findByKey(
      cmd.warehouse_id,
      cmd.model_id,
      cmd.part_id,
    );
    const systemDozens = bag ? Number(bag.dozens_on_hand) : 0;
    const varianceDozens = cmd.actual_dozens - systemDozens;

    const result = new OpenCycleCountResultDto();
    result.system_dozens = systemDozens.toString();
    result.actual_dozens = cmd.actual_dozens.toString();
    result.variance_dozens = varianceDozens.toString();

    if (varianceDozens === 0) {
      result.has_variance = false;
      this.logger.info(
        `Cycle count ${cmd.investigation_number}: no variance detected`,
      );
      return result;
    }

    const descriptionParts = [
      `System balance: ${systemDozens} doz`,
      `Physical count: ${cmd.actual_dozens} doz`,
      `Variance: ${varianceDozens > 0 ? '+' : ''}${varianceDozens} doz`,
    ];
    if (cmd.notes) descriptionParts.push(cmd.notes);

    const investigation = await this.cycleCountRepo.create({
      investigation_number: cmd.investigation_number,
      warehouse_id: cmd.warehouse_id,
      model_id: cmd.model_id,
      part_id: cmd.part_id,
      description: descriptionParts.join(' | '),
      reported_by: cmd.performed_by,
    });

    result.has_variance = true;
    result.investigation = this.toDto(investigation);

    this.logger.info(
      `Cycle count ${cmd.investigation_number}: variance ${varianceDozens} doz — investigation ${investigation.investigation_id} opened`,
    );
    return result;
  }

  async listCycleCounts(query: ListCycleCountsQuery): Promise<CycleCountDto[]> {
    const investigations = await this.cycleCountRepo.findMany(
      {
        warehouse_id: query.warehouse_id ?? undefined,
        model_id: query.model_id ?? undefined,
        closure_status: query.closure_status ?? undefined,
      },
      query.page,
      query.limit,
    );
    return investigations.map((i) => this.toDto(i));
  }

  async getCycleCount(query: GetCycleCountQuery): Promise<CycleCountDto> {
    const investigation = await this.cycleCountRepo.findById(
      query.investigation_id,
    );
    if (!investigation) {
      throw new NotFoundException(
        `Cycle count investigation ${query.investigation_id} not found`,
      );
    }
    return this.toDto(investigation);
  }

  async addAction(
    cmd: AddCycleCountActionCommand,
  ): Promise<{ action_id: string; performed_at: string }> {
    const investigation = await this.cycleCountRepo.findById(
      cmd.investigation_id,
    );
    if (!investigation) {
      throw new NotFoundException(
        `Cycle count investigation ${cmd.investigation_id} not found`,
      );
    }
    if (investigation.closure_status === AccountabilityClosureEnum.CLOSED) {
      throw new UnprocessableEntityException(
        `Cannot add action to a closed investigation`,
      );
    }
    const action = await this.cycleCountRepo.addAction(
      cmd.investigation_id,
      cmd.action_note,
      cmd.performed_by,
    );
    this.logger.info(
      `Action added to cycle count ${cmd.investigation_id} by user ${cmd.performed_by}`,
    );
    return {
      action_id: action.action_id.toString(),
      performed_at: action.performed_at.toISOString(),
    };
  }

  async closeCycleCount(cmd: CloseCycleCountCommand): Promise<CycleCountDto> {
    const investigation = await this.cycleCountRepo.findById(
      cmd.investigation_id,
    );
    if (!investigation) {
      throw new NotFoundException(
        `Cycle count investigation ${cmd.investigation_id} not found`,
      );
    }
    if (investigation.closure_status === AccountabilityClosureEnum.CLOSED) {
      throw new UnprocessableEntityException(
        `Investigation ${cmd.investigation_id} is already closed`,
      );
    }
    const closed = await this.cycleCountRepo.close(cmd.investigation_id, {
      root_cause_category: cmd.root_cause_category,
      corrective_action: cmd.corrective_action,
      preventive_action: cmd.preventive_action,
      closed_by: cmd.closed_by,
    });
    this.logger.info(
      `Cycle count investigation ${cmd.investigation_id} closed by user ${cmd.closed_by}`,
    );
    return this.toDto(closed);
  }

  private toDto(i: inventory_investigations): CycleCountDto {
    const dto = new CycleCountDto();
    dto.investigation_id = i.investigation_id.toString();
    dto.investigation_number = i.investigation_number;
    dto.warehouse_id = i.warehouse_id ? i.warehouse_id.toString() : null;
    dto.model_id = i.model_id ? i.model_id.toString() : null;
    dto.part_id = i.part_id ? i.part_id.toString() : null;
    dto.description = i.description;
    dto.closure_status = i.closure_status;
    dto.root_cause_category = i.root_cause_category ?? null;
    dto.corrective_action = i.corrective_action ?? null;
    dto.preventive_action = i.preventive_action ?? null;
    dto.reported_by = i.reported_by.toString();
    dto.reported_at = i.reported_at.toISOString();
    dto.closed_by = i.closed_by ? i.closed_by.toString() : null;
    dto.closed_at = i.closed_at ? i.closed_at.toISOString() : null;
    return dto;
  }
}
