import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { WorkingShiftsRepository } from '../../repositories/working-shifts.repository';
import { UpdateWorkingShiftDto } from '../../dto/working-shift.dto';

function parseTime(timeStr: string): Date {
  const [h, m, s = '00'] = timeStr.split(':');
  return new Date(
    `1970-01-01T${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}.000Z`,
  );
}

@Injectable()
export class UpdateWorkingShiftUseCase {
  constructor(
    private readonly repo: WorkingShiftsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateWorkingShiftDto, actorId: bigint) {
    const shiftId = BigInt(id);

    const shift = await this.repo.findById(shiftId);
    if (!shift) {
      throw new NotFoundException(`Working shift ${id} not found.`);
    }

    if (dto.shift_code && dto.shift_code !== shift.shift_code) {
      const conflict = await this.repo.findByCode(dto.shift_code);
      if (conflict) {
        throw new ConflictException(
          `Shift code '${dto.shift_code}' already exists.`,
        );
      }
    }

    const updated = await this.repo.update(shiftId, {
      shift_code: dto.shift_code,
      shift_name: dto.shift_name,
      start_time: dto.start_time ? parseTime(dto.start_time) : undefined,
      end_time: dto.end_time ? parseTime(dto.end_time) : undefined,
    });

    void this.auditService.log({
      eventType: 'WORKING_SHIFT_UPDATED',
      entityType: 'working_shifts',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
