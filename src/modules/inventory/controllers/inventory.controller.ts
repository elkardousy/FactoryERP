import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
    private readonly getBagAvailabilityUseCase: GetBagAvailabilityUseCase,
    private readonly getWarehouseAvailabilityUseCase: GetWarehouseAvailabilityUseCase,
    private readonly getModelAvailabilityUseCase: GetModelAvailabilityUseCase,
    private readonly getWarehouseBalanceSummaryUseCase: GetWarehouseBalanceSummaryUseCase,
    private readonly getModelBalanceSummaryUseCase: GetModelBalanceSummaryUseCase,
    private readonly getBalanceSnapshotUseCase: GetBalanceSnapshotUseCase,
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
    summary: 'Adjust inventory quantity in a warehouse (positive or negative)',
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
