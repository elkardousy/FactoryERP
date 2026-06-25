import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersRepository } from '../../repositories/users.repository';
import { AuditRepository } from '../../repositories/audit.repository';
import { SessionService, SessionContext } from '../../services/session.service';
import { TokenService } from '../../services/token.service';

import type { JwtPayload } from '../login/contracts/jwt-payload.interface';
import type { LoginResult } from '../login/contracts/login-result.interface';

import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly auditRepository: AuditRepository,
  ) {}

  async execute(dto: RefreshDto, ctx: SessionContext): Promise<LoginResult> {
    // 1. Parse composite refresh token
    const separatorIndex = dto.refreshToken.indexOf(':');
    if (separatorIndex === -1) {
      throw new UnauthorizedException('Invalid refresh token format.');
    }

    const sessionIdStr = dto.refreshToken.slice(0, separatorIndex);
    const rawToken     = dto.refreshToken.slice(separatorIndex + 1);

    const sessionId = BigInt(sessionIdStr);

    // 2. Load and validate the session
    const session = await this.sessionService.findSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found.');
    }

    await this.sessionService.validateSession(session);

    // 3. Verify the raw token against the stored hash
    if (!session.refresh_token_hash) {
      throw new UnauthorizedException('Session has no refresh token.');
    }

    const tokenValid = await this.tokenService.compareRefreshToken(
      rawToken,
      session.refresh_token_hash,
    );

    if (!tokenValid) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // 4. Load the user
    const user = await this.usersRepository.findActiveById(session.user_id);
    if (!user) {
      throw new UnauthorizedException('User account is inactive or locked.');
    }

    // 5. Generate new token pair
    const payload: JwtPayload = {
      sub:       user.user_id,
      username:  user.username,
      roleId:    user.role_id,
      sessionId: session.session_id,
    };

    const tokenPair = await this.tokenService.generateTokenPair(payload);

    // 6. Rotate: hash new refresh token, update session
    const newRefreshTokenHash = await this.tokenService.hashRefreshToken(
      tokenPair.refreshToken,
    );

    await this.sessionService.refreshSession(
      session.session_id,
      newRefreshTokenHash,
      tokenPair.refreshExpiresAt,
    );

    // 7. Audit (best-effort)
    try {
      await this.auditRepository.create({
        eventType:      'AUTH_TOKEN_REFRESH',
        entityType:     'user_sessions',
        entityId:       String(session.session_id),
        userId:         user.user_id,
        payload:        { sessionId: String(session.session_id) },
        clientPlatform: ctx.devicePlatform,
      });
    } catch {
      // Audit failure must never block token refresh
    }

    return {
      user: {
        userId:   user.user_id,
        username: user.username,
        fullName: user.full_name,
        roleId:   user.role_id,
      },
      tokens: {
        ...tokenPair,
        // Encode session id into the composite refresh token for the client
        refreshToken: `${session.session_id}:${tokenPair.refreshToken}`,
      },
      sessionId:          session.session_id,
      mustChangePassword: user.must_change_password,
    };
  }
}
