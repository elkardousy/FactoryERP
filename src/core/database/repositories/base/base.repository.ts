import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository {
  protected constructor(
    protected readonly prisma: PrismaService,
  ) {}

  protected get db(): PrismaService {
    return this.prisma;
  }

  async executeInTransaction<T>(
    callback: (tx: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback(tx as PrismaService);
    });
  }
}