import { Injectable } from '@nestjs/common';
import { InventoryReportingService } from '../../services/inventory-reporting.service';
import type { TransactionVolumeReportDto } from '../../dto/inventory-report.dto';

@Injectable()
export class GetTransactionVolumeReportUseCase {
  constructor(private readonly reportingService: InventoryReportingService) {}

  async execute(
    fromDate: Date,
    toDate: Date,
  ): Promise<TransactionVolumeReportDto> {
    return this.reportingService.getTransactionVolumeReport(fromDate, toDate);
  }
}
