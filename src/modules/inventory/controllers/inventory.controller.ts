import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../authorization/decorators/roles.decorator';
import { SystemRoles } from '../../../core/constants/system-roles.constants';

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
export class InventoryController {}
