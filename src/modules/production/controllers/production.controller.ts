import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';
import type { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

import {
  CreateProductionOrderDto,
  UpdateProductionOrderDto,
  ProductionOrderFilterDto,
  ProductionOrderResponseDto,
  ProductionOrderSummaryDto,
} from '../dto/production-order.dto';

import { CreateProductionOrderUseCase } from '../use-cases/create-production-order/create-production-order.use-case';
import { UpdateProductionOrderUseCase } from '../use-cases/update-production-order/update-production-order.use-case';
import { PlanProductionOrderUseCase } from '../use-cases/plan-production-order/plan-production-order.use-case';
import { StartProductionOrderUseCase } from '../use-cases/start-production-order/start-production-order.use-case';
import { CompleteProductionOrderUseCase } from '../use-cases/complete-production-order/complete-production-order.use-case';
import { CloseProductionOrderUseCase } from '../use-cases/close-production-order/close-production-order.use-case';
import { GetProductionOrderUseCase } from '../use-cases/get-production-order/get-production-order.use-case';
import { ListProductionOrdersUseCase } from '../use-cases/list-production-orders/list-production-orders.use-case';

@ApiBearerAuth('JWT')
@ApiTags('Production Orders')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'production/orders', version: '1' })
export class ProductionController {
  constructor(
    private readonly createUseCase: CreateProductionOrderUseCase,
    private readonly updateUseCase: UpdateProductionOrderUseCase,
    private readonly planUseCase: PlanProductionOrderUseCase,
    private readonly startUseCase: StartProductionOrderUseCase,
    private readonly completeUseCase: CompleteProductionOrderUseCase,
    private readonly closeUseCase: CloseProductionOrderUseCase,
    private readonly getUseCase: GetProductionOrderUseCase,
    private readonly listUseCase: ListProductionOrdersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Create a production order in DRAFT status' })
  @ApiResponse({
    status: 201,
    description: 'Production order created',
    type: ProductionOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid part IDs',
  })
  @ApiResponse({ status: 404, description: 'Model, line, or parts not found' })
  create(
    @Body() dto: CreateProductionOrderDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    return this.createUseCase.execute(dto, actor);
  }

  @Get()
  @ApiOperation({ summary: 'List production orders (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated production order list' })
  list(
    @Query() filter: ProductionOrderFilterDto,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResult<ProductionOrderSummaryDto>> {
    return this.listUseCase.execute(filter, pagination.page, pagination.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single production order with parts' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Production order detail',
    type: ProductionOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  getOne(@Param('id') id: string): Promise<ProductionOrderResponseDto> {
    return this.getUseCase.execute(id);
  }

  @Patch(':id')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Update production order notes or target_dozens (DRAFT only)',
  })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Updated production order',
    type: ProductionOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Order is not in DRAFT status' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductionOrderDto,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    return this.updateUseCase.execute(id, dto, actor);
  }

  @Patch(':id/plan')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({ summary: 'Transition production order DRAFT → PLANNED' })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order planned',
    type: ProductionOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Wrong status or no parts configured',
  })
  plan(
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    return this.planUseCase.execute(id, actor);
  }

  @Patch(':id/start')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary:
      'Transition production order PLANNED → IN_PRODUCTION; initializes stage logs',
  })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Production started',
    type: ProductionOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Wrong status or parts not fully released',
  })
  start(
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    return this.startUseCase.execute(id, actor);
  }

  @Patch(':id/complete')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  @ApiOperation({
    summary: 'Transition production order IN_PRODUCTION → PRODUCTION_COMPLETE',
  })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Production completed',
    type: ProductionOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Wrong status or stages not all COMPLETE',
  })
  complete(
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    return this.completeUseCase.execute(id, actor);
  }

  @Patch(':id/close')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  @ApiOperation({
    summary: 'Transition production order PRODUCTION_COMPLETE → CLOSED',
  })
  @ApiParam({ name: 'id', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Production order closed',
    type: ProductionOrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Wrong status or packing not POSTED',
  })
  close(
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ): Promise<ProductionOrderResponseDto> {
    return this.closeUseCase.execute(id, actor);
  }
}
