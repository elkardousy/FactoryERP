import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { CreateWarehouseDto } from '../dto/warehouse.dto';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    private readonly repo: WarehousesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateWarehouseDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.warehouse_code);
    if (existing)
      throw new ConflictException(
        `Warehouse code '${dto.warehouse_code}' already exists.`,
      );

    const wh = await this.repo.create({
      warehouse_code: dto.warehouse_code,
      warehouse_name: dto.warehouse_name,
      warehouse_type: dto.warehouse_type,
    });

    void this.auditService.log({
      eventType: 'WAREHOUSE_CREATED',
      entityType: 'warehouses',
      entityId: String(wh.warehouse_id),
      userId: actorId,
      payload: {
        warehouse_code: wh.warehouse_code,
        warehouse_type: wh.warehouse_type,
      },
    });

    return wh;
  }
}
