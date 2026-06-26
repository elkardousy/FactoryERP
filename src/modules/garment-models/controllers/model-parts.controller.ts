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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import { ModelIdParamDto, ModelPartParamDto } from '../dto/model-params.dto';
import { CreateModelPartDto, UpdateModelPartDto } from '../dto/model-part.dto';
import { ManageModelPartUseCase } from '../use-cases/manage-model-part.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Garment Model Parts')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'garment-models', version: '1' })
export class ModelPartsController {
  constructor(private readonly useCase: ManageModelPartUseCase) {}

  @Get(':id/parts')
  @ApiOperation({ summary: 'List parts for a model' })
  list(@Param() params: ModelIdParamDto) {
    return this.useCase.listParts(params.id);
  }

  @Post(':id/parts')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Add a part to a model' })
  add(
    @Param() params: ModelIdParamDto,
    @Body() dto: CreateModelPartDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.useCase.addPart(params.id, dto, user.sub);
  }

  @Patch(':id/parts/:partId')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a model part' })
  update(
    @Param() params: ModelPartParamDto,
    @Body() dto: UpdateModelPartDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.useCase.updatePart(params.id, params.partId, dto, user.sub);
  }

  @Delete(':id/parts/:partId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Remove a part from a model' })
  remove(@Param() params: ModelPartParamDto, @CurrentUser() user: JwtPayload) {
    return this.useCase.removePart(params.id, params.partId, user.sub);
  }
}
