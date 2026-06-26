import { Injectable, UnauthorizedException } from '@nestjs/common';

import {
  UserSessionsRepository,
  UserSession,
  CreateSessionInput,
} from '../repositories/user-sessions.repository';
import type { TokenPair } from '../use-cases/login/contracts/token-pair.interface';

export interface SessionContext {
  deviceId: string;
  devicePlatform: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly sessionsRepository: UserSessionsRepository) {}

  async createSession(
    userId: bigint,
    tokenPair: TokenPair,
    refreshTokenHash: string,
    ctx: SessionContext,
  ): Promise<UserSession> {
    const input: CreateSessionInput = {
      userId,
      deviceId: ctx.deviceId,
      devicePlatform: ctx.devicePlatform,
      refreshTokenHash,
      expiresAt: tokenPair.refreshExpiresAt,
    };

    return this.sessionsRepository.create(input);
  }

  async findSession(sessionId: bigint): Promise<UserSession | null> {
    return this.sessionsRepository.findById(sessionId);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validateSession(session: UserSession): Promise<void> {
    if (session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session has been revoked.');
    }

    if (session.ended_at !== null) {
      throw new UnauthorizedException('Session has ended.');
    }

    if (new Date() > session.expires_at) {
      throw new UnauthorizedException('Session has expired.');
    }
  }

  async refreshSession(
    sessionId: bigint,
    newRefreshTokenHash: string,
    newExpiresAt: Date,
  ): Promise<UserSession> {
    return this.sessionsRepository.update(sessionId, {
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
    });
  }

  async revokeSession(
    sessionId: bigint,
    revokedBy: bigint,
    reason = 'LOGOUT',
  ): Promise<void> {
    return this.sessionsRepository.revokeById(sessionId, revokedBy, reason);
  }

  async revokeAllSessions(
    userId: bigint,
    revokedBy: bigint,
    reason = 'FORCED_LOGOUT',
  ): Promise<void> {
    return this.sessionsRepository.revokeAllByUserId(userId, revokedBy, reason);
  }

  async updateLastActivity(sessionId: bigint): Promise<void> {
    return this.sessionsRepository.updateLastActivity(sessionId);
  }
}
