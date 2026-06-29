import { Injectable } from '@nestjs/common';
import { InventoryReportingService } from '../../services/inventory-reporting.service';
import type { StockPositionReportDto } from '../../dto/inventory-report.dto';

@Injectable()
export class GetStockPositionReportUseCase {
  constructor(private readonly reportingService: InventoryReportingService) {}

  async execute(warehouseId?: bigint): Promise<StockPositionReportDto> {
    return this.reportingService.getStockPositionReport(warehouseId);
  }
}
