import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../../core/audit/audit.service';
import { DepartmentsRepository } from '../../repositories/departments.repository';
import { CreateDepartmentDto } from '../../dto/department.dto';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    private readonly repo: DepartmentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateDepartmentDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.dept_code);
    if (existing) {
      throw new ConflictException(
        `Department code '${dto.dept_code}' already exists.`,
      );
    }

    if (dto.parent_department_id) {
      const parent = await this.repo.findById(BigInt(dto.parent_department_id));
      if (!parent) {
        throw new NotFoundException(
          `Parent department ${dto.parent_department_id} not found.`,
        );
      }
    }

    const dept = await this.repo.create({
      dept_code: dto.dept_code,
      dept_name: dto.dept_name,
      description: dto.description,
      parent_department_id: dto.parent_department_id
        ? BigInt(dto.parent_department_id)
        : undefined,
    });

    void this.auditService.log({
      eventType: 'DEPARTMENT_CREATED',
      entityType: 'departments',
      entityId: String(dept.department_id),
      userId: actorId,
      payload: { dept_code: dept.dept_code, dept_name: dept.dept_name },
    });

    return dept;
  }
}
