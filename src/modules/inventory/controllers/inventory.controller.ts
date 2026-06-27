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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/use-cases/login';

import { TransactionRequestDto } from '../dto/transaction-request.dto';
import { TransactionFilterDto } from '../dto/transaction-filter.dto';
import { PaginationDto } from '../../../common/dto/pagination/pagination.dto';

import { CreateInventoryTransactionUseCase } from '../use-cases/create-inventory-transaction/create-inventory-transaction.use-case';
import { ReceiveInventoryUseCase } from '../use-cases/create-inventory-transaction/receive-inventory.use-case';
import { IssueInventoryUseCase } from '../use-cases/create-inventory-transaction/issue-inventory.use-case';
import { TransferInventoryUseCase } from '../use-cases/create-inventory-transaction/transfer-inventory.use-case';
import { AdjustInventoryUseCase } from '../use-cases/create-inventory-transaction/adjust-inventory.use-case';
import { ListInventoryTransactionsUseCase } from '../use-cases/list-inventory-transactions/list-inventory-transactions.use-case';
import { GetInventoryTransactionUseCase } from '../use-cases/get-inventory-transaction/get-inventory-transaction.use-case';
import { GetBagTransactionHistoryUseCase } from '../use-cases/get-bag-transaction-history/get-bag-transaction-history.use-case';

import { CreateInventoryTransactionCommand } from '../use-cases/create-inventory-transaction/commands/create-inventory-transaction.command';
import { ReceiveInventoryCommand } from '../use-cases/create-inventory-transaction/commands/receive-inventory.command';
import { IssueInventoryCommand } from '../use-cases/create-inventory-transaction/commands/issue-inventory.command';
import { TransferInventoryCommand } from '../use-cases/create-inventory-transaction/commands/transfer-inventory.command';
import { AdjustInventoryCommand } from '../use-cases/create-inventory-transaction/commands/adjust-inventory.command';
import { GetTransactionQuery } from '../use-cases/get-inventory-transaction/queries/get-transaction.query';
import { GetTransactionsQuery } from '../use-cases/list-inventory-transactions/queries/get-transactions.query';
import { GetTransactionsByBagQuery } from '../use-cases/get-bag-transaction-history/queries/get-transactions-by-bag.query';

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
    private readonly createTxnUseCase: CreateInventoryTransactionUseCase,
    private readonly receiveUseCase: ReceiveInventoryUseCase,
    private readonly issueUseCase: IssueInventoryUseCase,
    private readonly transferUseCase: TransferInventoryUseCase,
    private readonly adjustUseCase: AdjustInventoryUseCase,
    private readonly listTxnsUseCase: ListInventoryTransactionsUseCase,
    private readonly getTxnUseCase: GetInventoryTransactionUseCase,
    private readonly bagHistoryUseCase: GetBagTransactionHistoryUseCase,
  ) {}

  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an inventory transaction (generic)' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  async createTransaction(@Body() dto: TransactionRequestDto, @CurrentUser() user: JwtPayload) {
    if (!dto.operation) {
      throw new BadRequestException('operation field is required for generic endpoint');
    }
    const cmd = new CreateInventoryTransactionCommand(
      dto.operation,
      dto.txn_reference,
      BigInt(dto.model_id as unknown as number),
      dto.part_id != null ? BigInt(dto.part_id as unknown as number) : null,
      dto.from_warehouse_id != null ? BigInt(dto.from_warehouse_id as unknown as number) : null,
      dto.to_warehouse_id != null ? BigInt(dto.to_warehouse_id as unknown as number) : null,
      dto.to_order_id != null ? BigInt(dto.to_order_id as unknown as number) : null,
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
  async receive(@Body() dto: TransactionRequestDto, @CurrentUser() user: JwtPayload) {
    const warehouseId = dto.to_warehouse_id ?? dto.from_warehouse_id;
    if (!warehouseId) throw new BadRequestException('to_warehouse_id is required');
    const cmd = new ReceiveInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id as unknown as number),
      dto.part_id != null ? BigInt(dto.part_id as unknown as number) : null,
      BigInt(warehouseId as unknown as number),
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.receiveUseCase.execute(cmd);
  }

  @Post('transactions/issue')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue inventory from a warehouse to a production order' })
  @ApiResponse({ status: 201, description: 'Issue recorded' })
  async issue(@Body() dto: TransactionRequestDto, @CurrentUser() user: JwtPayload) {
    if (!dto.from_warehouse_id) throw new BadRequestException('from_warehouse_id is required');
    if (!dto.to_order_id) throw new BadRequestException('to_order_id is required');
    const cmd = new IssueInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id as unknown as number),
      dto.part_id != null ? BigInt(dto.part_id as unknown as number) : null,
      BigInt(dto.from_warehouse_id as unknown as number),
      BigInt(dto.to_order_id as unknown as number),
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.issueUseCase.execute(cmd);
  }

  @Post('transactions/transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Transfer inventory between warehouses (atomic double-entry)' })
  @ApiResponse({ status: 201, description: 'Transfer recorded' })
  async transfer(@Body() dto: TransactionRequestDto, @CurrentUser() user: JwtPayload) {
    if (!dto.from_warehouse_id) throw new BadRequestException('from_warehouse_id is required');
    if (!dto.to_warehouse_id) throw new BadRequestException('to_warehouse_id is required');
    const cmd = new TransferInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id as unknown as number),
      dto.part_id != null ? BigInt(dto.part_id as unknown as number) : null,
      BigInt(dto.from_warehouse_id as unknown as number),
      BigInt(dto.to_warehouse_id as unknown as number),
      dto.dozens_qty,
      user.sub,
      dto.notes ?? null,
    );
    return this.transferUseCase.execute(cmd);
  }

  @Post('transactions/adjust')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjust inventory quantity in a warehouse (positive or negative)' })
  @ApiResponse({ status: 201, description: 'Adjustment recorded' })
  async adjust(@Body() dto: TransactionRequestDto, @CurrentUser() user: JwtPayload) {
    const warehouseId = dto.to_warehouse_id ?? dto.from_warehouse_id;
    if (!warehouseId) throw new BadRequestException('warehouse_id is required');
    const cmd = new AdjustInventoryCommand(
      dto.txn_reference,
      BigInt(dto.model_id as unknown as number),
      dto.part_id != null ? BigInt(dto.part_id as unknown as number) : null,
      BigInt(warehouseId as unknown as number),
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
      filter.model_id != null ? BigInt(filter.model_id as unknown as number) : undefined,
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
  async getBagHistory(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.bagHistoryUseCase.execute(
      new GetTransactionsByBagQuery(BigInt(id), pagination.page, pagination.limit),
    );
  }
}
