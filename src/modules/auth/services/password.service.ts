import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async verify(
    plain: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}