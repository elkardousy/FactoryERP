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
  CreateSupplierDto,
  SupplierFilterDto,
  UpdateSupplierDto,
} from '../dto/supplier.dto';
import { CreateSupplierUseCase } from '../use-cases/create-supplier.use-case';
import { DeactivateSupplierUseCase } from '../use-cases/deactivate-supplier.use-case';
import { ReactivateSupplierUseCase } from '../use-cases/reactivate-supplier.use-case';
import { GetSupplierUseCase } from '../use-cases/get-supplier.use-case';
import { ListSuppliersUseCase } from '../use-cases/list-suppliers.use-case';
import { UpdateSupplierUseCase } from '../use-cases/update-supplier.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Suppliers')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'suppliers', version: '1' })
export class SuppliersController {
  constructor(
    private readonly createUseCase: CreateSupplierUseCase,
    private readonly getUseCase: GetSupplierUseCase,
    private readonly updateUseCase: UpdateSupplierUseCase,
    private readonly listUseCase: ListSuppliersUseCase,
    private readonly deactivateUseCase: DeactivateSupplierUseCase,
    private readonly reactivateUseCase: ReactivateSupplierUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new supplier' })
  create(@Body() dto: CreateSupplierDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers with pagination and filtering' })
  list(@Query() filter: SupplierFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a supplier' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Deactivate a supplier (soft delete)' })
  deactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deactivateUseCase.execute(params.id, user.sub);
  }

  @Patch(':id/reactivate')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Reactivate a previously deactivated supplier' })
  reactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.reactivateUseCase.execute(params.id, user.sub);
  }
}
