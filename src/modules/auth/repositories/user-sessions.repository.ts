import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type UserSession = Prisma.user_sessionsGetPayload<object>;

import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';

export interface CreateSessionInput {
  userId: bigint;
  deviceId: string;
  devicePlatform: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

export interface UpdateSessionInput {
  refreshTokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class UserSessionsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(input: CreateSessionInput): Promise<UserSession> {
    return this.db.user_sessions.create({
      data: {
        user_id:            input.userId,
        device_id:          input.deviceId,
        device_platform:    input.devicePlatform,
        refresh_token_hash: input.refreshTokenHash,
        expires_at:         input.expiresAt,
        status:             'ACTIVE',
      },
    });
  }

  async findById(sessionId: bigint): Promise<UserSession | null> {
    return this.db.user_sessions.findUnique({
      where: { session_id: sessionId },
    });
  }

  async findActiveByUserId(userId: bigint): Promise<UserSession[]> {
    return this.db.user_sessions.findMany({
      where: {
        user_id: userId,
        status:  'ACTIVE',
        ended_at: null,
      },
      orderBy: { started_at: 'desc' },
    });
  }

  async update(sessionId: bigint, input: UpdateSessionInput): Promise<UserSession> {
    return this.db.user_sessions.update({
      where: { session_id: sessionId },
      data: {
        refresh_token_hash: input.refreshTokenHash,
        expires_at:         input.expiresAt,
        last_activity_at:   new Date(),
      },
    });
  }

  async updateLastActivity(sessionId: bigint): Promise<void> {
    await this.db.user_sessions.update({
      where: { session_id: sessionId },
      data: { last_activity_at: new Date() },
    });
  }

  async revokeById(
    sessionId: bigint,
    revokedBy: bigint,
    reason: string,
  ): Promise<void> {
    await this.db.user_sessions.update({
      where: { session_id: sessionId },
      data: {
        status:     'REVOKED',
        ended_at:   new Date(),
        end_reason: reason,
        revoked_by: revokedBy,
      },
    });
  }

  async revokeAllByUserId(
    userId: bigint,
    revokedBy: bigint,
    reason: string,
  ): Promise<void> {
    await this.db.user_sessions.updateMany({
      where: {
        user_id: userId,
        status:  'ACTIVE',
      },
      data: {
        status:     'REVOKED',
        ended_at:   new Date(),
        end_reason: reason,
        revoked_by: revokedBy,
      },
    });
  }
}
