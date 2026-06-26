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
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseFilterDto,
} from '../dto/warehouse.dto';
import { CreateWarehouseUseCase } from '../use-cases/create-warehouse.use-case';
import { DeactivateWarehouseUseCase } from '../use-cases/deactivate-warehouse.use-case';
import { ReactivateWarehouseUseCase } from '../use-cases/reactivate-warehouse.use-case';
import { GetWarehouseUseCase } from '../use-cases/get-warehouse.use-case';
import { ListWarehousesUseCase } from '../use-cases/list-warehouses.use-case';
import { UpdateWarehouseUseCase } from '../use-cases/update-warehouse.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Warehouses')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'warehouses', version: '1' })
export class WarehousesController {
  constructor(
    private readonly createUseCase: CreateWarehouseUseCase,
    private readonly getUseCase: GetWarehouseUseCase,
    private readonly updateUseCase: UpdateWarehouseUseCase,
    private readonly listUseCase: ListWarehousesUseCase,
    private readonly deactivateUseCase: DeactivateWarehouseUseCase,
    private readonly reactivateUseCase: ReactivateWarehouseUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new warehouse' })
  create(@Body() dto: CreateWarehouseDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List warehouses with pagination and filtering' })
  list(@Query() filter: WarehouseFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a warehouse by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a warehouse' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateWarehouseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Deactivate a warehouse (soft delete)' })
  deactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deactivateUseCase.execute(params.id, user.sub);
  }

  @Patch(':id/reactivate')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Reactivate a previously deactivated warehouse' })
  reactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.reactivateUseCase.execute(params.id, user.sub);
  }
}
