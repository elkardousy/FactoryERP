import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  console.log('APP_NAME:', config.get('app.name'));
  console.log('PORT:', config.get('app.port'));

  await app.listen(config.get<number>('app.port') ?? 3000);
}

bootstrap();