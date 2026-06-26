import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { DepartmentsRepository } from '../../repositories/departments.repository';
import { UpdateDepartmentDto } from '../../dto/department.dto';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    private readonly repo: DepartmentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateDepartmentDto, actorId: bigint) {
    const departmentId = BigInt(id);

    const dept = await this.repo.findById(departmentId);
    if (!dept) {
      throw new NotFoundException(`Department ${id} not found.`);
    }

    if (dto.dept_code && dto.dept_code !== dept.dept_code) {
      const conflict = await this.repo.findByCode(dto.dept_code);
      if (conflict) {
        throw new ConflictException(
          `Department code '${dto.dept_code}' already exists.`,
        );
      }
    }

    if (dto.parent_department_id) {
      if (dto.parent_department_id === id) {
        throw new ConflictException('A department cannot be its own parent.');
      }
      const parent = await this.repo.findById(BigInt(dto.parent_department_id));
      if (!parent) {
        throw new NotFoundException(
          `Parent department ${dto.parent_department_id} not found.`,
        );
      }
    }

    const updated = await this.repo.update(departmentId, {
      dept_code: dto.dept_code,
      dept_name: dto.dept_name,
      description: dto.description,
      parent_department_id: dto.parent_department_id
        ? BigInt(dto.parent_department_id)
        : undefined,
    });

    void this.auditService.log({
      eventType: 'DEPARTMENT_UPDATED',
      entityType: 'departments',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
