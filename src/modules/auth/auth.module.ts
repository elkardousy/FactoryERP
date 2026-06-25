import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import type { StringValue } from 'ms';

import { PrismaModule } from '../../core/database/prisma/prisma.module';

import { UsersRepository } from './repositories/users.repository';
import { AuthService } from './services/auth.service';
import { JwtService } from './services/jwt.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,

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
    JwtService,
  ],

  exports: [
    AuthService,
    JwtService,
    UsersRepository,
  ],
})
export class AuthModule {}