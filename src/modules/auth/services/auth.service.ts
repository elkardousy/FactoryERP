import { Injectable, UnauthorizedException } from '@nestjs/common';
import { users } from '@prisma/client';

import { LoginDto } from '../use-cases/login';
import { UsersRepository } from '../repositories/users.repository';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Finds an active (non-locked) user by id.
   * Used by JwtStrategy to re-validate the user on every request.
   */
  async findActiveById(userId: bigint): Promise<users | null> {
    return this.usersRepository.findActiveById(userId);
  }

  /**
   * Validates credentials and enforces account-level security policies.
   * Returns the full user record on success.
   */
  async validateUser(
    username: string,
    password: string,
  ): Promise<users> {
    const user = await this.usersRepository.findActiveUser(username);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    if (user.locked_at !== null) {
      throw new UnauthorizedException(
        'Account is locked. Please contact an administrator.',
      );
    }

    const valid = await this.passwordService.verify(
      password,
      user.password_hash,
    );

    if (!valid) {
      await this.usersRepository.incrementFailedLogin(user.user_id);
      throw new UnauthorizedException('Invalid username or password.');
    }

    if (user.must_change_password) {
      // Intentionally allow login to proceed; the use-case surfaces the flag
      // so the client can redirect to the change-password flow.
    }

    await this.usersRepository.updateLastLogin(user.user_id);

    return user;
  }

  /** Kept so existing callers that pass a LoginDto still compile. */
  async login(dto: LoginDto): Promise<users> {
    return this.validateUser(dto.username, dto.password);
  }
}
