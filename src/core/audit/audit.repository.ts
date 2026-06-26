import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { BaseRepository } from '../database/repositories/base/base.repository';

export interface CreateAuditEventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  userId: bigint;
  payload: Record<string, unknown>;
  clientPlatform?: string;
}

@Injectable()
export class AuditRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(input: CreateAuditEventInput): Promise<void> {
    await this.db.audit_events.create({
      data: {
        event_type: input.eventType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        user_id: input.userId,
        payload: input.payload as Prisma.InputJsonValue,
        client_platform: input.clientPlatform ?? null,
      },
    });
  }
}
