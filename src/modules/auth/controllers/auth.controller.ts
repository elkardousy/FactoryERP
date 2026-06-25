import { Body, Controller, Post } from '@nestjs/common';

import { LoginDto } from '../use-cases/login';
import { AuthService } from '../services/auth.service';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }
}