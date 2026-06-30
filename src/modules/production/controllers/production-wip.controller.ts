import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';

import {
  WipFilterDto,
  WipHistoryFilterDto,
  ProductionProgressFilterDto,
  WipResponseDto,
  PaginatedWipResponseDto,
  PaginatedWipHistoryDto,
  ProductionProgressDto,
} from '../dto/production-wip.dto';
import { GetWipUseCase } from '../use-cases/get-wip/get-wip.use-case';
import { ListWipUseCase } from '../use-cases/list-wip/list-wip.use-case';
import { GetWipHistoryUseCase } from '../use-cases/get-wip-history/get-wip-history.use-case';
import { GetProductionProgressUseCase } from '../use-cases/get-production-progress/get-production-progress.use-case';

@ApiBearerAuth('JWT')
@ApiTags('WIP Inventory')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'production', version: '1' })
export class ProductionWipController {
  constructor(
    private readonly getWipUseCase: GetWipUseCase,
    private readonly listWipUseCase: ListWipUseCase,
    private readonly getWipHistoryUseCase: GetWipHistoryUseCase,
    private readonly getProgressUseCase: GetProductionProgressUseCase,
  ) {}

  @Get('wip')
  @ApiOperation({
    summary:
      'List WIP inventory positions, optionally filtered by order or line',
  })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'line_id', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated WIP positions',
    type: PaginatedWipResponseDto,
  })
  listWip(@Query() filter: WipFilterDto): Promise<PaginatedWipResponseDto> {
    return this.listWipUseCase.execute(filter);
  }

  @Get('wip/history')
  @ApiOperation({
    summary:
      'WIP transaction history (WIP_CONSUMPTION transactions) for a production order',
  })
  @ApiQuery({ name: 'order_id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated WIP transaction history',
    type: PaginatedWipHistoryDto,
  })
  getWipHistory(
    @Query() filter: WipHistoryFilterDto,
  ): Promise<PaginatedWipHistoryDto> {
    return this.getWipHistoryUseCase.execute(filter);
  }

  @Get('wip/:id')
  @ApiOperation({ summary: 'Get a single WIP inventory entry by ID' })
  @ApiParam({ name: 'id', description: 'WIP entry ID' })
  @ApiResponse({
    status: 200,
    description: 'WIP entry detail',
    type: WipResponseDto,
  })
  @ApiResponse({ status: 404, description: 'WIP entry not found' })
  getWip(@Param('id') id: string): Promise<WipResponseDto> {
    return this.getWipUseCase.execute(id);
  }

  @Get('progress')
  @ApiOperation({
    summary:
      'Get production progress for an order (stage completion + WIP balances)',
  })
  @ApiQuery({ name: 'order_id', required: true })
  @ApiResponse({
    status: 200,
    description: 'Production progress snapshot',
    type: ProductionProgressDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getProductionProgress(
    @Query() filter: ProductionProgressFilterDto,
  ): Promise<ProductionProgressDto> {
    return this.getProgressUseCase.execute(filter);
  }
}
