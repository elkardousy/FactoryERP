import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { SuppliersRepository } from '../repositories/suppliers.repository';
import { UpdateSupplierDto } from '../dto/supplier.dto';

@Injectable()
export class UpdateSupplierUseCase {
  constructor(
    private readonly repo: SuppliersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, dto: UpdateSupplierDto, actorId: bigint) {
    const supplierId = BigInt(id);
    const supplier = await this.repo.findById(supplierId);
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found.`);

    if (dto.supplier_code && dto.supplier_code !== supplier.supplier_code) {
      const conflict = await this.repo.findByCode(dto.supplier_code);
      if (conflict)
        throw new ConflictException(
          `Supplier code '${dto.supplier_code}' already exists.`,
        );
    }

    const updated = await this.repo.update(supplierId, {
      supplier_code: dto.supplier_code,
      supplier_name: dto.supplier_name,
      contact_info: dto.contact_info,
    });

    void this.auditService.log({
      eventType: 'SUPPLIER_UPDATED',
      entityType: 'suppliers',
      entityId: String(id),
      userId: actorId,
      payload: dto as Record<string, unknown>,
    });

    return updated;
  }
}
