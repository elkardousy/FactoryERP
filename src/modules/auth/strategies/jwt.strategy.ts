import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService } from '../services/auth.service';
import type { JwtPayload } from '../use-cases/login/contracts/jwt-payload.interface';
import type { JwtSignPayload } from '../use-cases/login/contracts/jwt-sign-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      config.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(rawPayload: JwtSignPayload): Promise<JwtPayload> {
    const payload: JwtPayload = {
      sub:       BigInt(rawPayload.sub),
      username:  rawPayload.username,
      roleId:    BigInt(rawPayload.roleId),
      sessionId: BigInt(rawPayload.sessionId),
    };

    const user = await this.authService.findActiveById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'Account is inactive, locked, or no longer exists.',
      );
    }

    if (user.locked_at !== null) {
      throw new UnauthorizedException('Account is locked.');
    }

    return payload;
  }
}
