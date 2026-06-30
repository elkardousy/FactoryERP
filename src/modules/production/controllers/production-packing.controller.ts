import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
  AddAssemblyDto,
  CreatePackingOrderDto,
  PackingHistoryFilterDto,
  PackingOrderFilterDto,
  PackingOrderResponseDto,
  PackingSummaryDto,
  PackingSummaryFilterDto,
  PaginatedPackingHistoryDto,
  VerifyPackingDto,
} from '../dto/production-packing.dto';

import { CreatePackingOrderUseCase } from '../use-cases/create-packing-order/create-packing-order.use-case';
import { AddAssemblyUseCase } from '../use-cases/add-assembly/add-assembly.use-case';
import { VerifyPackingUseCase } from '../use-cases/verify-packing/verify-packing.use-case';
import { PostPackingOrderUseCase } from '../use-cases/post-packing-order/post-packing-order.use-case';
import { GetPackingOrderUseCase } from '../use-cases/get-packing-order/get-packing-order.use-case';
import { ListPackingOrdersUseCase } from '../use-cases/list-packing-orders/list-packing-orders.use-case';
import { GetPackingHistoryUseCase } from '../use-cases/get-packing-history/get-packing-history.use-case';
import { GetPackingSummaryUseCase } from '../use-cases/get-packing-summary/get-packing-summary.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Production — Packing')
@Controller({ path: 'production', version: '1' })
export class ProductionPackingController {
  constructor(
    private readonly createPackingOrderUseCase: CreatePackingOrderUseCase,
    private readonly addAssemblyUseCase: AddAssemblyUseCase,
    private readonly verifyPackingUseCase: VerifyPackingUseCase,
    private readonly postPackingOrderUseCase: PostPackingOrderUseCase,
    private readonly getPackingOrderUseCase: GetPackingOrderUseCase,
    private readonly listPackingOrdersUseCase: ListPackingOrdersUseCase,
    private readonly getPackingHistoryUseCase: GetPackingHistoryUseCase,
    private readonly getPackingSummaryUseCase: GetPackingSummaryUseCase,
  ) {}

  // ── Commands ────────────────────────────────────────────────────────────────

  @Post('packing')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary: 'Create a packing order for a completed production order',
  })
  @ApiResponse({
    status: 201,
    description: 'Packing order created',
    type: PackingOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or BR violation' })
  @ApiResponse({ status: 404, description: 'Production order not found' })
  @ApiResponse({
    status: 409,
    description: 'Packing order already exists for this production order',
  })
  createPackingOrder(
    @Body() dto: CreatePackingOrderDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    return this.createPackingOrderUseCase.execute(dto, actor);
  }

  @Post('packing/:id/assemblies')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Add a dozen assembly to a packing order' })
  @ApiParam({ name: 'id', description: 'Packing order ID' })
  @ApiResponse({
    status: 201,
    description: 'Assembly added',
    type: PackingOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error, insufficient QO, or invalid status',
  })
  @ApiResponse({ status: 404, description: 'Packing order not found' })
  @ApiResponse({ status: 409, description: 'Version conflict on QO box' })
  addAssembly(
    @Param('id') id: string,
    @Body() dto: AddAssemblyDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    return this.addAssemblyUseCase.execute(id, dto, actor);
  }

  @Patch('packing/:id/verify')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary: 'Verify a packing order (combined submit+approve, ED-P08-003)',
  })
  @ApiParam({ name: 'id', description: 'Packing order ID' })
  @ApiResponse({
    status: 200,
    description: 'Packing order verified',
    type: PackingOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for verification' })
  @ApiResponse({ status: 404, description: 'Packing order not found' })
  verifyPacking(
    @Param('id') id: string,
    @Body() dto: VerifyPackingDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    return this.verifyPackingUseCase.execute(id, dto, actor);
  }

  @Patch('packing/:id/post')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary:
      'Post a verified packing order (creates PACKING inventory transaction)',
  })
  @ApiParam({ name: 'id', description: 'Packing order ID' })
  @ApiResponse({
    status: 200,
    description: 'Packing order posted',
    type: PackingOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Not verified or variance not accepted (BR-P05)',
  })
  @ApiResponse({ status: 404, description: 'Packing order not found' })
  postPackingOrder(
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<PackingOrderResponseDto> {
    return this.postPackingOrderUseCase.execute(id, actor);
  }

  // ── Queries — declared before /:id to avoid route shadowing ─────────────────

  @Get('packing/summary')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({ summary: 'Get packing summary for a production order' })
  @ApiQuery({ name: 'production_order_id', required: true })
  @ApiResponse({
    status: 200,
    description: 'Packing summary',
    type: PackingSummaryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No packing order for this production order',
  })
  getPackingSummary(
    @Query() filter: PackingSummaryFilterDto,
  ): Promise<PackingSummaryDto> {
    return this.getPackingSummaryUseCase.execute(filter);
  }

  @Get('packing/history')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({ summary: 'Get paginated packing order history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated packing history',
    type: PaginatedPackingHistoryDto,
  })
  getPackingHistory(
    @Query() filter: PackingHistoryFilterDto,
  ): Promise<PaginatedPackingHistoryDto> {
    return this.getPackingHistoryUseCase.execute(filter);
  }

  @Get('packing')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({
    summary:
      'List packing orders, optionally filtered by production_order_id or status',
  })
  @ApiQuery({ name: 'production_order_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({
    status: 200,
    description: 'Packing orders',
    type: [PackingOrderResponseDto],
  })
  listPackingOrders(
    @Query() filter: PackingOrderFilterDto,
  ): Promise<PackingOrderResponseDto[]> {
    return this.listPackingOrdersUseCase.execute(filter);
  }

  @Get('packing/:id')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  @ApiOperation({ summary: 'Get a single packing order by ID' })
  @ApiParam({ name: 'id', description: 'Packing order ID' })
  @ApiResponse({
    status: 200,
    description: 'Packing order',
    type: PackingOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Packing order not found' })
  getPackingOrder(@Param('id') id: string): Promise<PackingOrderResponseDto> {
    return this.getPackingOrderUseCase.execute(id);
  }
}
