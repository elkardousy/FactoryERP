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
  CreateWorkingShiftDto,
  UpdateWorkingShiftDto,
  WorkingShiftFilterDto,
} from '../dto/working-shift.dto';
import { CreateWorkingShiftUseCase } from '../use-cases/working-shifts/create-working-shift.use-case';
import { DeactivateWorkingShiftUseCase } from '../use-cases/working-shifts/deactivate-working-shift.use-case';
import { ReactivateWorkingShiftUseCase } from '../use-cases/working-shifts/reactivate-working-shift.use-case';
import { GetWorkingShiftUseCase } from '../use-cases/working-shifts/get-working-shift.use-case';
import { ListWorkingShiftsUseCase } from '../use-cases/working-shifts/list-working-shifts.use-case';
import { UpdateWorkingShiftUseCase } from '../use-cases/working-shifts/update-working-shift.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Organization / Working Shifts')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'organization/working-shifts', version: '1' })
export class WorkingShiftsController {
  constructor(
    private readonly createUseCase: CreateWorkingShiftUseCase,
    private readonly getUseCase: GetWorkingShiftUseCase,
    private readonly updateUseCase: UpdateWorkingShiftUseCase,
    private readonly listUseCase: ListWorkingShiftsUseCase,
    private readonly deactivateUseCase: DeactivateWorkingShiftUseCase,
    private readonly reactivateUseCase: ReactivateWorkingShiftUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new working shift' })
  create(@Body() dto: CreateWorkingShiftDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'List working shifts with pagination and filtering',
  })
  list(@Query() filter: WorkingShiftFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a working shift by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a working shift' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateWorkingShiftDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Deactivate a working shift (soft delete)' })
  deactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deactivateUseCase.execute(params.id, user.sub);
  }

  @Patch(':id/reactivate')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Reactivate a previously deactivated working shift',
  })
  reactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.reactivateUseCase.execute(params.id, user.sub);
  }
}
