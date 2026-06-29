import { Injectable } from '@nestjs/common';
import { AccountabilityClosureEnum } from '@prisma/client';
import { InventoryReportingService } from '../../services/inventory-reporting.service';
import type { VarianceSummaryReportDto } from '../../dto/inventory-report.dto';

@Injectable()
export class GetVarianceReportUseCase {
  constructor(private readonly reportingService: InventoryReportingService) {}

  async execute(
    closureStatus?: AccountabilityClosureEnum,
  ): Promise<VarianceSummaryReportDto> {
    return this.reportingService.getVarianceSummaryReport(closureStatus);
  }
}
