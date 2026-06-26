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
  CreateCustomerDto,
  CustomerFilterDto,
  UpdateCustomerDto,
} from '../dto/customer.dto';
import { CreateCustomerUseCase } from '../use-cases/create-customer.use-case';
import { DeactivateCustomerUseCase } from '../use-cases/deactivate-customer.use-case';
import { ReactivateCustomerUseCase } from '../use-cases/reactivate-customer.use-case';
import { GetCustomerUseCase } from '../use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '../use-cases/list-customers.use-case';
import { UpdateCustomerUseCase } from '../use-cases/update-customer.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Customers')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(
    private readonly createUseCase: CreateCustomerUseCase,
    private readonly getUseCase: GetCustomerUseCase,
    private readonly updateUseCase: UpdateCustomerUseCase,
    private readonly listUseCase: ListCustomersUseCase,
    private readonly deactivateUseCase: DeactivateCustomerUseCase,
    private readonly reactivateUseCase: ReactivateCustomerUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new customer' })
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List customers with pagination and filtering' })
  list(@Query() filter: CustomerFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a customer' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Deactivate a customer (soft delete)' })
  deactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deactivateUseCase.execute(params.id, user.sub);
  }

  @Patch(':id/reactivate')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Reactivate a previously deactivated customer' })
  reactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.reactivateUseCase.execute(params.id, user.sub);
  }
}
