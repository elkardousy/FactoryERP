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
import { ModelIdParamDto } from '../dto/model-params.dto';
import {
  CreateModelDto,
  ModelFilterDto,
  UpdateModelDto,
} from '../dto/model.dto';
import { CreateModelUseCase } from '../use-cases/create-model.use-case';
import { GetModelUseCase } from '../use-cases/get-model.use-case';
import { UpdateModelUseCase } from '../use-cases/update-model.use-case';
import { ListModelsUseCase } from '../use-cases/list-models.use-case';
import { DeactivateModelUseCase } from '../use-cases/deactivate-model.use-case';
import { ReactivateModelUseCase } from '../use-cases/reactivate-model.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Garment Models')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'garment-models', version: '1' })
export class ModelsController {
  constructor(
    private readonly createUseCase: CreateModelUseCase,
    private readonly getUseCase: GetModelUseCase,
    private readonly updateUseCase: UpdateModelUseCase,
    private readonly listUseCase: ListModelsUseCase,
    private readonly deactivateUseCase: DeactivateModelUseCase,
    private readonly reactivateUseCase: ReactivateModelUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new garment model' })
  create(@Body() dto: CreateModelDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'List garment models with pagination and filtering',
  })
  list(@Query() filter: ModelFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a garment model with parts, colors, and sizes',
  })
  getOne(@Param() params: ModelIdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a garment model' })
  update(
    @Param() params: ModelIdParamDto,
    @Body() dto: UpdateModelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Deactivate a garment model (soft delete)' })
  deactivate(
    @Param() params: ModelIdParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deactivateUseCase.execute(params.id, user.sub);
  }

  @Patch(':id/reactivate')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Reactivate a previously deactivated garment model',
  })
  reactivate(
    @Param() params: ModelIdParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reactivateUseCase.execute(params.id, user.sub);
  }
}
