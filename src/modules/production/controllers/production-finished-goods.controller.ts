import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateFinishedGoodsUseCase } from '../use-cases/create-finished-goods/create-finished-goods.use-case';
import { GetFinishedGoodsUseCase } from '../use-cases/get-finished-goods/get-finished-goods.use-case';
import { ListFinishedGoodsUseCase } from '../use-cases/list-finished-goods/list-finished-goods.use-case';
import { GetFinishedGoodsHistoryUseCase } from '../use-cases/get-finished-goods-history/get-finished-goods-history.use-case';
import { GetFinishedGoodsSummaryUseCase } from '../use-cases/get-finished-goods-summary/get-finished-goods-summary.use-case';
import { FinishedGoodsDashboardUseCase } from '../use-cases/finished-goods-dashboard/finished-goods-dashboard.use-case';
import type {
  CreateFinishedGoodsDto,
  FinishedGoodsFilterDto,
  FinishedGoodsHistoryFilterDto,
  FinishedGoodsSummaryFilterDto,
} from '../dto/production-finished-goods.dto';
import type { JwtPayload } from '../../auth/use-cases/login';

@ApiTags('Production — Finished Goods')
@ApiBearerAuth('JWT')
@Controller({ path: 'production', version: '1' })
export class ProductionFinishedGoodsController {
  constructor(
    private readonly createFG: CreateFinishedGoodsUseCase,
    private readonly getFG: GetFinishedGoodsUseCase,
    private readonly listFG: ListFinishedGoodsUseCase,
    private readonly historyFG: GetFinishedGoodsHistoryUseCase,
    private readonly summaryFG: GetFinishedGoodsSummaryUseCase,
    private readonly dashboardFG: FinishedGoodsDashboardUseCase,
  ) {}

  @Post('finished-goods')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
  )
  create(
    @Body() dto: CreateFinishedGoodsDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.createFG.execute(dto, actor);
  }

  // ── Summary/History/Dashboard BEFORE /:id to avoid route shadowing ────────

  @Get('finished-goods/summary')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getSummary(@Query() filter: FinishedGoodsSummaryFilterDto) {
    return this.summaryFG.execute(filter);
  }

  @Get('finished-goods/history')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getHistory(@Query() filter: FinishedGoodsHistoryFilterDto) {
    return this.historyFG.execute(filter);
  }

  @Get('finished-goods/dashboard')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getDashboard() {
    return this.dashboardFG.execute();
  }

  @Get('finished-goods')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  list(@Query() filter: FinishedGoodsFilterDto) {
    return this.listFG.execute(filter);
  }

  @Get('finished-goods/:id')
  @Roles(
    SystemRoles.SYSTEM_ADMIN,
    SystemRoles.ADMIN,
    SystemRoles.MANAGER,
    SystemRoles.SUPERVISOR,
    SystemRoles.STAFF,
  )
  getOne(@Param('id') id: string) {
    return this.getFG.execute(id);
  }
}
