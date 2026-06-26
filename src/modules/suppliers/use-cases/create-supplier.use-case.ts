import { ConflictException, Injectable } from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { SuppliersRepository } from '../repositories/suppliers.repository';
import { CreateSupplierDto } from '../dto/supplier.dto';

@Injectable()
export class CreateSupplierUseCase {
  constructor(
    private readonly repo: SuppliersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateSupplierDto, actorId: bigint) {
    const existing = await this.repo.findByCode(dto.supplier_code);
    if (existing)
      throw new ConflictException(
        `Supplier code '${dto.supplier_code}' already exists.`,
      );

    const supplier = await this.repo.create({
      supplier_code: dto.supplier_code,
      supplier_name: dto.supplier_name,
      contact_info: dto.contact_info,
    });

    void this.auditService.log({
      eventType: 'SUPPLIER_CREATED',
      entityType: 'suppliers',
      entityId: String(supplier.supplier_id),
      userId: actorId,
      payload: {
        supplier_code: supplier.supplier_code,
        supplier_name: supplier.supplier_name,
      },
    });

    return supplier;
  }
}
