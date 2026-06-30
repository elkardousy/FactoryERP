import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
  RecordStageOutputDto,
  StageLogDetailDto,
  StageLogSummaryDto,
} from '../dto/production-stage.dto';
import { StartStageUseCase } from '../use-cases/start-stage/start-stage.use-case';
import { RecordStageOutputUseCase } from '../use-cases/record-stage-output/record-stage-output.use-case';
import { GetStageLogUseCase } from '../use-cases/get-stage-log/get-stage-log.use-case';
import { ListStageLogsUseCase } from '../use-cases/list-stage-logs/list-stage-logs.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Production Stages')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'production', version: '1' })
export class ProductionStagesController {
  constructor(
    private readonly startStageUseCase: StartStageUseCase,
    private readonly recordOutputUseCase: RecordStageOutputUseCase,
    private readonly getStageLogUseCase: GetStageLogUseCase,
    private readonly listStageLogsUseCase: ListStageLogsUseCase,
  ) {}

  @Get('orders/:id/stages')
  @ApiOperation({ summary: 'List all stage logs for a production order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Stage log summaries ordered by sequence',
    type: [StageLogSummaryDto],
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  listStageLogs(@Param('id') id: string): Promise<StageLogSummaryDto[]> {
    return this.listStageLogsUseCase.execute(id);
  }

  @Get('orders/:id/stages/:stageId')
  @ApiOperation({
    summary: 'Get a single stage log with scrap and incomplete records',
  })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiParam({ name: 'stageId', description: 'Production stage ID' })
  @ApiResponse({
    status: 200,
    description: 'Stage log detail',
    type: StageLogDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Order or stage log not found' })
  getStageLog(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
  ): Promise<StageLogDetailDto> {
    return this.getStageLogUseCase.execute(id, stageId);
  }

  @Patch('orders/:id/stages/:stageId/start')
  @HttpCode(HttpStatus.OK)
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Start a production stage for an order' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiParam({ name: 'stageId', description: 'Production stage ID' })
  @ApiResponse({
    status: 200,
    description: 'Stage started — returns updated stage log summary',
    type: StageLogSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Order not IN_PRODUCTION, stage not PENDING, or previous stage not COMPLETE',
  })
  @ApiResponse({ status: 404, description: 'Order or stage log not found' })
  startStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<StageLogSummaryDto> {
    return this.startStageUseCase.execute(id, stageId, actor);
  }

  @Post('orders/:id/stages/:stageId/output')
  @HttpCode(HttpStatus.OK)
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Record stage output, completing the stage' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiParam({ name: 'stageId', description: 'Production stage ID' })
  @ApiResponse({
    status: 200,
    description:
      'Stage completed — returns stage log detail with scrap and incomplete records',
    type: StageLogDetailDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Conservation law violated, missing records, or invalid stage state',
  })
  @ApiResponse({ status: 404, description: 'Order or stage log not found' })
  recordStageOutput(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() dto: RecordStageOutputDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<StageLogDetailDto> {
    return this.recordOutputUseCase.execute(id, stageId, dto, actor);
  }
}
