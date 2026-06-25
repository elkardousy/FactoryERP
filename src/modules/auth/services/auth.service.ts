import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { LoginDto } from '../use-cases/login';
import { UsersRepository } from '../repositories/users.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
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

    const valid = await this.passwordService.verify(
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
    };
    

    await this.usersRepository.updateLastLogin(
      user.user_id,
    );

    return user;
  }

  async login(dto: LoginDto) {
    // سنبنيها في الخطوة القادمة
    const user = await this.validateUser(
      dto.username,
      dto.password,
    );

    return user;
  }
}