import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { PERMISSION_CACHE } from './constants/authorization.constants';
import { MemoryPermissionCache } from './cache/memory-permission-cache';
import { RolesRepository } from './repositories/roles.repository';
import { ScreenPermissionsRepository } from './repositories/screen-permissions.repository';
import { ApprovalPermissionsRepository } from './repositories/approval-permissions.repository';
import { PermissionResolverService } from './services/permission-resolver.service';
import { AuthorizationService } from './services/authorization.service';
import { RolesGuard } from './guards/roles.guard';
import { ScreenPermissionGuard } from './guards/screen-permission.guard';
import { ApprovalGuard } from './guards/approval.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: PERMISSION_CACHE, useClass: MemoryPermissionCache },
    RolesRepository,
    ScreenPermissionsRepository,
    ApprovalPermissionsRepository,
    PermissionResolverService,
    AuthorizationService,
    RolesGuard,
    ScreenPermissionGuard,
    ApprovalGuard,
  ],
  exports: [
    AuthorizationService,
    PermissionResolverService,
    RolesGuard,
    ScreenPermissionGuard,
    ApprovalGuard,
  ],
})
export class AuthorizationModule {}
