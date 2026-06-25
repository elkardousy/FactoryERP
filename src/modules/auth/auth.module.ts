import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { StringValue } from 'ms';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { UsersRepository } from './repositories/users.repository';
import { AuthService } from './services/auth.service';
import { JwtService } from './services/jwt.service';

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

  providers: [
    UsersRepository,
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    JwtService,
    JwtStrategy,
  ],

  exports: [
    AuthService,
    JwtService,
    UsersRepository,
      JwtStrategy,
      JwtAuthGuard,
  ],
})
export class AuthModule {}