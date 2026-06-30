import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateSupplementaryRequestUseCase } from '../use-cases/create-supplementary-request/create-supplementary-request.use-case';
import { ApproveSupplementaryRequestUseCase } from '../use-cases/approve-supplementary-request/approve-supplementary-request.use-case';
import { RejectSupplementaryRequestUseCase } from '../use-cases/reject-supplementary-request/reject-supplementary-request.use-case';
import { CancelSupplementaryRequestUseCase } from '../use-cases/cancel-supplementary-request/cancel-supplementary-request.use-case';
import { TransferSupplementaryMaterialUseCase } from '../use-cases/transfer-supplementary-material/transfer-supplementary-material.use-case';
import { GetSupplementaryRequestUseCase } from '../use-cases/get-supplementary-request/get-supplementary-request.use-case';
import { ListSupplementaryRequestsUseCase } from '../use-cases/list-supplementary-requests/list-supplementary-requests.use-case';
import { GetSupplementaryHistoryUseCase } from '../use-cases/get-supplementary-history/get-supplementary-history.use-case';
import { GetSupplementarySummaryUseCase } from '../use-cases/get-supplementary-summary/get-supplementary-summary.use-case';
import { SupplementaryDashboardUseCase } from '../use-cases/supplementary-dashboard/supplementary-dashboard.use-case';
import type {
  CreateSupplementaryRequestDto,
  RejectSupplementaryRequestDto,
  CancelSupplementaryRequestDto,
  SupplementaryFilterDto,
  SupplementaryHistoryFilterDto,
  SupplementarySummaryFilterDto,
} from '../dto/production-supplementary.dto';
import type { JwtPayload } from '../../auth/use-cases/login';

@ApiTags('Production — Supplementary Material Requests')
@ApiBearerAuth('JWT')
@Controller({ path: 'production', version: '1' })
export class ProductionSupplementaryController {
  constructor(
    private readonly createUC: CreateSupplementaryRequestUseCase,
    private readonly approveUC: ApproveSupplementaryRequestUseCase,
    private readonly rejectUC: RejectSupplementaryRequestUseCase,
    private readonly cancelUC: CancelSupplementaryRequestUseCase,
    private readonly transferUC: TransferSupplementaryMaterialUseCase,
    private readonly getUC: GetSupplementaryRequestUseCase,
    private readonly listUC: ListSupplementaryRequestsUseCase,
    private readonly historyUC: GetSupplementaryHistoryUseCase,
    private readonly summaryUC: GetSupplementarySummaryUseCase,
    private readonly dashboardUC: SupplementaryDashboardUseCase,
  ) {}

  @Post('supplementary')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  create(
    @Body() dto: CreateSupplementaryRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.createUC.execute(dto, actor);
  }

  // ── Static routes BEFORE /:id to prevent shadowing ─────────────────────────

  @Get('supplementary/summary')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getSummary(@Query() filter: SupplementarySummaryFilterDto) {
    return this.summaryUC.execute(filter);
  }

  @Get('supplementary/history')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getHistory(@Query() filter: SupplementaryHistoryFilterDto) {
    return this.historyUC.execute(filter);
  }

  @Get('supplementary/dashboard')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getDashboard() {
    return this.dashboardUC.execute();
  }

  @Get('supplementary')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  list(@Query() filter: SupplementaryFilterDto) {
    return this.listUC.execute(filter);
  }

  @Get('supplementary/:id')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getOne(@Param('id') id: string) {
    return this.getUC.execute(id);
  }

  // BR-Sup06: Approve requires MANAGER or above
  @Patch('supplementary/:id/approve')
  @Roles(SystemRoles.SYSTEM_ADMIN, SystemRoles.ADMIN, SystemRoles.MANAGER)
  approve(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.approveUC.execute(id, actor);
  }

  @Patch('supplementary/:id/reject')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  reject(
    @Param('id') id: string,
    @Body() dto: RejectSupplementaryRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.rejectUC.execute(id, dto, actor);
  }

  @Patch('supplementary/:id/transfer')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  transfer(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.transferUC.execute(id, actor);
  }

  @Patch('supplementary/:id/cancel')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelSupplementaryRequestDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.cancelUC.execute(id, dto, actor);
  }
}
