import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type { model_parts } from '@prisma/client';

interface CreatePartData {
  model_id: bigint;
  part_code: string;
  part_description?: string;
  sort_order?: number;
}
type UpdatePartData = Partial<
  Pick<CreatePartData, 'part_code' | 'part_description' | 'sort_order'>
>;

@Injectable()
export class ModelPartsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreatePartData): Promise<model_parts> {
    return this.db.model_parts.create({ data });
  }

  async update(partId: bigint, data: UpdatePartData): Promise<model_parts> {
    return this.db.model_parts.update({ where: { part_id: partId }, data });
  }

  async findById(partId: bigint): Promise<model_parts | null> {
    return this.db.model_parts.findUnique({ where: { part_id: partId } });
  }

  async findByModelAndCode(
    modelId: bigint,
    partCode: string,
  ): Promise<model_parts | null> {
    return this.db.model_parts.findUnique({
      where: { model_id_part_code: { model_id: modelId, part_code: partCode } },
    });
  }

  async findByModelId(modelId: bigint): Promise<model_parts[]> {
    return this.db.model_parts.findMany({
      where: { model_id: modelId },
      orderBy: { sort_order: 'asc' },
    });
  }

  async delete(partId: bigint): Promise<model_parts> {
    return this.db.model_parts.delete({ where: { part_id: partId } });
  }
}
