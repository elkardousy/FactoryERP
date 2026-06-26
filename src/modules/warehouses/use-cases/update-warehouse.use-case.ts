import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { UpdateWarehouseDto } from '../dto/warehouse.dto';

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    private readonly repo: WarehousesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateWarehouseDto, actorId: bigint) {
    const warehouseId = BigInt(id);
    const wh = await this.repo.findById(warehouseId);
    if (!wh) throw new NotFoundException(`Warehouse ${id} not found.`);

    if (
      dto.warehouse_type !== undefined &&
      dto.warehouse_type !== wh.warehouse_type
    ) {
      throw new BadRequestException(
        'Warehouse type cannot be changed after creation.',
      );
    }

    if (dto.warehouse_code && dto.warehouse_code !== wh.warehouse_code) {
      const conflict = await this.repo.findByCode(dto.warehouse_code);
      if (conflict)
        throw new ConflictException(
          `Warehouse code '${dto.warehouse_code}' already exists.`,
        );
    }

    const updated = await this.repo.update(warehouseId, {
      warehouse_code: dto.warehouse_code,
      warehouse_name: dto.warehouse_name,
      warehouse_type: dto.warehouse_type,
    });

    void this.auditService.log({
      eventType: 'WAREHOUSE_UPDATED',
      entityType: 'warehouses',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
