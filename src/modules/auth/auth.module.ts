import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import type { StringValue } from 'ms';

import { PrismaModule } from '../../core/database/prisma/prisma.module';

import { AuthController } from './controllers/auth.controller';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersRepository } from './repositories/users.repository';
import { AuthService } from './services/auth.service';
import { JwtService } from './services/jwt.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LoginUseCase } from './use-cases/login';

@Module({
  imports: [
    PrismaModule,

    ConfigModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),

        signOptions: {
          expiresIn: config.getOrThrow<string>(
            'jwt.expiresIn',
          ) as StringValue,
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    UsersRepository,

    PasswordService,
    TokenService,
    SessionService,

    JwtService,
    JwtStrategy,

    AuthService,

    LoginUseCase,

    JwtAuthGuard,
  ],

  exports: [
    AuthService,

    JwtService,

    UsersRepository,

    JwtAuthGuard,
  ],
})
export class AuthModule {}