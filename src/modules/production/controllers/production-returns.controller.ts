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
  CreateReturnDto,
  ReturnFilterDto,
  ReturnHistoryFilterDto,
  ReturnSummaryFilterDto,
  ReturnResponseDto,
  ReturnSummaryDto,
  PaginatedReturnHistoryDto,
} from '../dto/production-returns.dto';

import { CreateReturnUseCase } from '../use-cases/create-return/create-return.use-case';
import { GetReturnUseCase } from '../use-cases/get-return/get-return.use-case';
import { ListReturnsUseCase } from '../use-cases/list-returns/list-returns.use-case';
import { GetReturnHistoryUseCase } from '../use-cases/get-return-history/get-return-history.use-case';
import { GetReturnSummaryUseCase } from '../use-cases/get-return-summary/get-return-summary.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Production — Returns')
@Controller({ path: 'production', version: '1' })
export class ProductionReturnsController {
  constructor(
    private readonly createReturnUseCase: CreateReturnUseCase,
    private readonly getReturnUseCase: GetReturnUseCase,
    private readonly listReturnsUseCase: ListReturnsUseCase,
    private readonly getReturnHistoryUseCase: GetReturnHistoryUseCase,
    private readonly getReturnSummaryUseCase: GetReturnSummaryUseCase,
  ) {}

  @Post('returns')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary: 'Return material from a production order to a warehouse',
  })
  @ApiResponse({
    status: 201,
    description: 'Return recorded',
    type: ReturnResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or insufficient WIP',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  createReturn(
    @Body() dto: CreateReturnDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ReturnResponseDto> {
    return this.createReturnUseCase.execute(dto, actor);
  }

  @Get('returns')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({
    summary: 'List return transactions, optionally filtered by order/part',
  })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'part_id', required: false })
  @ApiResponse({
    status: 200,
    description: 'Return transactions',
    type: [ReturnResponseDto],
  })
  listReturns(@Query() filter: ReturnFilterDto): Promise<ReturnResponseDto[]> {
    return this.listReturnsUseCase.execute(filter);
  }

  @Get('returns/summary')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({
    summary: 'Get return summary aggregated by part for a production order',
  })
  @ApiQuery({ name: 'order_id', required: true })
  @ApiResponse({
    status: 200,
    description: 'Return summary',
    type: ReturnSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getReturnSummary(
    @Query() filter: ReturnSummaryFilterDto,
  ): Promise<ReturnSummaryDto> {
    return this.getReturnSummaryUseCase.execute(filter);
  }

  @Get('returns/history')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({
    summary: 'Get paginated return history for a production order',
  })
  @ApiQuery({ name: 'order_id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated return history',
    type: PaginatedReturnHistoryDto,
  })
  getReturnHistory(
    @Query() filter: ReturnHistoryFilterDto,
  ): Promise<PaginatedReturnHistoryDto> {
    return this.getReturnHistoryUseCase.execute(filter);
  }

  @Get('returns/:id')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({ summary: 'Get a single return transaction by ID' })
  @ApiParam({ name: 'id', description: 'Return transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Return transaction',
    type: ReturnResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Return not found' })
  getReturn(@Param('id') id: string): Promise<ReturnResponseDto> {
    return this.getReturnUseCase.execute(id);
  }
}
