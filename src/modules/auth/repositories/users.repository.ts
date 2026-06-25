import { Injectable } from '@nestjs/common';
import { users, UserStatusEnum } from '@prisma/client';

import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findById(userId: bigint): Promise<users | null> {
    return this.db.users.findUnique({
      where: {
        user_id: userId,
      },
    });
  }

  async findByUsername(username: string): Promise<users | null> {
    return this.db.users.findUnique({
      where: {
        username,
      },
    });
  }

  async findByEmail(email: string): Promise<users | null> {
    return this.db.users.findUnique({
      where: {
        email,
      },
    });
  }

  async findActiveUser(username: string): Promise<users | null> {
    return this.db.users.findFirst({
      where: {
        username,
        is_active: true,
        status: UserStatusEnum.ACTIVE,
      },
      include: {
        roles: true,
      },
    });
  }

  async updateLastLogin(userId: bigint): Promise<void> {
    await this.db.users.update({
      where: {
        user_id: userId,
      },
      data: {
        last_login_at: new Date(),
        failed_login_count: 0,
      },
    });
  }

  async incrementFailedLogin(userId: bigint): Promise<void> {
    await this.db.users.update({
      where: {
        user_id: userId,
      },
      data: {
        failed_login_count: {
          increment: 1,
        },
      },
    });
  }
}