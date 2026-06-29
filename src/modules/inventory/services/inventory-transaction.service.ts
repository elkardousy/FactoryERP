import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { InventoryEventPublisher } from '../events/inventory-event.publisher';
import { GoodsReceivedEvent } from '../events/inventory.events';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { InventoryTransactionsRepository } from '../repositories/inventory-transactions.repository';
import { PhysicalBagsRepository } from '../repositories/physical-bags.repository';
import { InventoryTransactionFactory } from './inventory-transaction.factory';
import { InventoryTransactionMapper } from './inventory-transaction.mapper';
import { InventoryTransactionValidator } from './inventory-transaction.validator';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { TransactionHistoryDto } from '../dto/transaction-history.dto';
import type {
  TransactionResult,
  TransferResult,
} from '../contracts/transaction-result.interface';
import type { ReceiveInventoryCommand } from '../use-cases/create-inventory-transaction/commands/receive-inventory.command';
import type { IssueInventoryCommand } from '../use-cases/create-inventory-transaction/commands/issue-inventory.command';
import type { TransferInventoryCommand } from '../use-cases/create-inventory-transaction/commands/transfer-inventory.command';
import type { AdjustInventoryCommand } from '../use-cases/create-inventory-transaction/commands/adjust-inventory.command';
import type { GetTransactionQuery } from '../use-cases/get-inventory-transaction/queries/get-transaction.query';
import type { GetTransactionsQuery } from '../use-cases/list-inventory-transactions/queries/get-transactions.query';
import type { GetTransactionsByBagQuery } from '../use-cases/get-bag-transaction-history/queries/get-transactions-by-bag.query';
import type { GetTransactionsByWarehouseQuery } from '../use-cases/list-inventory-transactions/queries/get-transactions-by-warehouse.query';
import type { physical_bag_movements } from '@prisma/client';

@Injectable()
export class InventoryTransactionService {
  constructor(
    private readonly txnRepo: InventoryTransactionsRepository,
    private readonly bagsRepo: PhysicalBagsRepository,
    private readonly factory: InventoryTransactionFactory,
    private readonly mapper: InventoryTransactionMapper,
    private readonly validator: InventoryTransactionValidator,
    private readonly logger: LoggerService,
    private readonly eventPublisher: InventoryEventPublisher,
  ) {}

  async receive(cmd: ReceiveInventoryCommand): Promise<TransactionResult> {
    await this.validator.validateReceive(cmd);
    const data = this.factory.fromReceive(cmd);
    const txn = await this.txnRepo.create(data);
    this.logger.info(
      `Inventory received: ref=${cmd.txn_reference}, model=${cmd.model_id}`,
    );
    const receiveResult: TransactionResult = {
      success: true,
      transaction: this.mapper.toResponse(txn),
    };
    this.eventPublisher.emitGoodsReceived(
      new GoodsReceivedEvent(
        txn.txn_id.toString(),
        cmd.txn_reference,
        cmd.model_id.toString(),
        cmd.part_id ? cmd.part_id.toString() : null,
        cmd.warehouse_id.toString(),
        cmd.dozens_qty,
        cmd.executed_by.toString(),
        txn.executed_at,
      ),
    );
    return receiveResult;
  }

  async issue(cmd: IssueInventoryCommand): Promise<TransactionResult> {
    await this.validator.validateIssue(cmd);
    const data = this.factory.fromIssue(cmd);
    const txn = await this.txnRepo.create(data);
    this.logger.info(
      `Inventory issued: ref=${cmd.txn_reference}, model=${cmd.model_id}`,
    );
    return { success: true, transaction: this.mapper.toResponse(txn) };
  }

  async transfer(cmd: TransferInventoryCommand): Promise<TransferResult> {
    await this.validator.validateTransfer(cmd);
    const [outboundData, inboundData] = this.factory.fromTransfer(cmd);

    const [outboundTxn, inboundTxn] = await this.txnRepo.executeInTransaction(
      async (tx) => {
        const out = await this.txnRepo.createInTx(tx, outboundData);
        const inb = await this.txnRepo.createInTx(tx, inboundData);
        return [out, inb] as const;
      },
    );

    this.logger.info(
      `Inventory transferred: ref=${cmd.txn_reference}, from=${cmd.from_warehouse_id} to=${cmd.to_warehouse_id}`,
    );
    return {
      success: true,
      outbound: this.mapper.toResponse(outboundTxn),
      inbound: this.mapper.toResponse(inboundTxn),
    };
  }

  async adjust(cmd: AdjustInventoryCommand): Promise<TransactionResult> {
    await this.validator.validateAdjust(cmd);
    const data = this.factory.fromAdjust(cmd);
    const txn = await this.txnRepo.create(data);
    this.logger.info(
      `Inventory adjusted: ref=${cmd.txn_reference}, model=${cmd.model_id}`,
    );
    return { success: true, transaction: this.mapper.toResponse(txn) };
  }

  async listTransactions(
    query: GetTransactionsQuery,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const result = await this.txnRepo.findAllWithPagination(
      {
        txn_type: query.txn_type,
        model_id: query.model_id,
        txn_reference: query.txn_reference,
        from_date: query.from_date,
        to_date: query.to_date,
      },
      query.page,
      query.limit,
    );
    return {
      items: this.mapper.toResponseList(result.items),
      meta: result.meta,
    };
  }

  async getById(query: GetTransactionQuery): Promise<TransactionResponseDto> {
    const txn = await this.txnRepo.findById(query.txn_id);
    if (!txn)
      throw new NotFoundException(`Transaction ${query.txn_id} not found`);
    return this.mapper.toResponse(txn);
  }

  async getBagHistory(
    query: GetTransactionsByBagQuery,
  ): Promise<PaginatedResult<TransactionHistoryDto>> {
    const bag = await this.bagsRepo.findById(query.bag_id);
    if (!bag) throw new NotFoundException(`Bag ${query.bag_id} not found`);

    const result = await this.bagsRepo.findMovementHistory(
      query.bag_id,
      query.page,
      query.limit,
    );
    return {
      items: result.items.map((m) => this.mapMovement(m)),
      meta: result.meta,
    };
  }

  async listByWarehouse(
    query: GetTransactionsByWarehouseQuery,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const result = await this.txnRepo.findByWarehouseId(
      query.warehouse_id,
      query.page,
      query.limit,
      query.from_date,
      query.to_date,
    );
    return {
      items: this.mapper.toResponseList(result.items),
      meta: result.meta,
    };
  }

  private mapMovement(m: physical_bag_movements): TransactionHistoryDto {
    const dto = new TransactionHistoryDto();
    dto.movement_id = m.movement_id.toString();
    dto.bag_id = m.bag_id.toString();
    dto.from_status = m.from_status ?? null;
    dto.to_status = m.to_status;
    dto.from_warehouse_id = m.from_warehouse_id
      ? m.from_warehouse_id.toString()
      : null;
    dto.to_warehouse_id = m.to_warehouse_id
      ? m.to_warehouse_id.toString()
      : null;
    dto.from_order_id = m.from_order_id ? m.from_order_id.toString() : null;
    dto.to_order_id = m.to_order_id ? m.to_order_id.toString() : null;
    dto.dozens_moved = m.dozens_moved ? m.dozens_moved.toString() : null;
    dto.movement_reason = m.movement_reason;
    dto.performed_by = m.performed_by.toString();
    dto.performed_at = m.performed_at.toISOString();
    dto.notes = m.notes ?? null;
    return dto;
  }
}
