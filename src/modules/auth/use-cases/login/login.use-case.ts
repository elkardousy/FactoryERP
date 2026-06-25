import { Injectable } from '@nestjs/common';

import { AuthService } from '../../services/auth.service';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authService: AuthService,
  ) {}

  async execute(dto: LoginDto) {
    return this.authService.login(dto);
  }
}
