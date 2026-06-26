import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/use-cases/login/contracts/jwt-payload.interface';
import {
  ModelIdParamDto,
  ModelColorParamDto,
  ModelSizeParamDto,
} from '../dto/model-params.dto';
import {
  AssignModelColorDto,
  AssignModelSizeDto,
} from '../dto/model-color.dto';
import { ManageModelColorSizeUseCase } from '../use-cases/manage-model-color-size.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Garment Model Colors & Sizes')
@Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
@Controller({ path: 'garment-models', version: '1' })
export class ModelColorsSizesController {
  constructor(private readonly useCase: ManageModelColorSizeUseCase) {}

  @Post(':id/colors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a color to a model' })
  assignColor(
    @Param() params: ModelIdParamDto,
    @Body() dto: AssignModelColorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.useCase.assignColor(params.id, dto.color_id, user.sub);
  }

  @Delete(':id/colors/:colorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a color from a model' })
  removeColor(
    @Param() params: ModelColorParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.useCase.removeColor(params.id, params.colorId, user.sub);
  }

  @Post(':id/sizes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a size to a model' })
  assignSize(
    @Param() params: ModelIdParamDto,
    @Body() dto: AssignModelSizeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.useCase.assignSize(params.id, dto.size_id, user.sub);
  }

  @Delete(':id/sizes/:sizeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a size from a model' })
  removeSize(
    @Param() params: ModelSizeParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.useCase.removeSize(params.id, params.sizeId, user.sub);
  }
}
