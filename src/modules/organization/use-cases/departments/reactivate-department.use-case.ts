import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { DepartmentsRepository } from '../../repositories/departments.repository';

@Injectable()
export class ReactivateDepartmentUseCase {
  constructor(
    private readonly repo: DepartmentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const departmentId = BigInt(id);
    const dept = await this.repo.findById(departmentId);
    if (!dept) throw new NotFoundException(`Department ${id} not found.`);
    if (dept.is_active)
      throw new BadRequestException(`Department ${id} is already active.`);

    const result = await this.repo.restore(departmentId);

    void this.auditService.log({
      eventType: 'DEPARTMENT_REACTIVATED',
      entityType: 'departments',
      entityId: String(id),
      userId: actorId,
      payload: { department_id: String(id) },
    });

    return result;
  }
}
