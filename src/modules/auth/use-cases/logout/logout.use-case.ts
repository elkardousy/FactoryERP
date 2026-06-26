import { Injectable } from '@nestjs/common';

import { AuditService } from '../../../../core/audit/audit.service';
import { SessionService } from '../../services/session.service';

import type { JwtPayload } from '../login/contracts/jwt-payload.interface';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  async execute(currentUser: JwtPayload): Promise<void> {
    await this.sessionService.revokeSession(
      currentUser.sessionId,
      currentUser.sub,
      'LOGOUT',
    );

    void this.auditService.log({
      eventType: 'AUTH_LOGOUT',
      entityType: 'user_sessions',
      entityId: String(currentUser.sessionId),
      userId: currentUser.sub,
      payload: {
        sessionId: String(currentUser.sessionId),
        username: currentUser.username,
      },
    });
  }
}
