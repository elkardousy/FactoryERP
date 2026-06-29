import { Injectable } from '@nestjs/common';
import { AccountabilityClosureEnum } from '@prisma/client';
import type { inventory_bags, inventory_investigations } from '@prisma/client';
import { InventoryReportingRepository } from '../repositories/inventory-reporting.repository';
import {
  StockPositionItemDto,
  StockPositionReportDto,
  TransactionVolumeReportDto,
  VarianceReportDto,
  VarianceSummaryReportDto,
} from '../dto/inventory-report.dto';

@Injectable()
export class InventoryReportingService {
  constructor(private readonly reportingRepo: InventoryReportingRepository) {}

  async getTransactionVolumeReport(
    fromDate: Date,
    toDate: Date,
  ): Promise<TransactionVolumeReportDto> {
    const volumes = await this.reportingRepo.getTransactionVolume(
      fromDate,
      toDate,
    );
    const total = volumes.reduce((sum, v) => sum + v.count, 0);

    const dto = new TransactionVolumeReportDto();
    dto.from_date = fromDate.toISOString();
    dto.to_date = toDate.toISOString();
    dto.volumes = volumes.map((v) => ({
      txn_type: v.txn_type,
      count: v.count,
    }));
    dto.total_transactions = total;
    return dto;
  }

  async getStockPositionReport(
    warehouseId?: bigint,
  ): Promise<StockPositionReportDto> {
    const positions = await this.reportingRepo.getStockPosition(warehouseId);
    const totalDozens = positions.reduce(
      (sum, p) => sum + Number(p.dozens_on_hand),
      0,
    );

    const dto = new StockPositionReportDto();
    dto.positions = positions.map((p) => this.toPositionDto(p));
    dto.total_skus = positions.length;
    dto.total_dozens_on_hand = totalDozens.toFixed(3);
    return dto;
  }

  async getVarianceSummaryReport(
    closureStatus?: AccountabilityClosureEnum,
  ): Promise<VarianceSummaryReportDto> {
    const investigations =
      await this.reportingRepo.getVarianceReport(closureStatus);
    const open = investigations.filter(
      (i) => i.closure_status === AccountabilityClosureEnum.OPEN,
    ).length;
    const closed = investigations.filter(
      (i) => i.closure_status === AccountabilityClosureEnum.CLOSED,
    ).length;

    const dto = new VarianceSummaryReportDto();
    dto.variances = investigations.map((i) => this.toVarianceDto(i));
    dto.total = investigations.length;
    dto.open = open;
    dto.closed = closed;
    return dto;
  }

  private toPositionDto(p: inventory_bags): StockPositionItemDto {
    const dto = new StockPositionItemDto();
    dto.warehouse_id = p.warehouse_id.toString();
    dto.model_id = p.model_id.toString();
    dto.part_id = p.part_id.toString();
    dto.dozens_on_hand = p.dozens_on_hand.toString();
    dto.last_updated = p.last_updated.toISOString();
    return dto;
  }

  private toVarianceDto(i: inventory_investigations): VarianceReportDto {
    const dto = new VarianceReportDto();
    dto.investigation_id = i.investigation_id.toString();
    dto.investigation_number = i.investigation_number;
    dto.warehouse_id = i.warehouse_id ? i.warehouse_id.toString() : null;
    dto.model_id = i.model_id ? i.model_id.toString() : null;
    dto.part_id = i.part_id ? i.part_id.toString() : null;
    dto.description = i.description;
    dto.closure_status = i.closure_status;
    dto.reported_at = i.reported_at.toISOString();
    return dto;
  }
}
