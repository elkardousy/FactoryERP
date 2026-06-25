import { Injectable } from '@nestjs/common';

import { JwtService } from './jwt.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
  ) {}

  async generateAccessToken(payload: object) {
    return this.jwt.generateAccessToken(payload);
  }
}