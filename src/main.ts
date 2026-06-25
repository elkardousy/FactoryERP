import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './core/database/prisma/prisma.service';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './core/exceptions/filters/prisma-exception.filter';
import { GlobalValidationPipe } from './core/pipes/validation.pipe';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(GlobalValidationPipe);
  app.useGlobalFilters(
  new PrismaExceptionFilter(),
  new AllExceptionsFilter(),
  
);
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const config = app.get(ConfigService);

  console.log('APP_NAME:', config.get('app.name'));
  console.log('PORT:', config.get('app.port'));

  await app.listen(config.get<number>('app.port') ?? 3000);
}

bootstrap();