import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base/base.repository';
import type { model_colors, model_sizes } from '@prisma/client';

@Injectable()
export class ModelColorsSizesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async assignColor(modelId: bigint, colorId: bigint): Promise<model_colors> {
    return this.db.model_colors.create({
      data: { model_id: modelId, color_id: colorId },
    });
  }

  async removeColor(modelId: bigint, colorId: bigint): Promise<model_colors> {
    return this.db.model_colors.delete({
      where: { model_id_color_id: { model_id: modelId, color_id: colorId } },
    });
  }

  async findColor(
    modelId: bigint,
    colorId: bigint,
  ): Promise<model_colors | null> {
    return this.db.model_colors.findUnique({
      where: { model_id_color_id: { model_id: modelId, color_id: colorId } },
    });
  }

  async assignSize(modelId: bigint, sizeId: bigint): Promise<model_sizes> {
    return this.db.model_sizes.create({
      data: { model_id: modelId, size_id: sizeId },
    });
  }

  async removeSize(modelId: bigint, sizeId: bigint): Promise<model_sizes> {
    return this.db.model_sizes.delete({
      where: { model_id_size_id: { model_id: modelId, size_id: sizeId } },
    });
  }

  async findSize(modelId: bigint, sizeId: bigint): Promise<model_sizes | null> {
    return this.db.model_sizes.findUnique({
      where: { model_id_size_id: { model_id: modelId, size_id: sizeId } },
    });
  }
}
