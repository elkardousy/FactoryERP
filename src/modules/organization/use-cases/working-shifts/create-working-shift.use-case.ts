import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { WorkingShiftsRepository } from '../../repositories/working-shifts.repository';
import { CreateWorkingShiftDto } from '../../dto/working-shift.dto';

function parseTime(timeStr: string): Date {
  const [h, m, s = '00'] = timeStr.split(':');
  return new Date(
    `1970-01-01T${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}.000Z`,
  );
}

@Injectable()
export class CreateWorkingShiftUseCase {
  constructor(
    private readonly repo: WorkingShiftsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateWorkingShiftDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.shift_code);
    if (existing) {
      throw new ConflictException(
        `Shift code '${dto.shift_code}' already exists.`,
      );
    }

    const shift = await this.repo.create({
      shift_code: dto.shift_code,
      shift_name: dto.shift_name,
      start_time: parseTime(dto.start_time),
      end_time: parseTime(dto.end_time),
    });

    void this.auditService.log({
      eventType: 'WORKING_SHIFT_CREATED',
      entityType: 'working_shifts',
      entityId: String(shift.shift_id),
      userId: actorId,
      payload: { shift_code: shift.shift_code, shift_name: shift.shift_name },
    });

    return shift;
  }
}
