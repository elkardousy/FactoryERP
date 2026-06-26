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
import { CreateSizeDto, SizeFilterDto, UpdateSizeDto } from '../dto/size.dto';
import { CreateSizeUseCase } from '../use-cases/sizes/create-size.use-case';
import { DeleteSizeUseCase } from '../use-cases/sizes/delete-size.use-case';
import { GetSizeUseCase } from '../use-cases/sizes/get-size.use-case';
import { ListSizesUseCase } from '../use-cases/sizes/list-sizes.use-case';
import { UpdateSizeUseCase } from '../use-cases/sizes/update-size.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Measurements / Sizes')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'measurements/sizes', version: '1' })
export class SizesController {
  constructor(
    private readonly createUseCase: CreateSizeUseCase,
    private readonly getUseCase: GetSizeUseCase,
    private readonly updateUseCase: UpdateSizeUseCase,
    private readonly listUseCase: ListSizesUseCase,
    private readonly deleteUseCase: DeleteSizeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a new size' })
  create(@Body() dto: CreateSizeDto, @CurrentUser() user: JwtPayload) {
    return this.createUseCase.execute(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List sizes with pagination' })
  list(@Query() filter: SizeFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a size by ID' })
  getOne(@Param() params: IdParamDto) {
    return this.getUseCase.execute(params.id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Update a size' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateSizeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateUseCase.execute(params.id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Delete a size (hard delete — blocked if referenced)',
  })
  delete(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.deleteUseCase.execute(params.id, user.sub);
  }
}
