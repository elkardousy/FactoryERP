import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { DepartmentsRepository } from '../../repositories/departments.repository';

@Injectable()
export class DeactivateDepartmentUseCase {
  constructor(
    private readonly repo: DepartmentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const departmentId = BigInt(id);
    const dept = await this.repo.findById(departmentId);
    if (!dept) {
      throw new NotFoundException(`Department ${id} not found.`);
    }
    if (!dept.is_active) {
      throw new BadRequestException(`Department ${id} is already deactivated.`);
    }

    const activeChildCount = dept.departments_children?.length ?? 0;
    if (activeChildCount > 0) {
      throw new BadRequestException(
        `Cannot deactivate department ${id}: it has ${activeChildCount} active child department(s).`,
      );
    }

    const result = await this.repo.softDelete(departmentId);

    void this.auditService.log({
      eventType: 'DEPARTMENT_DEACTIVATED',
      entityType: 'departments',
      entityId: String(id),
      userId: actorId,
      payload: { department_id: String(id) },
    });

    return result;
  }
}
