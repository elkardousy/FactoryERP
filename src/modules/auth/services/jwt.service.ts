import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(
    private readonly jwt: NestJwtService,
  ) {}

  async generateAccessToken(payload: object): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  async verify(token: string) {
    return this.jwt.verifyAsync(token);
  }

  decode(token: string) {
    return this.jwt.decode(token);
  }
}