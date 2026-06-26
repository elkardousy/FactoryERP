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
  CreateProductionLineDto,
  ProductionLineFilterDto,
  UpdateProductionLineDto,
} from '../dto/production-line.dto';
import { CreateProductionLineUseCase } from '../use-cases/production-lines/create-production-line.use-case';
import { DeactivateProductionLineUseCase } from '../use-cases/production-lines/deactivate-production-line.use-case';
import { ReactivateProductionLineUseCase } from '../use-cases/production-lines/reactivate-production-line.use-case';
import { GetProductionLineUseCase } from '../use-cases/production-lines/get-production-line.use-case';
import { ListProductionLinesUseCase } from '../use-cases/production-lines/list-production-lines.use-case';
import { UpdateProductionLineUseCase } from '../use-cases/production-lines/update-production-line.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Production Setup / Lines')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'production-setup/lines', version: '1' })
export class ProductionLinesController {
  constructor(
    private readonly createUseCase: CreateProductionLineUseCase,
    private readonly getUseCase: GetProductionLineUseCase,
    private readonly updateUseCase: UpdateProductionLineUseCase,
    private readonly listUseCase: ListProductionLinesUseCase,
    private readonly deactivateUseCase: DeactivateProductionLineUseCase,
    private readonly reactivateUseCase: ReactivateProductionLineUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new production line' })
  create(
    @Body() dto: CreateProductionLineDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List production lines with pagination' })
  list(@Query() filter: ProductionLineFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a production line by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a production line' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateProductionLineDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Deactivate a production line (soft delete)' })
  deactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deactivateUseCase.execute(params.id, user.sub);
  }

  @Patch(':id/reactivate')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Reactivate a previously deactivated production line',
  })
  reactivate(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.reactivateUseCase.execute(params.id, user.sub);
  }
}
