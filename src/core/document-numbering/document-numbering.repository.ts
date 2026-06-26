import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { BaseRepository } from '../database/repositories/base/base.repository';

@Injectable()
export class DocumentNumberingRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async nextValue(sequenceCode: string): Promise<bigint> {
    const seq = await this.db.number_sequences.update({
      where: { sequence_code: sequenceCode },
      data: { current_value: { increment: 1 } },
    });
    return seq.current_value;
  }

  async findByCode(sequenceCode: string) {
    return this.db.number_sequences.findUnique({
      where: { sequence_code: sequenceCode },
    });
  }
}
