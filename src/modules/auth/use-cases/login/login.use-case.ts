import { Injectable } from '@nestjs/common';

import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { SessionService, SessionContext } from '../../services/session.service';
import { AuditService } from '../../../../core/audit/audit.service';

import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './contracts/jwt-payload.interface';
import type { LoginResult } from './contracts/login-result.interface';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: LoginDto, ctx: SessionContext): Promise<LoginResult> {
    // 1. Validate credentials + account-level guards (locked, active)
    const user = await this.authService.validateUser(
      dto.username,
      dto.password,
    );

    // 2. Build JWT payload
    // Session id is not known yet; we use a placeholder and back-fill after
    // session creation — so we create the session first, then sign the token.
    const tokenPair = await this.tokenService.generateTokenPair({
      sub: user.user_id,
      username: user.username,
      roleId: user.role_id,
      sessionId: BigInt(0), // will be replaced below
    } satisfies JwtPayload);

    // 3. Hash the raw refresh token for storage
    const refreshTokenHash = await this.tokenService.hashRefreshToken(
      tokenPair.refreshToken,
    );

    // 4. Persist the session
    const session = await this.sessionService.createSession(
      user.user_id,
      tokenPair,
      refreshTokenHash,
      ctx,
    );

    // 5. Re-sign access token now that session_id is known
    const payload: JwtPayload = {
      sub: user.user_id,
      username: user.username,
      roleId: user.role_id,
      sessionId: session.session_id,
    };

    const finalAccessToken =
      await this.tokenService.generateAccessToken(payload);

    // 6. Write audit event (best-effort — AuditService.log wraps in try/catch)
    void this.auditService.log({
      eventType: 'AUTH_LOGIN',
      entityType: 'users',
      entityId: String(user.user_id),
      userId: user.user_id,
      payload: {
        username: user.username,
        sessionId: String(session.session_id),
        deviceId: ctx.deviceId,
        platform: ctx.devicePlatform,
      },
      clientPlatform: ctx.devicePlatform,
    });

    return {
      user: {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        roleId: user.role_id,
      },
      tokens: {
        ...tokenPair,
        accessToken: finalAccessToken,
        // Encode session id into the composite refresh token for the client
        refreshToken: `${session.session_id}:${tokenPair.refreshToken}`,
      },
      sessionId: session.session_id,
      mustChangePassword: user.must_change_password,
    };
  }
}
