import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseHealthService } from '../health/database.health';

@Global()
@Module({
  providers: [PrismaService, DatabaseHealthService],
  exports: [PrismaService, DatabaseHealthService],
})
export class PrismaModule {}
