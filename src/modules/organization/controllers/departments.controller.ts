import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import { IdParamDto } from '../../../common/dto/params/id-param.dto';
import {
  CreateDepartmentDto,
  DepartmentFilterDto,
  UpdateDepartmentDto,
} from '../dto/department.dto';
import { CreateDepartmentUseCase } from '../use-cases/departments/create-department.use-case';
import { DeactivateDepartmentUseCase } from '../use-cases/departments/deactivate-department.use-case';
import { ReactivateDepartmentUseCase } from '../use-cases/departments/reactivate-department.use-case';
import { GetDepartmentUseCase } from '../use-cases/departments/get-department.use-case';
import { ListDepartmentsUseCase } from '../use-cases/departments/list-departments.use-case';
import { UpdateDepartmentUseCase } from '../use-cases/departments/update-department.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Organization / Departments')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'organization/departments', version: '1' })
export class DepartmentsController {
  constructor(
    private readonly createUseCase: CreateDepartmentUseCase,
    private readonly getUseCase: GetDepartmentUseCase,
    private readonly updateUseCase: UpdateDepartmentUseCase,
    private readonly listUseCase: ListDepartmentsUseCase,
    private readonly deactivateUseCase: DeactivateDepartmentUseCase,
    private readonly reactivateUseCase: ReactivateDepartmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List departments with pagination and filtering' })
  list(@Query() filter: DepartmentFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a department' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Deactivate a department (soft delete)' })
  deactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deactivateUseCase.execute(params.id, user.sub);
  }

  @Patch(':id/reactivate')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Reactivate a previously deactivated department' })
  reactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.reactivateUseCase.execute(params.id, user.sub);
  }
}
