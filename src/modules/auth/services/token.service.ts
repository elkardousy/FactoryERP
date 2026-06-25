import { Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { JwtService } from './jwt.service';

import { JwtPayload } from '../use-cases/login/contracts/jwt-payload.interface';
import { TokenPair } from '../use-cases/login/contracts/token-pair.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
  ) {}

  async generateAccessToken(
    payload: JwtPayload,
  ): Promise<string> {
    return this.jwt.generateAccessToken(payload);
  }

  async generateRefreshToken(): Promise<string> {
    return crypto.randomUUID();
  }

  async generateTokenPair(
    payload: JwtPayload,
  ): Promise<TokenPair> {
    const accessToken =
      await this.generateAccessToken(payload);

    const refreshToken =
      await this.generateRefreshToken();

    return {
      accessToken,
      refreshToken,

      accessExpiresAt: new Date(
        Date.now() + 15 * 60 * 1000,
      ),

      refreshExpiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ),
    };
  }

  async verifyAccessToken(
    token: string,
  ) {
    return this.jwt.verify(token);
  }

  async verifyRefreshToken(
    token: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  async hashRefreshToken(
    token: string,
  ): Promise<string> {
    return bcrypt.hash(token, 12);
  }

  decode(token: string) {
    return this.jwt.decode(token);
  }
}