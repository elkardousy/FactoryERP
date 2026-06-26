import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { WarehousesRepository } from '../repositories/warehouses.repository';

@Injectable()
export class DeactivateWarehouseUseCase {
  constructor(
    private readonly repo: WarehousesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const warehouseId = BigInt(id);
    const wh = await this.repo.findById(warehouseId);
    if (!wh) throw new NotFoundException(`Warehouse ${id} not found.`);
    if (!wh.is_active)
      throw new BadRequestException(`Warehouse ${id} is already deactivated.`);

    const result = await this.repo.softDelete(warehouseId);

    void this.auditService.log({
      eventType: 'WAREHOUSE_DEACTIVATED',
      entityType: 'warehouses',
      entityId: String(id),
      userId: actorId,
      payload: { warehouse_id: String(id) },
    });

    return result;
  }
}
