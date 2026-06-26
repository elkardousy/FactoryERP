import { Module } from '@nestjs/common';

import { DepartmentsRepository } from './repositories/departments.repository';
import { WorkingShiftsRepository } from './repositories/working-shifts.repository';

import { CreateDepartmentUseCase } from './use-cases/departments/create-department.use-case';
import { DeactivateDepartmentUseCase } from './use-cases/departments/deactivate-department.use-case';
import { ReactivateDepartmentUseCase } from './use-cases/departments/reactivate-department.use-case';
import { GetDepartmentUseCase } from './use-cases/departments/get-department.use-case';
import { ListDepartmentsUseCase } from './use-cases/departments/list-departments.use-case';
import { UpdateDepartmentUseCase } from './use-cases/departments/update-department.use-case';

import { CreateWorkingShiftUseCase } from './use-cases/working-shifts/create-working-shift.use-case';
import { DeactivateWorkingShiftUseCase } from './use-cases/working-shifts/deactivate-working-shift.use-case';
import { ReactivateWorkingShiftUseCase } from './use-cases/working-shifts/reactivate-working-shift.use-case';
import { GetWorkingShiftUseCase } from './use-cases/working-shifts/get-working-shift.use-case';
import { ListWorkingShiftsUseCase } from './use-cases/working-shifts/list-working-shifts.use-case';
import { UpdateWorkingShiftUseCase } from './use-cases/working-shifts/update-working-shift.use-case';

import { DepartmentsController } from './controllers/departments.controller';
import { WorkingShiftsController } from './controllers/working-shifts.controller';

@Module({
  controllers: [DepartmentsController, WorkingShiftsController],
  providers: [
    // Repositories
    DepartmentsRepository,
    WorkingShiftsRepository,

    // Department use cases
    CreateDepartmentUseCase,
    GetDepartmentUseCase,
    UpdateDepartmentUseCase,
    ListDepartmentsUseCase,
    DeactivateDepartmentUseCase,
    ReactivateDepartmentUseCase,

    // Working shift use cases
    CreateWorkingShiftUseCase,
    GetWorkingShiftUseCase,
    UpdateWorkingShiftUseCase,
    ListWorkingShiftsUseCase,
    DeactivateWorkingShiftUseCase,
    ReactivateWorkingShiftUseCase,
  ],
})
export class OrganizationModule {}
