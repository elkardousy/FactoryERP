import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ) {
    const user =
      await this.usersRepository.findActiveUser(username);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid username or password.',
      );
    }

    const valid = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!valid) {
      await this.usersRepository.incrementFailedLogin(
        user.user_id,
      );

      throw new UnauthorizedException(
        'Invalid username or password.',
      );
    }

    await this.usersRepository.updateLastLogin(
      user.user_id,
    );

    return user;
  }
}