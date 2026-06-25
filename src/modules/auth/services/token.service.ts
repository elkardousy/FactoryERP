import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import ms from 'ms';

import { JwtService } from './jwt.service';
import type { JwtPayload } from '../use-cases/login/contracts/jwt-payload.interface';
import type { JwtSignPayload } from '../contracts/jwt-sign-payload.interface';
import type { TokenPair } from '../use-cases/login/contracts/token-pair.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const signPayload: JwtSignPayload = {
      sub:       payload.sub.toString(),
      username:  payload.username,
      roleId:    payload.roleId.toString(),
      sessionId: payload.sessionId.toString(),
    };
    return this.jwt.generateAccessToken(signPayload);
  }

  async generateRefreshToken(): Promise<string> {
    return crypto.randomUUID();
  }

  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const accessToken  = await this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken();

    const accessExpiresIn  = this.config.getOrThrow<string>('jwt.expiresIn');
    const refreshExpiresIn = this.config.getOrThrow<string>('jwt.refreshExpiresIn');

    return {
      accessToken,
      refreshToken,
      accessExpiresAt:  new Date(Date.now() + (ms(accessExpiresIn as ms.StringValue) ?? 0)),
      refreshExpiresAt: new Date(Date.now() + (ms(refreshExpiresIn as ms.StringValue) ?? 0)),
    };
  }

  async verifyAccessToken(token: string) {
    return this.jwt.verify(token);
  }

  async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 12);
  }

  async compareRefreshToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  /** @deprecated Use compareRefreshToken — kept for backward compatibility */
  async verifyRefreshToken(token: string, hash: string): Promise<boolean> {
    return this.compareRefreshToken(token, hash);
  }

  decode(token: string) {
    return this.jwt.decode(token);
  }
}
