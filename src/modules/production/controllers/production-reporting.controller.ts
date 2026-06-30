import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { ProductionReportingService } from '../services/production-reporting.service';

const ALL_ROLES = [
  SystemRoles.SYSTEM_ADMIN,
  SystemRoles.ADMIN,
  SystemRoles.MANAGER,
  SystemRoles.SUPERVISOR,
  SystemRoles.STAFF,
] as const;

@ApiTags('Production Reports')
@ApiBearerAuth('JWT')
@Controller({ path: 'production/reports', version: '1' })
export class ProductionReportingController {
  constructor(private readonly reportingService: ProductionReportingService) {}

  @Get('dashboard')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary:
      'Production dashboard: orders by status, WIP, FG, scrap totals, recent orders',
  })
  getDashboard() {
    return this.reportingService.getDashboard();
  }

  @Get('summary')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary:
      'Single-order production summary: stages, WIP, quality, scrap, packing, supplementary',
  })
  @ApiQuery({
    name: 'order_id',
    required: true,
    description: 'Production order ID',
  })
  getSummary(@Query('order_id') order_id: string) {
    return this.reportingService.getSummary({ order_id });
  }

  @Get('kpis')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary:
      'Production KPIs: completion rate, scrap rate, WIP, FG, returned dozens',
  })
  getKPIs() {
    return this.reportingService.getKPIs();
  }

  @Get('orders')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Paginated production orders report with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'model_id', required: false })
  @ApiQuery({ name: 'line_id', required: false })
  @ApiQuery({ name: 'release_type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getOrdersReport(
    @Query('status') status?: string,
    @Query('model_id') model_id?: string,
    @Query('line_id') line_id?: string,
    @Query('release_type') release_type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getOrdersReport({
      status,
      model_id,
      line_id,
      release_type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('stages')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Paginated stage performance report' })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'stage_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getStageReport(
    @Query('order_id') order_id?: string,
    @Query('stage_id') stage_id?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getStageReport({
      order_id,
      stage_id,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('wip')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Paginated WIP inventory report' })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'line_id', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getWipReport(
    @Query('order_id') order_id?: string,
    @Query('line_id') line_id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getWipReport({
      order_id,
      line_id,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('scrap')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary: 'Paginated scrap records report with total dozens scrapped',
  })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'stage_id', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getScrapReport(
    @Query('order_id') order_id?: string,
    @Query('stage_id') stage_id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getScrapReport({
      order_id,
      stage_id,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('quality')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Paginated quality output boxes report' })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'model_id', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getQualityReport(
    @Query('order_id') order_id?: string,
    @Query('model_id') model_id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getQualityReport({
      order_id,
      model_id,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('packing')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Paginated packing orders report' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPackingReport(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getPackingReport({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('finished-goods')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary: 'Paginated finished goods bags report with total bags and dozens',
  })
  @ApiQuery({ name: 'model_id', required: false })
  @ApiQuery({ name: 'customer_id', required: false })
  @ApiQuery({ name: 'warehouse_id', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFGReport(
    @Query('model_id') model_id?: string,
    @Query('customer_id') customer_id?: string,
    @Query('warehouse_id') warehouse_id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getFGReport({
      model_id,
      customer_id,
      warehouse_id,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('supplementary')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Paginated supplementary material requests report' })
  @ApiQuery({ name: 'order_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'reason_type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getSupplementaryReport(
    @Query('order_id') order_id?: string,
    @Query('status') status?: string,
    @Query('reason_type') reason_type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getSupplementaryReport({
      order_id,
      status,
      reason_type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('historical')
  @Roles(...ALL_ROLES)
  @ApiOperation({
    summary:
      'Historical production orders report filtered by date range on created_at',
  })
  @ApiQuery({
    name: 'date_from',
    required: false,
    description: 'ISO 8601 date string',
  })
  @ApiQuery({
    name: 'date_to',
    required: false,
    description: 'ISO 8601 date string',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHistoricalReport(
    @Query('date_from') date_from?: string,
    @Query('date_to') date_to?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getHistoricalReport({
      date_from,
      date_to,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
