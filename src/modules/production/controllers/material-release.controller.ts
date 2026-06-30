import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/use-cases/login';

import {
  CreateReleaseGroupDto,
  ReleaseGroupResponseDto,
  ReleaseGroupSummaryDto,
} from '../dto/material-release.dto';
import { CreateReleaseGroupUseCase } from '../use-cases/create-release-group/create-release-group.use-case';
import { GetReleaseGroupUseCase } from '../use-cases/get-release-group/get-release-group.use-case';
import { ListReleaseGroupsUseCase } from '../use-cases/list-release-groups/list-release-groups.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Material Releases')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'production', version: '1' })
export class MaterialReleaseController {
  constructor(
    private readonly createUseCase: CreateReleaseGroupUseCase,
    private readonly getUseCase: GetReleaseGroupUseCase,
    private readonly listUseCase: ListReleaseGroupsUseCase,
  ) {}

  @Post('orders/:id/release-groups')
  @HttpCode(HttpStatus.CREATED)
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary: 'Release material bags into production for an order',
  })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 201,
    description: 'Release group created',
    type: ReleaseGroupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation or business rule violation',
  })
  @ApiResponse({ status: 404, description: 'Order or bag not found' })
  @ApiResponse({
    status: 409,
    description: 'CMO line version conflict after retries',
  })
  createReleaseGroup(
    @Param('id') id: string,
    @Body() dto: CreateReleaseGroupDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ReleaseGroupResponseDto> {
    return this.createUseCase.execute(id, dto, actor);
  }

  @Get('orders/:id/release-groups')
  @ApiOperation({ summary: 'List all release groups for a production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Release group summaries',
    type: [ReleaseGroupSummaryDto],
  })
  listReleaseGroups(
    @Param('id') id: string,
  ): Promise<ReleaseGroupSummaryDto[]> {
    return this.listUseCase.execute(id);
  }

  @Get('release-groups/:groupId')
  @ApiOperation({ summary: 'Get a single release group with its lines' })
  @ApiParam({ name: 'groupId', description: 'Release group ID' })
  @ApiResponse({
    status: 200,
    description: 'Release group detail',
    type: ReleaseGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Release group not found' })
  getReleaseGroup(
    @Param('groupId') groupId: string,
  ): Promise<ReleaseGroupResponseDto> {
    return this.getUseCase.execute(groupId);
  }
}
