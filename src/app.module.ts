import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuditModule } from './core/audit/audit.module';
import { DocumentNumberingModule } from './core/document-numbering/document-numbering.module';
import { CustomersModule } from './modules/customers/customers.module';
import { GarmentModelsModule } from './modules/garment-models/garment-models.module';
import { MeasurementsModule } from './modules/measurements/measurements.module';
import { ProductionSetupModule } from './modules/production-setup/production-setup.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehouseLocationsModule } from './modules/warehouse-locations/warehouse-locations.module';
import { ProductionModule } from './modules/production/production.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/authorization/guards/roles.guard';
import { ScreenPermissionGuard } from './modules/authorization/guards/screen-permission.guard';
import configuration from './core/config/configuration';
import { validationSchema } from './core/config/env.validation';
import { PrismaModule } from './core/database/prisma/prisma.module';
import { LoggerModule } from './core/logger/logger.module';
import { CorrelationIdMiddleware } from './core/middleware/correlation-id.middleware';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: configuration,
      validationSchema,
    }),
    PrismaModule,
    LoggerModule,
    AuditModule,
    DocumentNumberingModule,
    OrganizationModule,
    MeasurementsModule,
    WarehousesModule,
    ProductionSetupModule,
    CustomersModule,
    SuppliersModule,
    GarmentModelsModule,
    AuthModule,
    AuthorizationModule,
    InventoryModule,
    WarehouseLocationsModule,
    ProductionModule,
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
  ],
  providers: [
    // Guard order: rate-limit → authenticate → role-check → screen-check
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ScreenPermissionGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
