import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { PrismaService } from './core/database/prisma/prisma.service';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './core/exceptions/filters/prisma-exception.filter';
import { GlobalValidationPipe } from './core/pipes/validation.pipe';
import { setupSwagger } from './core/config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    exposedHeaders: ['X-Correlation-ID'],
  });

  app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());
  app.useGlobalPipes(GlobalValidationPipe);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  setupSwagger(app);

  const config = app.get(ConfigService);
  await app.listen(config.get<number>('app.port') ?? 3000);
}

void bootstrap();
