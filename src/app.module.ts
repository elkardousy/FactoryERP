import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
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
    AuthModule,
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
    ]),
  ],
  providers: [
    { provide: APP_GUARD,       useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
