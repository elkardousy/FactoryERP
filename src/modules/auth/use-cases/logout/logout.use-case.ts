import { Injectable } from '@nestjs/common';

import { AuditRepository } from '../../repositories/audit.repository';
import { SessionService } from '../../services/session.service';

import type { JwtPayload } from '../login/contracts/jwt-payload.interface';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly auditRepository: AuditRepository,
  ) {}

  async execute(currentUser: JwtPayload): Promise<void> {
    await this.sessionService.revokeSession(
      currentUser.sessionId,
      currentUser.sub,
      'LOGOUT',
    );

    try {
      await this.auditRepository.create({
        eventType:  'AUTH_LOGOUT',
        entityType: 'user_sessions',
        entityId:   String(currentUser.sessionId),
        userId:     currentUser.sub,
        payload:    {
          sessionId: String(currentUser.sessionId),
          username:  currentUser.username,
        },
      });
    } catch {
      // Audit failure must never block logout
    }
  }
}
