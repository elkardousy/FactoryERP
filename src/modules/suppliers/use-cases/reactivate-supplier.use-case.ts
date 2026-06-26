import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../../core/audit/audit.service';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class ReactivateSupplierUseCase {
  constructor(
    private readonly repo: SuppliersRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: number, actorId: bigint) {
    const supplierId = BigInt(id);
    const supplier = await this.repo.findById(supplierId);
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found.`);
    if (supplier.is_active)
      throw new BadRequestException(`Supplier ${id} is already active.`);

    const result = await this.repo.restore(supplierId);

    void this.auditService.log({
      eventType: 'SUPPLIER_REACTIVATED',
      entityType: 'suppliers',
      entityId: String(id),
      userId: actorId,
      payload: { supplier_id: String(id) },
    });

    return result;
  }
}
