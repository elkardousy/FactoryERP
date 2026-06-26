import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../../authorization/decorators/public.decorator';

import { LoginDto, LoginUseCase } from '../use-cases/login';
import type { JwtPayload } from '../use-cases/login';
import { RefreshDto, RefreshUseCase } from '../use-cases/refresh';
import { LogoutUseCase } from '../use-cases/logout';

@ApiTags('Auth')
@ApiHeader({
  name: 'X-Device-ID',
  description: 'Unique device identifier',
  required: false,
})
@ApiHeader({
  name: 'X-Device-Platform',
  description: 'Client platform (web, ios, android)',
  required: false,
})
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Authenticate with username and password' })
  @ApiResponse({
    status: 200,
    description:
      'Login successful — returns access token, refresh token, and session info.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account locked.',
  })
  @ApiResponse({ status: 429, description: 'Too many login attempts.' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.loginUseCase.execute(dto, {
      deviceId: (req.headers['x-device-id'] as string) ?? 'unknown',
      devicePlatform: (req.headers['x-device-platform'] as string) ?? 'web',
    });
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate access and refresh tokens using a valid refresh token',
  })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid, expired, or session revoked.',
  })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.refreshUseCase.execute(dto, {
      deviceId: (req.headers['x-device-id'] as string) ?? 'unknown',
      devicePlatform: (req.headers['x-device-platform'] as string) ?? 'web',
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiResponse({ status: 204, description: 'Session revoked successfully.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT.' })
  async logout(@CurrentUser() user: JwtPayload) {
    await this.logoutUseCase.execute(user);
  }
}
