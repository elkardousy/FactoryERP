import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { WorkingShiftsRepository } from '../../repositories/working-shifts.repository';

@Injectable()
export class ReactivateWorkingShiftUseCase {
  constructor(
    private readonly repo: WorkingShiftsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const shiftId = BigInt(id);
    const shift = await this.repo.findById(shiftId);
    if (!shift) throw new NotFoundException(`Working shift ${id} not found.`);
    if (shift.is_active)
      throw new BadRequestException(`Working shift ${id} is already active.`);

    const result = await this.repo.restore(shiftId);

    void this.auditService.log({
      eventType: 'WORKING_SHIFT_REACTIVATED',
      entityType: 'working_shifts',
      entityId: String(id),
      userId: actorId,
      payload: { shift_id: String(id) },
    });

    return result;
  }
}
