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
  CreateProductionStageDto,
  ProductionStageFilterDto,
  UpdateProductionStageDto,
} from '../dto/production-stage.dto';
import { CreateProductionStageUseCase } from '../use-cases/production-stages/create-production-stage.use-case';
import { DeleteProductionStageUseCase } from '../use-cases/production-stages/delete-production-stage.use-case';
import { GetProductionStageUseCase } from '../use-cases/production-stages/get-production-stage.use-case';
import { ListProductionStagesUseCase } from '../use-cases/production-stages/list-production-stages.use-case';
import { UpdateProductionStageUseCase } from '../use-cases/production-stages/update-production-stage.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Production Setup / Stages')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'production-setup/stages', version: '1' })
export class ProductionStagesController {
  constructor(
    private readonly createUseCase: CreateProductionStageUseCase,
    private readonly getUseCase: GetProductionStageUseCase,
    private readonly updateUseCase: UpdateProductionStageUseCase,
    private readonly listUseCase: ListProductionStagesUseCase,
    private readonly deleteUseCase: DeleteProductionStageUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new production stage' })
  create(
    @Body() dto: CreateProductionStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List production stages ordered by sequence' })
  list(@Query() filter: ProductionStageFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a production stage by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a production stage' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateProductionStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Delete a production stage (hard delete — blocked if referenced)',
  })
  delete(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deleteUseCase.execute(params.id, user.sub);
  }
}
