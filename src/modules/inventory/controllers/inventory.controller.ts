import {
  BadRequestException,
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

import { TransactionRequestDto } from '../dto/transaction-request.dto';
import { TransactionFilterDto } from '../dto/transaction-filter.dto';
import { ReservationRequestDto } from '../dto/reservation-request.dto';
import { ReservationFilterDto } from '../dto/reservation-filter.dto';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

import { TransferBagToWarehouseUseCase } from '../use-cases/transfer-bag-to-warehouse/transfer-bag-to-warehouse.use-case';
import { AssignBagToOrderUseCase } from '../use-cases/assign-bag-to-order/assign-bag-to-order.use-case';
import { ReturnBagFromOrderUseCase } from '../use-cases/return-bag-from-order/return-bag-from-order.use-case';
import { TransferToWarehouseDto } from '../dto/transfer-to-warehouse.dto';
import { AssignToOrderDto } from '../dto/assign-to-order.dto';
import { ReturnFromOrderDto } from '../dto/return-from-order.dto';
import { TransferBagToWarehouseCommand } from '../use-cases/transfer-bag-to-warehouse/commands/transfer-bag-to-warehouse.command';
import { AssignBagToOrderCommand } from '../use-cases/assign-bag-to-order/commands/assign-bag-to-order.command';
import { ReturnBagFromOrderCommand } from '../use-cases/return-bag-from-order/commands/return-bag-from-order.command';
import { TransactionHistoryDto } from '../dto/transaction-history.dto';

import { GetBagAvailabilityUseCase } from '../use-cases/get-bag-availability/get-bag-availability.use-case';
import { GetWarehouseAvailabilityUseCase } from '../use-cases/get-warehouse-availability/get-warehouse-availability.use-case';
import { GetModelAvailabilityUseCase } from '../use-cases/get-model-availability/get-model-availability.use-case';
import { GetBagAvailabilityQuery } from '../use-cases/get-bag-availability/queries/get-bag-availability.query';
import { GetWarehouseAvailabilityQuery } from '../use-cases/get-warehouse-availability/queries/get-warehouse-availability.query';
import { GetModelAvailabilityQuery } from '../use-cases/get-model-availability/queries/get-model-availability.query';
import { BagAvailabilityDto } from '../dto/bag-availability.dto';
import { LedgerAvailabilityDto } from '../dto/ledger-availability.dto';

import { GetWarehouseBalanceSummaryUseCase } from '../use-cases/get-warehouse-balance-summary/get-warehouse-balance-summary.use-case';
import { GetModelBalanceSummaryUseCase } from '../use-cases/get-model-balance-summary/get-model-balance-summary.use-case';
import { GetBalanceSnapshotUseCase } from '../use-cases/get-balance-snapshot/get-balance-snapshot.use-case';
import { GetWarehouseBalanceSummaryQuery } from '../use-cases/get-warehouse-balance-summary/queries/get-warehouse-balance-summary.query';
import { GetModelBalanceSummaryQuery } from '../use-cases/get-model-balance-summary/queries/get-model-balance-summary.query';
import { GetBalanceSnapshotQuery } from '../use-cases/get-balance-snapshot/queries/get-balance-snapshot.query';
import { WarehouseBalanceSummaryDto } from '../dto/warehouse-balance-summary.dto';
import { ModelBalanceSummaryDto } from '../dto/model-balance-summary.dto';
import {
  BalanceSnapshotDto,
  BalanceSnapshotQueryDto,
} from '../dto/balance-snapshot.dto';

import { ApplyInventoryAdjustmentUseCase } from '../use-cases/apply-inventory-adjustment/apply-inventory-adjustment.use-case';
import { ApplyAdjustmentDto } from '../dto/apply-adjustment.dto';
import { ApplyInventoryAdjustmentCommand } from '../use-cases/apply-inventory-adjustment/commands/apply-inventory-adjustment.command';

import { GetOrderInventoryContextUseCase } from '../use-cases/get-order-inventory-context/get-order-inventory-context.use-case';
import { ListWipPositionsUseCase } from '../use-cases/list-wip-positions/list-wip-positions.use-case';
import {
  OrderInventoryContextDto,
  WipPositionDto,
  WipPositionsQueryDto,
} from '../dto/inventory-integration.dto';

import { GetTransactionVolumeReportUseCase } from '../use-cases/get-transaction-volume-report/get-transaction-volume-report.use-case';
import { GetStockPositionReportUseCase } from '../use-cases/get-stock-position-report/get-stock-position-report.use-case';
import { GetVarianceReportUseCase } from '../use-cases/get-variance-report/get-variance-report.use-case';
import {
  TransactionVolumeQueryDto,
  StockPositionQueryDto,
  VarianceReportQueryDto,
  TransactionVolumeReportDto,
  StockPositionReportDto,
  VarianceSummaryReportDto,
} from '../dto/inventory-report.dto';

import { GetInventoryPerformanceSummaryUseCase } from '../use-cases/get-inventory-performance-summary/get-inventory-performance-summary.use-case';
import { GetBagStatusDistributionUseCase } from '../use-cases/get-bag-status-distribution/get-bag-status-distribution.use-case';
import {
  InventoryPerformanceSummaryDto,
  BagStatusDistributionDto,
} from '../dto/inventory-performance.dto';

import { OpenCycleCountUseCase } from '../use-cases/open-cycle-count/open-cycle-count.use-case';
import { ListCycleCountsUseCase } from '../use-cases/list-cycle-counts/list-cycle-counts.use-case';
import { GetCycleCountUseCase } from '../use-cases/get-cycle-count/get-cycle-count.use-case';
import { AddCycleCountActionUseCase } from '../use-cases/add-cycle-count-action/add-cycle-count-action.use-case';
import { CloseCycleCountUseCase } from '../use-cases/close-cycle-count/close-cycle-count.use-case';
import { OpenCycleCountDto } from '../dto/open-cycle-count.dto';
import { AddCycleCountActionDto } from '../dto/add-cycle-count-action.dto';
import { CloseCycleCountDto } from '../dto/close-cycle-count.dto';
import { CycleCountFilterDto } from '../dto/cycle-count-filter.dto';
import { OpenCycleCountCommand } from '../use-cases/open-cycle-count/commands/open-cycle-count.command';
import { AddCycleCountActionCommand } from '../use-cases/add-cycle-count-action/commands/add-cycle-count-action.command';
import { CloseCycleCountCommand } from '../use-cases/close-cycle-count/commands/close-cycle-count.command';
import { ListCycleCountsQuery } from '../use-cases/list-cycle-counts/queries/list-cycle-counts.query';
import { GetCycleCountQuery } from '../use-cases/get-cycle-count/queries/get-cycle-count.query';

import { CreateInventoryTransactionUseCase } from '../use-cases/create-inventory-transaction/create-inventory-transaction.use-case';
import { ReceiveInventoryUseCase } from '../use-cases/create-inventory-transaction/receive-inventory.use-case';
import { IssueInventoryUseCase } from '../use-cases/create-inventory-transaction/issue-inventory.use-case';
import { TransferInventoryUseCase } from '../use-cases/create-inventory-transaction/transfer-inventory.use-case';
import { AdjustInventoryUseCase } from '../use-cases/create-inventory-transaction/adjust-inventory.use-case';
import { ListInventoryTransactionsUseCase } from '../use-cases/list-inventory-transactions/list-inventory-transactions.use-case';
import { GetInventoryTransactionUseCase } from '../use-cases/get-inventory-transaction/get-inventory-transaction.use-case';
import { GetBagTransactionHistoryUseCase } from '../use-cases/get-bag-transaction-history/get-bag-transaction-history.use-case';
import { CreateReservationUseCase } from '../use-cases/create-reservation/create-reservation.use-case';
import { ReleaseReservationUseCase } from '../use-cases/create-reservation/release-reservation.use-case';
import { CancelReservationUseCase } from '../use-cases/create-reservation/cancel-reservation.use-case';
import { ExpireReservationUseCase } from '../use-cases/create-reservation/expire-reservation.use-case';
import { GetReservationUseCase } from '../use-cases/get-reservation/get-reservation.use-case';
import { ListReservationsUseCase } from '../use-cases/list-reservations/list-reservations.use-case';
import { ListReservationsByBagUseCase } from '../use-cases/list-reservations/list-reservations-by-bag.use-case';
import { ListReservationsByOrderUseCase } from '../use-cases/list-reservations/list-reservations-by-order.use-case';

import { CreateInventoryTransactionCommand } from '../use-cases/create-inventory-transaction/commands/create-inventory-transaction.command';
import { ReceiveInventoryCommand } from '../use-cases/create-inventory-transaction/commands/receive-inventory.command';
import { IssueInventoryCommand } from '../use-cases/create-inventory-transaction/commands/issue-inventory.command';
import { TransferInventoryCommand } from '../use-cases/create-inventory-transaction/commands/transfer-inventory.command';
import { AdjustInventoryCommand } from '../use-cases/create-inventory-transaction/commands/adjust-inventory.command';
import { CreateReservationCommand } from '../use-cases/create-reservation/commands/create-reservation.command';
import { ReleaseReservationCommand } from '../use-cases/create-reservation/commands/release-reservation.command';
import { CancelReservationCommand } from '../use-cases/create-reservation/commands/cancel-reservation.command';
import { ExpireReservationCommand } from '../use-cases/create-reservation/commands/expire-reservation.command';
import { GetTransactionQuery } from '../use-cases/get-inventory-transaction/queries/get-transaction.query';
import { GetTransactionsQuery } from '../use-cases/list-inventory-transactions/queries/get-transactions.query';
import { GetTransactionsByBagQuery } from '../use-cases/get-bag-transaction-history/queries/get-transactions-by-bag.query';
import { GetReservationQuery } from '../use-cases/get-reservation/queries/get-reservation.query';
import { GetReservationsQuery } from '../use-cases/list-reservations/queries/get-reservations.query';
import { GetReservationsByBagQuery } from '../use-cases/list-reservations/queries/get-reservations-by-bag.query';
import { GetReservationsByOrderQuery } from '../use-cases/list-reservations/queries/get-reservations-by-order.query';

@ApiBearerAuth('JWT')
@ApiTags('Inventory')
@Roles(
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
)
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(
    private readonly transferBagToWarehouseUseCase: TransferBagToWarehouseUseCase,
    private readonly assignBagToOrderUseCase: AssignBagToOrderUseCase,
    private readonly returnBagFromOrderUseCase: ReturnBagFromOrderUseCase,
    private readonly getBagAvailabilityUseCase: GetBagAvailabilityUseCase,
    private readonly getWarehouseAvailabilityUseCase: GetWarehouseAvailabilityUseCase,
    private readonly getModelAvailabilityUseCase: GetModelAvailabilityUseCase,
    private readonly getWarehouseBalanceSummaryUseCase: GetWarehouseBalanceSummaryUseCase,
    private readonly getModelBalanceSummaryUseCase: GetModelBalanceSummaryUseCase,
    private readonly getBalanceSnapshotUseCase: GetBalanceSnapshotUseCase,
    private readonly applyInventoryAdjustmentUseCase: ApplyInventoryAdjustmentUseCase,
    private readonly getTransactionVolumeReportUseCase: GetTransactionVolumeReportUseCase,
    private readonly getStockPositionReportUseCase: GetStockPositionReportUseCase,
    private readonly getVarianceReportUseCase: GetVarianceReportUseCase,
    private readonly getInventoryPerformanceSummaryUseCase: GetInventoryPerformanceSummaryUseCase,
    private readonly getBagStatusDistributionUseCase: GetBagStatusDistributionUseCase,
    private readonly openCycleCountUseCase: OpenCycleCountUseCase,
    private readonly listCycleCountsUseCase: ListCycleCountsUseCase,
    private readonly getCycleCountUseCase: GetCycleCountUseCase,
    private readonly addCycleCountActionUseCase: AddCycleCountActionUseCase,
    private readonly closeCycleCountUseCase: CloseCycleCountUseCase,
    private readonly getOrderInventoryContextUseCase: GetOrderInventoryContextUseCase,
    private readonly listWipPositionsUseCase: ListWipPositionsUseCase,
    private readonly createTxnUseCase: CreateInventoryTransactionUseCase,
    private readonly receiveUseCase: ReceiveInventoryUseCase,
    private readonly issueUseCase: IssueInventoryUseCase,
    private readonly transferUseCase: TransferInventoryUseCase,
    private readonly adjustUseCase: AdjustInventoryUseCase,
    private readonly listTxnsUseCase: ListInventoryTransactionsUseCase,
    private readonly getTxnUseCase: GetInventoryTransactionUseCase,
    private readonly bagHistoryUseCase: GetBagTransactionHistoryUseCase,
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly releaseReservationUseCase: ReleaseReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
    private readonly expireReservationUseCase: ExpireReservationUseCase,
    private readonly getReservationUseCase: GetReservationUseCase,
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly listReservationsByBagUseCase: ListReservationsByBagUseCase,
    private readonly listReservationsByOrderUseCase: ListReservationsByOrderUseCase,
  ) {}

  // ─── Physical Bag Movement endpoints ────────────────────────────────────

  @Post('bags/:bagId/transfer-warehouse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer a physical bag to a different warehouse' })
  @ApiParam({ name: 'bagId', description: 'Physical bag ID' })
  @ApiResponse({
    status: 200,
    description: 'Bag transferred',
    type: TransactionHistoryDto,
  })
  @ApiResponse({ status: 404, description: 'Bag or warehouse not found' })
  @ApiResponse({ status: 422, description: 'Bag not in transferable state' })
  async transferBagToWarehouse(
    @Param('bagId') bagId: string,
    @Body() dto: TransferToWarehouseDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionHistoryDto> {
    return this.transferBagToWarehouseUseCase.execute(
      new TransferBagToWarehouseCommand(
        BigInt(bagId),
        BigInt(dto.to_warehouse_id),
        dto.dozens_moved ?? null,
        dto.movement_reason,
        user.sub,
        dto.notes ?? null,
      ),
    );
  }

  @Post('bags/:bagId/assign-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a physical bag to a production order' })
  @ApiParam({ name: 'bagId', description: 'Physical bag ID' })
  @ApiResponse({
    status: 200,
    description: 'Bag assigned to order',
    type: TransactionHistoryDto,
  })
  @ApiResponse({ status: 404, description: 'Bag or order not found' })
  @ApiResponse({ status: 422, description: 'Bag is not AVAILABLE' })
  async assignBagToOrder(
    @Param('bagId') bagId: string,
    @Body() dto: AssignToOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionHistoryDto> {
    return this.assignBagToOrderUseCase.execute(
      new AssignBagToOrderCommand(
        BigInt(bagId),
        BigInt(dto.to_order_id),
        dto.dozens_moved ?? null,
        dto.movement_reason,
        user.sub,
        dto.notes ?? null,
      ),
    );
  }

  @Post('bags/:bagId/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return a physical bag from a production order to a warehouse',
  })
  @ApiParam({ name: 'bagId', description: 'Physical bag ID' })
  @ApiResponse({
    status: 200,
    description: 'Bag returned',
    type: TransactionHistoryDto,
  })
  @ApiResponse({ status: 404, description: 'Bag not found' })
  @ApiResponse({ status: 422, description: 'Bag is not IN_WIP' })
  async returnBagFromOrder(
    @Param('bagId') bagId: string,
    @Body() dto: ReturnFromOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TransactionHistoryDto> {
    return this.returnBagFromOrderUseCase.execute(
      new ReturnBagFromOrderCommand(
        BigInt(bagId),
        BigInt(dto.to_warehouse_id),
        dto.movement_reason,
        user.sub,
        dto.notes ?? null,
      ),
    );
  }

  // ─── Availability endpoints ──────────────────────────────────────────────

  @Get('availability/bags/:bagId')
  @ApiOperation({ summary: 'Get availability for a single physical bag' })
  @ApiParam({ name: 'bagId', description: 'Physical bag ID' })
  @ApiResponse({
    status: 200,
    description: 'Bag availability',
    type: BagAvailabilityDto,
  })
  @ApiResponse({ status: 404, description: 'Bag not found' })
  async getBagAvailability(
    @Param('bagId') bagId: string,
  ): Promise<BagAvailabilityDto> {
    return this.getBagAvailabilityUseCase.execute(
      new GetBagAvailabilityQuery(BigInt(bagId)),
    );
  }

  @Get('availability/warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get on-hand inventory ledger for a warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: 200,
    description: 'Ledger entries for warehouse',
    type: [LedgerAvailabilityDto],
  })
  async getWarehouseAvailability(
    @Param('warehouseId') warehouseId: string,
  ): Promise<LedgerAvailabilityDto[]> {
    return this.getWarehouseAvailabilityUseCase.execute(
      new GetWarehouseAvailabilityQuery(BigInt(warehouseId)),
    );
  }

  @Get('availability/model/:modelId')
  @ApiOperation({
    summary: 'Get on-hand inventory ledger for a model across all warehouses',
  })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({
    status: 200,
    description: 'Ledger entries for model',
    type: [LedgerAvailabilityDto],
  })
  async getModelAvailability(
    @Param('modelId') modelId: string,
  ): Promise<LedgerAvailabilityDto[]> {
    return this.getModelAvailabilityUseCase.execute(
      new GetModelAvailabilityQuery(BigInt(modelId)),
    );
  }

  // ─── Balance endpoints ────────────────────────────────────────────────────

  @Get('balance/warehouse/:warehouseId')
  @ApiOperation({ summary: 'Get aggregated balance summary for a warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: 200,
    description: 'Warehouse balance summary',
    type: WarehouseBalanceSummaryDto,
  })
  async getWarehouseBalanceSummary(
    @Param('warehouseId') warehouseId: string,
  ): Promise<WarehouseBalanceSummaryDto> {
    return this.getWarehouseBalanceSummaryUseCase.execute(
      new GetWarehouseBalanceSummaryQuery(BigInt(warehouseId)),
    );
  }

  @Get('balance/model/:modelId')
  @ApiOperation({
    summary: 'Get aggregated balance summary for a model across all warehouses',
  })
  @ApiParam({ name: 'modelId', description: 'Model ID' })
  @ApiResponse({
    status: 200,
    description: 'Model balance summary',
    type: ModelBalanceSummaryDto,
  })
  async getModelBalanceSummary(
    @Param('modelId') modelId: string,
  ): Promise<ModelBalanceSummaryDto> {
    return this.getModelBalanceSummaryUseCase.execute(
      new GetModelBalanceSummaryQuery(BigInt(modelId)),
    );
  }

  @Get('balance/snapshot')
  @ApiOperation({
    summary:
      'Get current ledger snapshot for a specific warehouse + model + part',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance snapshot',
    type: BalanceSnapshotDto,
  })
  @ApiResponse({ status: 404, description: 'Ledger entry not found' })
  async getBalanceSnapshot(
    @Query() query: BalanceSnapshotQueryDto,
  ): Promise<BalanceSnapshotDto> {
    return this.getBalanceSnapshotUseCase.execute(
      new GetBalanceSnapshotQuery(
        BigInt(query.warehouse_id),
        BigInt(query.model_id),
        BigInt(query.part_id),
      ),
    );
  }

  // ─── Inventory Adjustment endpoints ─────────────────────────────────────

  @Post('adjustments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Apply a typed inventory adjustment — atomically updates ledger and records transaction',
  })
  @ApiResponse({
    status: 201,
    description: 'Adjustment applied and ledger updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid adjustment (zero delta or sign violation)',
  })
  @ApiResponse({
    status: 404,
    description: 'Model, part, or warehouse not found',
  })
  async applyAdjustment(
    @Body() dto: ApplyAdjustmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const cmd = new ApplyInventoryAdjustmentCommand(
      BigInt(dto.warehouse_id),
      BigInt(dto.model_id),
      BigInt(dto.part_id),
      dto.reason,
      dto.dozens_delta,
      dto.txn_reference,
      user.sub,
      dto.notes ?? null,
    );
    return this.applyInventoryAdjustmentUseCase.execute(cmd);
  }

  // ─── Cycle Count endpoints ────────────────────────────────────────────────

  @Post('cycle-counts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Open a cycle count — records physical count result and raises investigation if variance exists',
  })
  @ApiResponse({
    status: 201,
    description: 'Cycle count result with variance assessment',
  })
  async openCycleCount(
    @Body() dto: OpenCycleCountDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const cmd = new OpenCycleCountCommand(
      dto.investigation_number,
      BigInt(dto.warehouse_id),
      BigInt(dto.model_id),
      BigInt(dto.part_id),
      dto.actual_dozens,
      dto.notes ?? null,
      user.sub,
    );
    return this.openCycleCountUseCase.execute(cmd);
  }

  @Get('cycle-counts')
  @ApiOperation({ summary: 'List cycle count investigations' })
  @ApiResponse({
    status: 200,
    description: 'List of cycle count investigations',
  })
  async listCycleCounts(@Query() filter: CycleCountFilterDto) {
    const query = new ListCycleCountsQuery(
      filter.warehouse_id ? BigInt(filter.warehouse_id) : null,
      filter.model_id ? BigInt(filter.model_id) : null,
      filter.closure_status ?? null,
      filter.page ?? 1,
      filter.limit ?? 20,
    );
    return this.listCycleCountsUseCase.execute(query);
  }

  @Get('cycle-counts/:investigationId')
  @ApiOperation({ summary: 'Get a single cycle count investigation' })
  @ApiParam({ name: 'investigationId', description: 'Investigation ID' })
  @ApiResponse({ status: 200, description: 'Cycle count investigation' })
  @ApiResponse({ status: 404, description: 'Investigation not found' })
  async getCycleCount(@Param('investigationId') investigationId: string) {
    return this.getCycleCountUseCase.execute(
      new GetCycleCountQuery(BigInt(investigationId)),
    );
  }

  @Post('cycle-counts/:investigationId/actions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add an action note to a cycle count investigation',
  })
  @ApiParam({ name: 'investigationId', description: 'Investigation ID' })
  @ApiResponse({ status: 201, description: 'Action recorded' })
  @ApiResponse({ status: 422, description: 'Investigation is already closed' })
  async addCycleCountAction(
    @Param('investigationId') investigationId: string,
    @Body() dto: AddCycleCountActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const cmd = new AddCycleCountActionCommand(
      BigInt(investigationId),
      dto.action_note,
      user.sub,
    );
    return this.addCycleCountActionUseCase.execute(cmd);
  }

  @Patch('cycle-counts/:investigationId/close')
  @ApiOperation({ summary: 'Close a cycle count investigation' })
  @ApiParam({ name: 'investigationId', description: 'Investigation ID' })
  @ApiResponse({ status: 200, description: 'Investigation closed' })
  @ApiResponse({ status: 422, description: 'Investigation already closed' })
  async closeCycleCount(
    @Param('investigationId') investigationId: string,
    @Body() dto: CloseCycleCountDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const cmd = new CloseCycleCountCommand(
      BigInt(investigationId),
      dto.root_cause_category,
      dto.corrective_action ?? null,
      dto.preventive_action ?? null,
      user.sub,
    );
    return this.closeCycleCountUseCase.execute(cmd);
  }

  // ─── Inventory Performance endpoints ─────────────────────────────────────

  @Get('performance/summary')
  @ApiOperation({
    summary:
      'Get inventory performance summary — stock health, cycle count metrics, and 30-day transaction activity',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance summary',
    type: InventoryPerformanceSummaryDto,
  })
  async getPerformanceSummary(): Promise<InventoryPerformanceSummaryDto> {
    return this.getInventoryPerformanceSummaryUseCase.execute();
  }

  @Get('performance/bag-status')
  @ApiOperation({ summary: 'Get physical bag count by status' })
  @ApiResponse({
    status: 200,
    description: 'Bag status distribution',
    type: [BagStatusDistributionDto],
  })
  async getBagStatusDistribution(): Promise<BagStatusDistributionDto[]> {
    return this.getBagStatusDistributionUseCase.execute();
  }

  // ─── Inventory Reporting endpoints ───────────────────────────────────────

  @Get('reports/transaction-volume')
  @ApiOperation({
    summary: 'Transaction volume report grouped by type for a date range',
  })
  @ApiResponse({ status: 200, type: TransactionVolumeReportDto })
  async getTransactionVolumeReport(
    @Query() query: TransactionVolumeQueryDto,
  ): Promise<TransactionVolumeReportDto> {
    const fromDate = query.from_date
      ? new Date(query.from_date)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = query.to_date ? new Date(query.to_date) : new Date();
    return this.getTransactionVolumeReportUseCase.execute(fromDate, toDate);
  }

  @Get('reports/stock-position')
  @ApiOperation({
    summary: 'Current stock position report — all inventory_bags records',
  })
  @ApiResponse({ status: 200, type: StockPositionReportDto })
  async getStockPositionReport(
    @Query() query: StockPositionQueryDto,
  ): Promise<StockPositionReportDto> {
    return this.getStockPositionReportUseCase.execute(
      query.warehouse_id ? BigInt(query.warehouse_id) : undefined,
    );
  }

  @Get('reports/variances')
  @ApiOperation({
    summary: 'Variance summary report — all INVENTORY_VARIANCE investigations',
  })
  @ApiResponse({ status: 200, type: VarianceSummaryReportDto })
  async getVarianceReport(
    @Query() query: VarianceReportQueryDto,
  ): Promise<VarianceSummaryReportDto> {
    return this.getVarianceReportUseCase.execute(query.closure_status);
  }

  // ─── Inventory Integration endpoints ─────────────────────────────────────

  @Get('integration/orders/:orderId')
  @ApiOperation({
    summary:
      'Get inventory context for a production order — physical bags and WIP balance',
  })
  @ApiParam({ name: 'orderId', description: 'Production order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order inventory context',
    type: OrderInventoryContextDto,
  })
  async getOrderInventoryContext(
    @Param('orderId') orderId: string,
  ): Promise<OrderInventoryContextDto> {
    return this.getOrderInventoryContextUseCase.execute(BigInt(orderId));
  }

  @Get('integration/wip')
  @ApiOperation({
    summary:
      'List WIP inventory positions — optionally filtered by production order',
  })
  @ApiResponse({
    status: 200,
    description: 'WIP inventory positions',
    type: [WipPositionDto],
  })
  async listWipPositions(
    @Query() query: WipPositionsQueryDto,
  ): Promise<WipPositionDto[]> {
    return this.listWipPositionsUseCase.execute(
      query.order_id ? BigInt(query.order_id) : undefined,
    );
  }

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an inventory transaction (generic)' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createTransaction(
    @Body() dto: TransactionRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!dto.operation) {
      throw new BadRequestException(
        'operation field is required for generic endpoint',
      );
    }
    const cmd = new CreateInventoryTransactionCommand(
      dto.operation,
      dto.txn_reference,
      BigInt(dto.model_id),
      dto.part_id != null ? BigInt(dto.part_id) : null,
      dto.from_warehouse_id != null ? BigInt(dto.from_warehouse_id) : null,
      dto.to_warehouse_id != null ? BigInt(dto.to_warehouse_id) : null,
      dto.to_order_id != null ? BigInt(dto.to_order_id) : null,
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.createTxnUseCase.execute(cmd);
  }

  @Post('transactions/receive')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record inventory receipt into a warehouse' })
  @ApiResponse({ status: 201, description: 'Receipt recorded' })
  async receive(
    @Body() dto: TransactionRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const warehouseId = dto.to_warehouse_id ?? dto.from_warehouse_id;
    if (!warehouseId)
      throw new BadRequestException('to_warehouse_id is required');
    const cmd = new ReceiveInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id),
      dto.part_id != null ? BigInt(dto.part_id) : null,
      BigInt(warehouseId),
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.receiveUseCase.execute(cmd);
  }

  @Post('transactions/issue')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Issue inventory from a warehouse to a production order',
  })
  @ApiResponse({ status: 201, description: 'Issue recorded' })
  async issue(
    @Body() dto: TransactionRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!dto.from_warehouse_id)
      throw new BadRequestException('from_warehouse_id is required');
    if (!dto.to_order_id)
      throw new BadRequestException('to_order_id is required');
    const cmd = new IssueInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id),
      dto.part_id != null ? BigInt(dto.part_id) : null,
      BigInt(dto.from_warehouse_id),
      BigInt(dto.to_order_id),
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.issueUseCase.execute(cmd);
  }

  @Post('transactions/transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Transfer inventory between warehouses (atomic double-entry)',
  })
  @ApiResponse({ status: 201, description: 'Transfer recorded' })
  async transfer(
    @Body() dto: TransactionRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!dto.from_warehouse_id)
      throw new BadRequestException('from_warehouse_id is required');
    if (!dto.to_warehouse_id)
      throw new BadRequestException('to_warehouse_id is required');
    const cmd = new TransferInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id),
      dto.part_id != null ? BigInt(dto.part_id) : null,
      BigInt(dto.from_warehouse_id),
      BigInt(dto.to_warehouse_id),
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.transferUseCase.execute(cmd);
  }

  @Post('transactions/adjust')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    deprecated: true,
    summary:
      '[DEPRECATED] Use POST /v1/inventory/adjustments instead. Adjust inventory quantity in a warehouse (positive or negative)',
  })
  @ApiResponse({ status: 201, description: 'Adjustment recorded' })
  async adjust(
    @Body() dto: TransactionRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const warehouseId = dto.to_warehouse_id ?? dto.from_warehouse_id;
    if (!warehouseId) throw new BadRequestException('warehouse_id is required');
    const cmd = new AdjustInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id),
      dto.part_id != null ? BigInt(dto.part_id) : null,
      BigInt(warehouseId),
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.adjustUseCase.execute(cmd);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List inventory transactions with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions' })
  async listTransactions(@Query() filter: TransactionFilterDto) {
    const query = new GetTransactionsQuery(
      filter.page,
      filter.limit,
      filter.txn_type,
      filter.model_id != null ? BigInt(filter.model_id) : undefined,
      filter.txn_reference,
      filter.from_date,
      filter.to_date,
    );
    return this.listTxnsUseCase.execute(query);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get a single inventory transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(@Param('id') id: string) {
    return this.getTxnUseCase.execute(new GetTransactionQuery(BigInt(id)));
  }

  @Get('bags/:id/history')
  @ApiOperation({ summary: 'Get movement history for a physical bag' })
  @ApiParam({ name: 'id', description: 'Bag ID' })
  @ApiResponse({ status: 200, description: 'Paginated bag movement history' })
  @ApiResponse({ status: 404, description: 'Bag not found' })
  async getBagHistory(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.bagHistoryUseCase.execute(
      new GetTransactionsByBagQuery(
        BigInt(id),
        pagination.page,
        pagination.limit,
      ),
    );
  }

  // ─── Reservation endpoints ───────────────────────────────────────────────

  @Post('reservations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reserve dozens from a physical bag for a production order',
  })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  @ApiResponse({ status: 404, description: 'Bag or order not found' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate reservation for bag+order',
  })
  @ApiResponse({ status: 422, description: 'Insufficient available quantity' })
  async createReservation(
    @Body() dto: ReservationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const cmd = new CreateReservationCommand(
      BigInt(dto.bag_id),
      BigInt(dto.order_id),
      dto.reserved_dozens,
      user.sub,
    );
    return this.createReservationUseCase.execute(cmd);
  }

  @Post('reservations/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release an active reservation' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({ status: 200, description: 'Reservation released' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 422, description: 'Reservation is not ACTIVE' })
  async releaseReservation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.releaseReservationUseCase.execute(
      new ReleaseReservationCommand(BigInt(id), user.sub),
    );
  }

  @Post('reservations/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an active reservation' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 422, description: 'Reservation is not ACTIVE' })
  async cancelReservation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.cancelReservationUseCase.execute(
      new CancelReservationCommand(BigInt(id), user.sub),
    );
  }

  @Post('reservations/:id/expire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually expire an active reservation' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({ status: 200, description: 'Reservation expired' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  @ApiResponse({ status: 422, description: 'Reservation is not ACTIVE' })
  async expireReservation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expireReservationUseCase.execute(
      new ExpireReservationCommand(BigInt(id), user.sub),
    );
  }

  @Get('reservations')
  @ApiOperation({ summary: 'List reservations with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of reservations' })
  async listReservations(@Query() filter: ReservationFilterDto) {
    const query = new GetReservationsQuery(
      filter.page,
      filter.limit,
      filter.status,
      filter.bag_id != null ? BigInt(filter.bag_id) : undefined,
      filter.order_id != null ? BigInt(filter.order_id) : undefined,
    );
    return this.listReservationsUseCase.execute(query);
  }

  @Get('reservations/:id')
  @ApiOperation({ summary: 'Get a single reservation by ID' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({ status: 200, description: 'Reservation found' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async getReservation(@Param('id') id: string) {
    return this.getReservationUseCase.execute(
      new GetReservationQuery(BigInt(id)),
    );
  }

  @Get('bags/:id/reservations')
  @ApiOperation({ summary: 'List all reservations for a physical bag' })
  @ApiParam({ name: 'id', description: 'Bag ID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated reservation history for bag',
  })
  async getBagReservations(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.listReservationsByBagUseCase.execute(
      new GetReservationsByBagQuery(
        BigInt(id),
        pagination.page,
        pagination.limit,
      ),
    );
  }

  @Get('orders/:id/reservations')
  @ApiOperation({ summary: 'List all reservations for a production order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated reservation history for order',
  })
  async getOrderReservations(
    @Param('id') id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.listReservationsByOrderUseCase.execute(
      new GetReservationsByOrderQuery(
        BigInt(id),
        pagination.page,
        pagination.limit,
      ),
    );
  }
}
