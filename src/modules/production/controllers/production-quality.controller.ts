import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import type { JwtPayload } from '../../auth/use-cases/login';

import {
  RecordQualityOutputDto,
  QualityFilterDto,
  QualityHistoryFilterDto,
  QualitySummaryFilterDto,
  QualityBoxResponseDto,
  QualitySummaryDto,
  PaginatedQualityHistoryDto,
} from '../dto/production-quality.dto';

import { RecordQualityOutputUseCase } from '../use-cases/record-quality-output/record-quality-output.use-case';
import { GetQualityBoxUseCase } from '../use-cases/get-quality-box/get-quality-box.use-case';
import { ListQualityBoxesUseCase } from '../use-cases/list-quality-boxes/list-quality-boxes.use-case';
import { GetQualitySummaryUseCase } from '../use-cases/get-quality-summary/get-quality-summary.use-case';
import { GetQualityHistoryUseCase } from '../use-cases/get-quality-history/get-quality-history.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Quality Output')
@Controller({ path: 'production', version: '1' })
export class ProductionQualityController {
  constructor(
    private readonly recordQualityUseCase: RecordQualityOutputUseCase,
    private readonly getQualityBoxUseCase: GetQualityBoxUseCase,
    private readonly listQualityBoxesUseCase: ListQualityBoxesUseCase,
    private readonly getQualitySummaryUseCase: GetQualitySummaryUseCase,
    private readonly getQualityHistoryUseCase: GetQualityHistoryUseCase,
  ) {}

  @Post('quality')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary: 'Record quality output (passed dozens) for an order color/size',
  })
  @ApiResponse({
    status: 201,
    description: 'Quality box updated',
    type: QualityBoxResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or BR-Q03 exceeded',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  recordQualityOutput(
    @Body() dto: RecordQualityOutputDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<QualityBoxResponseDto> {
    return this.recordQualityUseCase.execute(dto, actor);
  }

  @Get('quality')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({
    summary:
      'List quality output boxes, optionally filtered by order/color/size',
  })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'color_id', required: false })
  @ApiQuery({ name: 'size_id', required: false })
  @ApiResponse({
    status: 200,
    description: 'Quality output boxes',
    type: [QualityBoxResponseDto],
  })
  listQualityBoxes(
    @Query() filter: QualityFilterDto,
  ): Promise<QualityBoxResponseDto[]> {
    return this.listQualityBoxesUseCase.execute(filter);
  }

  @Get('quality/summary')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({ summary: 'Get quality output summary for an order' })
  @ApiQuery({ name: 'order_id', required: true })
  @ApiResponse({
    status: 200,
    description: 'Quality summary',
    type: QualitySummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getQualitySummary(
    @Query() filter: QualitySummaryFilterDto,
  ): Promise<QualitySummaryDto> {
    return this.getQualitySummaryUseCase.execute(filter);
  }

  @Get('quality/history')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({
    summary:
      'QO transaction history (QUALITY_OUTPUT transactions) for a production order',
  })
  @ApiQuery({ name: 'order_id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated QO history',
    type: PaginatedQualityHistoryDto,
  })
  getQualityHistory(
    @Query() filter: QualityHistoryFilterDto,
  ): Promise<PaginatedQualityHistoryDto> {
    return this.getQualityHistoryUseCase.execute(filter);
  }

  @Get('quality/:id')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({ summary: 'Get a single quality output box by ID' })
  @ApiParam({ name: 'id', description: 'Quality output box ID' })
  @ApiResponse({
    status: 200,
    description: 'Quality output box',
    type: QualityBoxResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Box not found' })
  getQualityBox(@Param('id') id: string): Promise<QualityBoxResponseDto> {
    return this.getQualityBoxUseCase.execute(id);
  }
}
