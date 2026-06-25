import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import configuration from './core/config/configuration';
import { validationSchema } from './core/config/env.validation';
import { PrismaModule } from './core/database/prisma/prisma.module';
import { LoggerModule } from './core/logger/logger.module';
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
  ],
})
export class AppModule {}