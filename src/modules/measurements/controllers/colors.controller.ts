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
  ColorFilterDto,
  CreateColorDto,
  UpdateColorDto,
} from '../dto/color.dto';
import { CreateColorUseCase } from '../use-cases/colors/create-color.use-case';
import { DeleteColorUseCase } from '../use-cases/colors/delete-color.use-case';
import { GetColorUseCase } from '../use-cases/colors/get-color.use-case';
import { ListColorsUseCase } from '../use-cases/colors/list-colors.use-case';
import { UpdateColorUseCase } from '../use-cases/colors/update-color.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Measurements / Colors')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'measurements/colors', version: '1' })
export class ColorsController {
  constructor(
    private readonly createUseCase: CreateColorUseCase,
    private readonly getUseCase: GetColorUseCase,
    private readonly updateUseCase: UpdateColorUseCase,
    private readonly listUseCase: ListColorsUseCase,
    private readonly deleteUseCase: DeleteColorUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new color' })
  create(@Body() dto: CreateColorDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List colors with pagination' })
  list(@Query() filter: ColorFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a color by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a color' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateColorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Delete a color (hard delete — blocked if referenced)',
  })
  delete(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deleteUseCase.execute(params.id, user.sub);
  }
}
